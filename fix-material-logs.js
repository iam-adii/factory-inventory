// Script to fix material_logs table by altering the material_id column to allow NULL values
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMaterialLogsTable() {
  try {
    console.log('Attempting to fix material_logs table...');
    
    // First, check if we can run SQL directly (requires admin privileges)
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.material_logs ALTER COLUMN material_id DROP NOT NULL;'
    });
    
    if (sqlError) {
      console.error('Error executing SQL directly:', sqlError);
      console.log('Direct SQL execution failed. This likely requires database admin privileges.');
      console.log('Please run the following SQL in your database:');
      console.log('ALTER TABLE public.material_logs ALTER COLUMN material_id DROP NOT NULL;');
      return;
    }
    
    console.log('Successfully altered material_logs table to allow NULL values for material_id.');
    console.log('You should now be able to delete materials.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixMaterialLogsTable();