import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type Setting = Database['public']['Tables']['settings']['Row'];
type SettingInsert = Database['public']['Tables']['settings']['Insert'];
type SettingUpdate = Database['public']['Tables']['settings']['Update'];

export const settingsService = {
  /**
   * Get a setting by key
   */
  async getByKey(key: string, userId?: string): Promise<{ data: Setting | null; error: any }> {
    let query = supabase
      .from('settings')
      .select('*')
      .eq('key', key);
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }
    
    const { data, error } = await query.single();
    
    return { data, error };
  },

  /**
   * Get all settings for a user
   */
  async getAllForUser(userId?: string): Promise<{ data: Setting[] | null; error: any }> {
    let query = supabase.from('settings').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }
    
    const { data, error } = await query;
    
    return { data, error };
  },

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: any, userId?: string): Promise<{ data: Setting | null; error: any }> {
    // Check if setting exists
    let query = supabase
      .from('settings')
      .select('*')
      .eq('key', key);
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }
    
    const { data: existingSetting, error: fetchError } = await query.maybeSingle();
    
    if (fetchError) {
      return { data: null, error: fetchError };
    }
    
    if (existingSetting) {
      // Update existing setting
      const { data, error } = await supabase
        .from('settings')
        .update({ value })
        .eq('id', existingSetting.id)
        .select()
        .single();
      
      return { data, error };
    } else {
      // Create new setting
      const newSetting: SettingInsert = {
        key,
        value,
        user_id: userId || null,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('settings')
        .insert(newSetting)
        .select()
        .single();
      
      return { data, error };
    }
  },

  /**
   * Delete a setting
   */
  async deleteSetting(key: string, userId?: string): Promise<{ error: any }> {
    let query = supabase
      .from('settings')
      .delete()
      .eq('key', key);
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }
    
    const { error } = await query;
    
    return { error };
  },

  /**
   * Get theme setting
   */
  async getTheme(userId?: string): Promise<{ theme: string; error: any }> {
    const { data, error } = await this.getByKey('theme', userId);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      return { theme: 'system', error };
    }
    
    return { 
      theme: data?.value as string || 'system',
      error: null
    };
  },

  /**
   * Set theme setting
   */
  async setTheme(theme: string, userId?: string): Promise<{ error: any }> {
    const { error } = await this.setSetting('theme', theme, userId);
    return { error };
  }
};