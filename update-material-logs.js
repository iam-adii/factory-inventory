// Script to update material_logs records to set material_id to null for a specific material
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

async function updateMaterialLogs() {
  try {
    // Get the material ID from command line arguments
    const materialId = process.argv[2];
    
    if (!materialId) {
      console.error('Please provide a material ID as an argument.');
      console.log('Usage: node update-material-logs.js <material_id>');
      return;
    }
    
    console.log(`Updating material_logs for material ID ${materialId}...`);
    
    // First, check if there are any logs for this material
    const { data: logs, error: fetchError } = await supabase
      .from('material_logs')
      .select('id')
      .eq('material_id', materialId);
    
    if (fetchError) {
      console.error('Error fetching material logs:', fetchError);
      return;
    }
    
    if (!logs || logs.length === 0) {
      console.log('No material logs found for this material ID.');
      return;
    }
    
    console.log(`Found ${logs.length} logs for material ID ${materialId}.`);
    
    // Now update all logs for this material to set material_id to null
    const { error: updateError } = await supabase
      .from('material_logs')
      .update({ material_id: null })
      .eq('material_id', materialId);
    
    if (updateError) {
      console.error('Error updating material logs:', updateError);
      return;
    }
    
    console.log(`Successfully updated ${logs.length} material logs.`);
    console.log('You should now be able to delete the material.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateMaterialLogs();