import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type UsageLog = Database['public']['Tables']['usage_logs']['Row'];
type BatchMaterial = Database['public']['Tables']['batch_materials']['Row'];

// Define the transaction type for material history
export interface MaterialTransaction {
  id: string; // Unique identifier (prefixed with type)
  date: string; // ISO date string
  category: 'Purchase' | 'Consumption'; // Type of transaction
  reference: string; // Reference number (invoice or batch number)
  inflow: number | null; // Amount added (for purchases)
  outflow: number | null; // Amount used (for consumption)
  stock: number; // Running balance after this transaction
  notes?: string; // Additional information
  formattedDate?: string; // Formatted date for display
  bill_number?: string | null; // Bill or invoice number for purchases
}

export const materialHistoryService = {
  /**
   * Record a direct stock addition transaction
   */
  async recordDirectStockAddition(materialId: number, quantity: number, billNumber?: string): Promise<{ error: any }> {
    try {
      // We don't have a dedicated stock_additions table, so we'll use the usage_logs table with a negative quantity
      // to represent an addition (this is a workaround until a proper stock_additions table is created)
      const { error } = await supabase
        .from('usage_logs')
        .insert({
          material_id: materialId,
          quantity: -quantity, // Negative quantity represents an addition
          date: new Date().toISOString(),
          username: 'System', // Using generic system identifier instead of user-specific one
          notes: billNumber ? `Direct stock addition (Bill #${billNumber})` : 'Direct stock addition',
          bill_number: billNumber || null,
          created_at: new Date().toISOString()
        });
      
      return { error };
    } catch (error) {
      console.error('Error recording direct stock addition:', error);
      return { error };
    }
  },

  /**
   * Get complete transaction history for a material
   */
  async getMaterialHistory(materialId: number, startDate?: string, endDate?: string): Promise<{ 
    data: MaterialTransaction[] | null; 
    error: any 
  }> {
    try {
      // 1. Get all usage logs for this material (consumption)
      const { data: usageLogs, error: usageError } = await supabase
        .from('usage_logs')
        .select(`
          id,
          quantity,
          date,
          username,
          batch_id,
          notes,
          bill_number,
          batches(batch_number)
        `)
        .eq('material_id', materialId)
        .order('date', { ascending: true });
      
      if (usageError) throw usageError;

      // 2. Get the material to know its current stock
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();
      
      if (materialError) throw materialError;

      // 3. Get all batch materials for this material (for purchases)
      // We need to join with batches to get the batch details
      const { data: batchMaterials, error: batchError } = await supabase
        .from('batch_materials')
        .select(`
          id,
          quantity,
          created_at,
          batches(id, batch_number, date, product)
        `)
        .eq('material_id', materialId);
      
      if (batchError) throw batchError;

      // 4. Transform usage logs to transactions (outflows or direct additions)
      const consumptionTransactions: MaterialTransaction[] = usageLogs?.map(log => {
        // Extract batch number from the batches array (Supabase returns this as an array)
        const batchInfo = log.batches as unknown as { batch_number: string }[] | null;
        const batchNumber = batchInfo && batchInfo[0]?.batch_number;
        
        // Check if this is a direct addition (negative quantity) or consumption
        const isDirect = log.quantity < 0 && log.username === 'System';
        
        return {
          id: `${isDirect ? 'addition' : 'consumption'}-${log.id}`,
          date: log.date,
          category: isDirect ? 'Purchase' : 'Consumption',
          reference: isDirect ? (log.bill_number ? `Bill #${log.bill_number}` : 'Direct Addition') : (batchNumber ? `B-${batchNumber}` : '-'),
          inflow: isDirect ? Math.abs(log.quantity) : null,
          outflow: isDirect ? null : log.quantity,
          stock: 0, // Will calculate later
          notes: log.notes || undefined,
          bill_number: log.bill_number || null
        };
      }) || [];

      // 5. Transform batch materials to transactions (inflows)
      // For this example, we'll assume batch materials are purchases
      // In a real system, you might have a separate purchases table
      const purchaseTransactions: MaterialTransaction[] = batchMaterials?.map(bm => {
        // Extract the batch information from the batches array (Supabase returns this as an array)
        const batchInfo = bm.batches as unknown as { id: number, batch_number: string, date: string, product: string }[] | null;
        const batch = batchInfo && batchInfo[0];
        
        return {
          id: `purchase-${bm.id}`,
          date: batch?.date || bm.created_at,
          category: 'Purchase',
          reference: batch?.batch_number ? `INV${batch.batch_number.slice(-3)}` : '-',
          inflow: bm.quantity,
          outflow: null,
          stock: 0, // Will calculate later
          notes: `Added for batch ${batch?.batch_number || 'Unknown'}`
        };
      }) || [];

      // 6. Combine and sort all transactions by date (newest to oldest for better visibility of recent transactions)
      let allTransactions = [...consumptionTransactions, ...purchaseTransactions];
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 7. Apply date filters if provided
      if (startDate) {
        allTransactions = allTransactions.filter(t => 
          new Date(t.date) >= new Date(startDate)
        );
      }
      
      if (endDate) {
        allTransactions = allTransactions.filter(t => 
          new Date(t.date) <= new Date(endDate)
        );
      }

      // 8. Calculate running balance for each transaction
      // We'll work backwards from the current stock
      // Get the latest material data to ensure we have the most up-to-date stock value
      const { data: latestMaterial, error: latestMaterialError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();
      
      if (latestMaterialError) throw latestMaterialError;
      
      let runningStock = latestMaterial?.current_stock || 0;
      
      // Reverse the array to calculate from current stock backwards
      const reversedTransactions = [...allTransactions].reverse();
      
      for (const transaction of reversedTransactions) {
        transaction.stock = runningStock;
        
        // Adjust running stock based on transaction type
        if (transaction.category === 'Purchase' && transaction.inflow) {
          runningStock -= transaction.inflow;
        } else if (transaction.category === 'Consumption' && transaction.outflow) {
          runningStock += transaction.outflow;
        }
      }
      
      // Keep the reversed order to show newest transactions first
      allTransactions = reversedTransactions;
      
      // Format dates for better readability
      allTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        transaction.formattedDate = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        });
      });

      // Add a starting balance entry if there are transactions
      if (allTransactions.length > 0) {
        const firstTransaction = allTransactions[0];
        const startingStock = firstTransaction.stock - (firstTransaction.inflow || 0) + (firstTransaction.outflow || 0);
        
        // Add a starting balance entry at the beginning
        if (startingStock > 0) {
          const startDate = new Date(firstTransaction.date);
          startDate.setDate(startDate.getDate() - 1); // One day before first transaction
          
          allTransactions.unshift({
            id: 'starting-balance',
            date: startDate.toISOString(),
            category: 'Purchase', // Just for display purposes
            reference: '-',
            inflow: null,
            outflow: null,
            stock: startingStock,
            notes: 'Starting balance'
          });
        }
      }

      return { data: allTransactions, error: null };
    } catch (error) {
      console.error('Error fetching material history:', error);
      return { data: null, error };
    }
  }
};