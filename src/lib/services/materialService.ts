import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type Material = Database['public']['Tables']['materials']['Row'];
type MaterialInsert = Database['public']['Tables']['materials']['Insert'];
type MaterialUpdate = Database['public']['Tables']['materials']['Update'];

export const materialService = {
  /**
   * Get all materials
   */
  async getAll(): Promise<{ data: Material[] | null; error: any }> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    return { data, error };
  },

  /**
   * Get a single material by ID
   */
  async getById(id: number): Promise<{ data: Material | null; error: any }> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  /**
   * Create a new material
   */
  async create(material: MaterialInsert, username: string = 'System'): Promise<{ data: Material | null; error: any }> {
    // Set the last_updated field to current date
    const materialWithDate = {
      ...material,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('materials')
      .insert(materialWithDate)
      .select()
      .single();
    
    // Log the material creation if successful
    if (data && !error) {
      try {
        // Import dynamically to avoid circular dependency
        const { materialLogService } = await import('./materialLogService');
        
        // Create a detailed log entry with all material information
        const logDetails = {
          current_stock: data.current_stock,
          unit: data.unit,
          name: data.name,
          category: data.category,
          threshold: data.threshold,
          bill_number: data.bill_number
        };
        
        // Explicitly log the creation with detailed information
        const logResult = await materialLogService.recordCreation(data.id, username, logDetails);
        
        if (logResult.error) {
          console.error('Error in material log creation:', logResult.error);
        }
      } catch (logError) {
        console.error('Error logging material creation:', logError);
        // Continue even if logging fails
      }
    }
    
    return { data, error };
  },

  /**
   * Update an existing material
   */
  async update(id: number, updates: MaterialUpdate, username: string = 'System'): Promise<{ data: Material | null; error: any }> {
    // Get the original material data for logging
    const { data: originalMaterial } = await this.getById(id);
    
    // Always update the last_updated field
    const updatesWithDate = {
      ...updates,
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('materials')
      .update(updatesWithDate)
      .eq('id', id)
      .select()
      .single();
    
    // Log the material update if successful
    if (data && !error && originalMaterial) {
      try {
        // Import dynamically to avoid circular dependency
        const { materialLogService } = await import('./materialLogService');
        await materialLogService.recordUpdate(id, username, originalMaterial, data);
      } catch (logError) {
        console.error('Error logging material update:', logError);
        // Continue even if logging fails
      }
    }
    
    return { data, error };
  },

  /**
   * Delete a material
   */
  async delete(id: number, username: string = 'System'): Promise<{ error: any }> {
    // Get the material data for logging before deletion
    const { data: materialToDelete } = await this.getById(id);
    
    // Log the material deletion before actually deleting the material
    if (materialToDelete) {
      try {
        // Import dynamically to avoid circular dependency
        const { materialLogService } = await import('./materialLogService');
        await materialLogService.recordDeletion(id, username, materialToDelete);
      } catch (logError) {
        console.error('Error logging material deletion:', logError);
        // Continue even if logging fails
      }
      
      // Update all material_logs for this material to set material_id to null
      // This is necessary to avoid foreign key constraint violations
      try {
        const { error: updateError } = await supabase
          .from('material_logs')
          .update({ material_id: null })
          .eq('material_id', id);
          
        if (updateError) {
          console.error('Error updating material logs before deletion:', updateError);
          return { error: updateError };
        }
      } catch (updateError) {
        console.error('Error updating material logs before deletion:', updateError);
        return { error: updateError };
      }
    }
    
    // Now delete the material after logging and updating material_logs
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  /**
   * Update stock quantity for a material
   */
  async updateStock(id: number, newStock: number, username: string = 'System'): Promise<{ data: Material | null; error: any }> {
    return this.update(id, { 
      current_stock: newStock,
    }, username);
  },

  /**
   * Get materials with low stock (below threshold)
   */
  async getLowStock(): Promise<{ data: Material[] | null; error: any }> {
    // Get all materials and filter those with current_stock less than threshold
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    // Filter the results in JavaScript since we can't directly compare columns in the query
    const filteredData = data?.filter(material => 
      material.current_stock < material.threshold
    ) || null;
    
    return { data: filteredData, error };
  }
};