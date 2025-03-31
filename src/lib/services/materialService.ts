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
  async create(material: MaterialInsert): Promise<{ data: Material | null; error: any }> {
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
    
    return { data, error };
  },

  /**
   * Update an existing material
   */
  async update(id: number, updates: MaterialUpdate): Promise<{ data: Material | null; error: any }> {
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
    
    return { data, error };
  },

  /**
   * Delete a material
   */
  async delete(id: number): Promise<{ error: any }> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  /**
   * Update stock quantity for a material
   */
  async updateStock(id: number, newStock: number): Promise<{ data: Material | null; error: any }> {
    return this.update(id, { 
      current_stock: newStock,
    });
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