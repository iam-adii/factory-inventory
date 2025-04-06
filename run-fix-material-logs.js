// Script to execute the SQL fix for material_logs table
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

async function fixMaterialLogsConstraint() {
  try {
    console.log('Attempting to fix material_logs table constraint...');
    
    // Step 1: Drop the existing foreign key constraint if it exists
    console.log('Step 1: Dropping existing foreign key constraint...');
    const { error: dropConstraintError } = await supabase.rpc('exec_sql', {
      sql_query: `
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'material_logs_material_id_fkey'
            AND table_name = 'material_logs'
          ) THEN
            ALTER TABLE public.material_logs DROP CONSTRAINT material_logs_material_id_fkey;
          END IF;
        END $$;
      `
    });
    
    if (dropConstraintError) {
      console.error('Error dropping constraint:', dropConstraintError);
      console.log('You may need to run this SQL in the Supabase SQL editor:');
      console.log(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'material_logs_material_id_fkey'
            AND table_name = 'material_logs'
          ) THEN
            ALTER TABLE public.material_logs DROP CONSTRAINT material_logs_material_id_fkey;
          END IF;
        END $$;
      `);
    } else {
      console.log('Successfully dropped constraint (if it existed)');
    }
    
    // Step 2: Drop the NOT NULL constraint on material_id column
    console.log('Step 2: Dropping NOT NULL constraint on material_id column...');
    const { error: dropNotNullError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.material_logs ALTER COLUMN material_id DROP NOT NULL;'
    });
    
    if (dropNotNullError) {
      console.error('Error dropping NOT NULL constraint:', dropNotNullError);
      console.log('You may need to run this SQL in the Supabase SQL editor:');
      console.log('ALTER TABLE public.material_logs ALTER COLUMN material_id DROP NOT NULL;');
    } else {
      console.log('Successfully dropped NOT NULL constraint');
    }
    
    // Step 3: Re-add the foreign key constraint with ON DELETE SET NULL
    console.log('Step 3: Re-adding foreign key constraint with ON DELETE SET NULL...');
    const { error: addConstraintError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.material_logs
        ADD CONSTRAINT material_logs_material_id_fkey
        FOREIGN KEY (material_id)
        REFERENCES public.materials(id)
        ON DELETE SET NULL;
      `
    });
    
    if (addConstraintError) {
      console.error('Error adding constraint:', addConstraintError);
      console.log('You may need to run this SQL in the Supabase SQL editor:');
      console.log(`
        ALTER TABLE public.material_logs
        ADD CONSTRAINT material_logs_material_id_fkey
        FOREIGN KEY (material_id)
        REFERENCES public.materials(id)
        ON DELETE SET NULL;
      `);
    } else {
      console.log('Successfully added foreign key constraint with ON DELETE SET NULL');
    }
    
    // Step 4: Verify the change
    console.log('Step 4: Verifying the change...');
    const { data, error: verifyError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'material_logs' AND column_name = 'material_id';
      `
    });
    
    if (verifyError) {
      console.error('Error verifying change:', verifyError);
    } else {
      console.log('Verification result:', data);
      console.log('If is_nullable shows "YES", the fix was successful.');
    }
    
    console.log('Fix attempt completed. You should now be able to delete materials.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
fixMaterialLogsConstraint();