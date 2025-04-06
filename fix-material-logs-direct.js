// Script to fix material_logs table by directly updating records and structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configure dotenv to load environment variables
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
    
    // Step 1: Check if the material_logs table exists
    console.log('Step 1: Checking if material_logs table exists...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('material_logs')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing material_logs table:', tableError);
      return;
    }
    
    console.log('material_logs table exists.');
    
    // Step 2: Update all material_logs records to set material_id to null for any material that's being deleted
    // This is a workaround since we can't directly alter the constraint through the API
    console.log('Step 2: Updating material_logs records for the material being deleted...');
    
    // First, get the ID of the material that's causing the issue (from the error message)
    // We'll look for any material that has deletion logs but still exists
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id, name')
      .limit(10); // Get a few materials to check
    
    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return;
    }
    
    console.log(`Found ${materials?.length || 0} materials to check.`);
    
    // For each material, check if it has deletion logs
    for (const material of materials || []) {
      const { data: deletionLogs, error: logsError } = await supabase
        .from('material_logs')
        .select('id')
        .eq('material_id', material.id)
        .eq('action_type', 'delete');
      
      if (logsError) {
        console.error(`Error checking logs for material ${material.id}:`, logsError);
        continue;
      }
      
      if (deletionLogs && deletionLogs.length > 0) {
        console.log(`Material ${material.id} (${material.name}) has ${deletionLogs.length} deletion logs but still exists.`);
        console.log('This material might be causing the constraint issue. Attempting to fix...');
        
        // Update all material_logs for this material to set material_id to null
        const { error: updateError } = await supabase
          .from('material_logs')
          .update({ material_id: null })
          .eq('material_id', material.id);
        
        if (updateError) {
          console.error(`Error updating logs for material ${material.id}:`, updateError);
        } else {
          console.log(`Successfully updated logs for material ${material.id}.`);
          console.log('You should now be able to delete this material.');
        }
      }
    }
    
    // Step 3: Provide instructions for fixing the database schema
    console.log('\nStep 3: Instructions for fixing the database schema');
    console.log('To permanently fix this issue, you need to run the following SQL in your Supabase SQL Editor:');
    console.log('\n--- SQL to fix material_logs table ---');
    console.log(`
-- First, drop the existing foreign key constraint if it exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'material_logs_material_id_fkey'
        AND table_name = 'material_logs'
    ) THEN
        ALTER TABLE public.material_logs DROP CONSTRAINT material_logs_material_id_fkey;
    END IF;
END $$;

-- Drop the NOT NULL constraint on material_id column
ALTER TABLE public.material_logs ALTER COLUMN material_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.material_logs
    ADD CONSTRAINT material_logs_material_id_fkey
    FOREIGN KEY (material_id)
    REFERENCES public.materials(id)
    ON DELETE SET NULL;
    `);
    
    console.log('\nAfter running this SQL, the issue should be permanently fixed.');
    console.log('You can access the SQL Editor in your Supabase dashboard under the "SQL Editor" tab.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
fixMaterialLogsTable();