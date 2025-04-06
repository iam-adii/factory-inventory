import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

// Define the MaterialLog type
export interface MaterialLog {
  id: number;
  material_id: number;
  action_type: 'create' | 'update' | 'delete';
  username: string; // Generic identifier, not tied to specific users
  timestamp: string;
  details: any; // JSON object containing the details of the action
  material_name?: string;
  material_category?: string;
  material_unit?: string;
}

export const materialLogService = {
  /**
   * Get all material logs
   */
  async getAll(): Promise<{ data: MaterialLog[] | null; error: any }> {
    const { data, error } = await supabase
      .from('material_logs')
      .select('*, materials(name, category, unit)')
      .order('timestamp', { ascending: false });
    
    return { data, error };
  },

  /**
   * Get material logs with filters
   */
  async getFiltered(filters: {
    material_id?: number;
    action_type?: 'create' | 'update' | 'delete';
    user?: string; // Kept for backward compatibility
    username?: string; // Added to match parameter from MaterialLogTable
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: MaterialLog[] | null; error: any }> {
    let query = supabase
      .from('material_logs')
      .select('*, materials(name, category, unit)');
    
    if (filters.material_id) {
      query = query.eq('material_id', filters.material_id);
    }
    
    if (filters.action_type) {
      query = query.eq('action_type', filters.action_type);
    }
    
    // Handle both user and username parameters for backward compatibility
    if (filters.user) {
      query = query.ilike('username', `%${filters.user}%`);
    } else if (filters.username) {
      query = query.ilike('username', `%${filters.username}%`);
    }
    
    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo);
    }
    
    const { data, error } = await query.order('timestamp', { ascending: false });
    
    return { data, error };
  },

  /**
   * Get logs for a specific material
   */
  async getByMaterial(materialId: number): Promise<{ data: MaterialLog[] | null; error: any }> {
    const { data, error } = await supabase
      .from('material_logs')
      .select('*, materials(name, category, unit)')
      .eq('material_id', materialId)
      .order('timestamp', { ascending: false });
    
    return { data, error };
  },

  /**
   * Record a material creation event
   */
  async recordCreation(materialId: number, user: string = 'System', materialData: any): Promise<{ error: any }> {
    // Ensure we have a properly formatted details object
    const details = {
      current_stock: materialData.current_stock || 0,
      unit: materialData.unit || '',
      name: materialData.name || 'Unknown',
      category: materialData.category || 'Unknown',
      threshold: materialData.threshold || 0,
      bill_number: materialData.bill_number || null
    };
    
    console.log('Recording material creation:', { materialId, user, details });
    
    const { error } = await supabase
      .from('material_logs')
      .insert({
        material_id: materialId,
        action_type: 'create',
        username: user, // Using username field instead of user
        timestamp: new Date().toISOString(),
        details: details
      });
    
    if (error) {
      console.error('Error recording material creation:', error);
    }
    
    return { error };
  },

  /**
   * Record a material update event
   */
  async recordUpdate(materialId: number, user: string = 'System', oldData: any, newData: any): Promise<{ error: any }> {
    const { error } = await supabase
      .from('material_logs')
      .insert({
        material_id: materialId,
        action_type: 'update',
        username: user, // Using username field instead of user
        timestamp: new Date().toISOString(),
        details: {
          old: oldData,
          new: newData,
          changes: getChanges(oldData, newData)
        }
      });
    
    return { error };
  },

  /**
   * Record a material deletion event
   */
  async recordDeletion(materialId: number, user: string = 'System', materialData: any): Promise<{ error: any }> {
    // Store material name and other important details explicitly
    // This ensures we can display the material name even after material_id becomes null
    const details = {
      name: materialData.name || 'Unknown',
      category: materialData.category || 'Unknown',
      unit: materialData.unit || '',
      current_stock: materialData.current_stock || 0,
      threshold: materialData.threshold || 0,
      bill_number: materialData.bill_number || null,
      deleted_at: new Date().toISOString()
    };
    
    console.log('Recording material deletion:', { materialId, user, details });
    
    const { error } = await supabase
      .from('material_logs')
      .insert({
        material_id: materialId,
        action_type: 'delete',
        username: user, // Using username field instead of user
        timestamp: new Date().toISOString(),
        details: details
      });
    
    if (error) {
      console.error('Error recording material deletion:', error);
    }
    
    return { error };
  }
};

// Helper function to identify changes between old and new data
function getChanges(oldData: any, newData: any): Record<string, { old: any, new: any }> {
  const changes: Record<string, { old: any, new: any }> = {};
  
  // Compare each property in newData with oldData
  Object.keys(newData).forEach(key => {
    // Skip if the property doesn't exist in oldData
    if (!(key in oldData)) return;
    
    // If values are different, record the change
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = {
        old: oldData[key],
        new: newData[key]
      };
    }
  });
  
  return changes;
}