import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type UsageLog = Database['public']['Tables']['usage_logs']['Row'];
type UsageLogInsert = Database['public']['Tables']['usage_logs']['Insert'];
type UsageLogUpdate = Database['public']['Tables']['usage_logs']['Update'];

export const usageLogService = {
  /**
   * Get all usage logs
   */
  async getAll(): Promise<{ data: UsageLog[] | null; error: any }> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, materials(name, category, unit), batches(batch_number)')
      .order('date', { ascending: false });
    
    return { data, error };
  },

  /**
   * Get a single usage log by ID
   */
  async getById(id: number): Promise<{ data: UsageLog | null; error: any }> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, materials(name, category, unit), batches(batch_number)')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  /**
   * Create a new usage log
   */
  async create(usageLog: UsageLogInsert): Promise<{ data: UsageLog | null; error: any }> {
    const logWithDate = {
      ...usageLog,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('usage_logs')
      .insert(logWithDate)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Update an existing usage log
   */
  async update(id: number, updates: UsageLogUpdate): Promise<{ data: UsageLog | null; error: any }> {
    const { data, error } = await supabase
      .from('usage_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  /**
   * Delete a usage log
   */
  async delete(id: number): Promise<{ error: any }> {
    const { error } = await supabase
      .from('usage_logs')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  /**
   * Get usage logs with filters
   */
  async getFiltered(filters: {
    material_id?: number;
    user?: string;
    dateFrom?: string;
    dateTo?: string;
    batch_id?: number;
  }): Promise<{ data: UsageLog[] | null; error: any }> {
    let query = supabase
      .from('usage_logs')
      .select('*, materials(name, category, unit), batches(batch_number)');
    
    if (filters.material_id) {
      query = query.eq('material_id', filters.material_id);
    }
    
    if (filters.user) {
      query = query.ilike('username', `%${filters.user}%`);
    }
    
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    
    if (filters.batch_id) {
      query = query.eq('batch_id', filters.batch_id);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    return { data, error };
  },

  /**
   * Get usage logs for a specific material
   */
  async getByMaterial(materialId: number): Promise<{ data: UsageLog[] | null; error: any }> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, materials(name, category, unit), batches(batch_number)')
      .eq('material_id', materialId)
      .order('date', { ascending: false });
    
    return { data, error };
  },

  /**
   * Get usage logs for a specific batch
   */
  async getByBatch(batchId: number): Promise<{ data: UsageLog[] | null; error: any }> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, materials(name, category, unit), batches(batch_number)')
      .eq('batch_id', batchId)
      .order('date', { ascending: false });
    
    return { data, error };
  }
};