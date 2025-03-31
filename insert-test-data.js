// Script to insert test data into all tables
import { createClient } from '@supabase/supabase-js';

// Use the credentials from .env file
const supabaseUrl = 'https://eolunpxwxvybielkntbb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbHVucHh3eHZ5YmllbGtudGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDY5MzAsImV4cCI6MjA1NzYyMjkzMH0.723nMADDJv222jHjs3AcGfjW8ayA_z7q30aMhrfboZg';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  try {
    console.log('Starting to insert test data...');
    
    // 1. Insert test material
    console.log('Inserting test material...');
    const { data: materialData, error: materialError } = await supabase
      .from('materials')
      .insert({
        name: 'Test Material',
        category: 'Test Category',
        current_stock: 100,
        unit: 'kg',
        threshold: 20
      })
      .select()
      .single();
    
    if (materialError) {
      console.error('Error inserting material:', materialError.message);
      return;
    }
    
    console.log('Material inserted successfully:', materialData);
    const materialId = materialData.id;
    
    // 2. Insert test batch
    console.log('Inserting test batch...');
    const { data: batchData, error: batchError } = await supabase
      .from('batches')
      .insert({
        batch_number: 'BATCH-001',
        product: 'Test Product',
        date: new Date().toISOString(),
        status: 'In Progress',
        description: 'This is a test batch'
      })
      .select()
      .single();
    
    if (batchError) {
      console.error('Error inserting batch:', batchError.message);
      return;
    }
    
    console.log('Batch inserted successfully:', batchData);
    const batchId = batchData.id;
    
    // 3. Insert batch_material (junction table)
    console.log('Inserting batch material relationship...');
    const { data: batchMaterialData, error: batchMaterialError } = await supabase
      .from('batch_materials')
      .insert({
        batch_id: batchId,
        material_id: materialId,
        quantity: 25
      })
      .select()
      .single();
    
    if (batchMaterialError) {
      console.error('Error inserting batch material:', batchMaterialError.message);
      return;
    }
    
    console.log('Batch material inserted successfully:', batchMaterialData);
    
    // 4. Insert usage log
    console.log('Inserting usage log...');
    const { data: usageLogData, error: usageLogError } = await supabase
      .from('usage_logs')
      .insert({
        material_id: materialId,
        quantity: 10,
        date: new Date().toISOString(),
        username: 'test_user', // Note: changed from 'user' to 'username' as per schema
        batch_id: batchId,
        notes: 'Test usage log'
      })
      .select()
      .single();
    
    if (usageLogError) {
      console.error('Error inserting usage log:', usageLogError.message);
      return;
    }
    
    console.log('Usage log inserted successfully:', usageLogData);
    
    // 5. Insert settings
    console.log('Inserting settings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .insert({
        key: 'test_setting',
        value: { theme: 'dark', notifications: true },
        user_id: 'test_user_id'
      })
      .select()
      .single();
    
    if (settingsError) {
      console.error('Error inserting settings:', settingsError.message);
      return;
    }
    
    console.log('Settings inserted successfully:', settingsData);
    
    console.log('All test data inserted successfully!');
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

insertTestData();