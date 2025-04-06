// Test script to check material deletion
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function testDeleteMaterial() {
  try {
    console.log('Testing material deletion...');
    
    // First, let's check if there are any materials we can test with
    const { data: materials, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching materials:', fetchError);
      return;
    }
    
    if (!materials || materials.length === 0) {
      console.log('No materials found to test deletion.');
      return;
    }
    
    const testMaterial = materials[0];
    console.log(`Found material to test: ID ${testMaterial.id}, Name: ${testMaterial.name}`);
    
    // Check for any foreign key constraints that might prevent deletion
    console.log('Checking for usage_logs referencing this material...');
    const { data: usageLogs, error: usageError } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('material_id', testMaterial.id);
    
    if (usageError) {
      console.error('Error checking usage_logs:', usageError);
    } else {
      console.log(`Found ${usageLogs?.length || 0} usage logs referencing this material.`);
    }
    
    console.log('Checking for batch_materials referencing this material...');
    const { data: batchMaterials, error: batchError } = await supabase
      .from('batch_materials')
      .select('id')
      .eq('material_id', testMaterial.id);
    
    if (batchError) {
      console.error('Error checking batch_materials:', batchError);
    } else {
      console.log(`Found ${batchMaterials?.length || 0} batch materials referencing this material.`);
    }
    
    console.log('Checking for material_logs referencing this material...');
    const { data: materialLogs, error: logsError } = await supabase
      .from('material_logs')
      .select('id')
      .eq('material_id', testMaterial.id);
    
    if (logsError) {
      console.error('Error checking material_logs:', logsError);
    } else {
      console.log(`Found ${materialLogs?.length || 0} material logs referencing this material.`);
    }
    
    // Now try to delete the material
    console.log(`Attempting to delete material ID ${testMaterial.id}...`);
    const { error: deleteError } = await supabase
      .from('materials')
      .delete()
      .eq('id', testMaterial.id);
    
    if (deleteError) {
      console.error('Error deleting material:', deleteError);
      console.log('Full error details:', JSON.stringify(deleteError, null, 2));
    } else {
      console.log('Material deleted successfully!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the test function
testDeleteMaterial();