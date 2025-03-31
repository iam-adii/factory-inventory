import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type Batch = Database['public']['Tables']['batches']['Row'];
type BatchInsert = Database['public']['Tables']['batches']['Insert'];
type BatchUpdate = Database['public']['Tables']['batches']['Update'];
type BatchMaterial = Database['public']['Tables']['batch_materials']['Row'];
type BatchMaterialInsert = Database['public']['Tables']['batch_materials']['Insert'];

export const batchService = {
  /**
   * Get all batches
   */
  async getAll(): Promise<{ data: Batch[] | null; error: any }> {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('date', { ascending: false });
    
    return { data, error };
  },

  /**
   * Get a single batch by ID
   */
  async getById(id: number): Promise<{ data: Batch | null; error: any }> {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  /**
   * Create a new batch
   */
  async create(batch: BatchInsert): Promise<{ data: Batch | null; error: any }> {
    const batchWithDate = {
      ...batch,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('batches')
      .insert(batchWithDate)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Update an existing batch
   */
  async update(id: number, updates: BatchUpdate): Promise<{ data: Batch | null; error: any }> {
    const { data, error } = await supabase
      .from('batches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Delete a batch
   */
  async delete(id: number): Promise<{ error: any }> {
    // First delete all batch materials
    const { error: materialError } = await supabase
      .from('batch_materials')
      .delete()
      .eq('batch_id', id);
    
    if (materialError) return { error: materialError };
    
    // Then delete the batch
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  /**
   * Add materials to a batch
   */
  async addMaterial(batchMaterial: BatchMaterialInsert): Promise<{ data: BatchMaterial | null; error: any }> {
    const materialWithDate = {
      ...batchMaterial,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('batch_materials')
      .insert(materialWithDate)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Get all materials for a batch
   */
  async getBatchMaterials(batchId: number): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('batch_materials')
      .select(`
        id,
        quantity,
        material_id,
        materials(id, name, unit)
      `)
      .eq('batch_id', batchId);
    
    return { data, error };
  },

  /**
   * Remove a material from a batch
   */
  async removeMaterial(batchMaterialId: number): Promise<{ error: any }> {
    const { error } = await supabase
      .from('batch_materials')
      .delete()
      .eq('id', batchMaterialId);
    
    return { error };
  },

  /**
   * Update batch status
   */
  async updateStatus(id: number, status: string): Promise<{ data: Batch | null; error: any }> {
    return this.update(id, { status });
  }
};