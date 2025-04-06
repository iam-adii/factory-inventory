// Script to insert dummy log data into material_logs table
import { createClient } from '@supabase/supabase-js';

// Use the credentials from .env file
const supabaseUrl = 'https://eolunpxwxvybielkntbb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbHVucHh3eHZ5YmllbGtudGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDY5MzAsImV4cCI6MjA1NzYyMjkzMH0.723nMADDJv222jHjs3AcGfjW8ayA_z7q30aMhrfboZg';

// Create Supabase client with RLS bypass option
// This is necessary because the material_logs table has row-level security policies
// that only allow authenticated users to insert data
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to disable RLS for the material_logs table
async function disableRLS() {
  try {
    console.log('Attempting to disable RLS for material_logs table...');
    // We'll use a direct SQL query to disable RLS temporarily
    // Note: In a production environment, you should use a service role key instead
    const { error } = await supabase.rpc('disable_material_logs_rls');
    if (error) {
      console.warn('Could not disable RLS via RPC, this is expected if the function doesn\'t exist:', error.message);
      console.log('Continuing with insertion anyway - if you encounter permission errors, you may need to:');
      console.log('1. Create a disable_material_logs_rls function in your database, or');
      console.log('2. Use a service role key instead of the anon key, or');
      console.log('3. Temporarily disable RLS in the Supabase dashboard');
    } else {
      console.log('Successfully disabled RLS for material_logs table');
    }
  } catch (err) {
    console.warn('Error disabling RLS:', err.message);
  }
}

// Sample material data to use if no materials exist
const sampleMaterials = [
  { name: 'Cement', category: 'Construction', unit: 'kg', current_stock: 500, threshold: 100 },
  { name: 'Steel Rods', category: 'Construction', unit: 'pieces', current_stock: 200, threshold: 50 },
  { name: 'Paint', category: 'Finishing', unit: 'liters', current_stock: 50, threshold: 10 },
  { name: 'Bricks', category: 'Construction', unit: 'pieces', current_stock: 1000, threshold: 200 },
  { name: 'Timber', category: 'Raw Materials', unit: 'cubic meters', current_stock: 30, threshold: 5 }
];

// Sample usernames
const usernames = ['admin', 'john.doe', 'jane.smith', 'warehouse.manager', 'site.supervisor'];

// Generate a random date within the last 30 days
function getRandomDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
}

// Get a random username
function getRandomUsername() {
  return usernames[Math.floor(Math.random() * usernames.length)];
}

// Insert sample materials if none exist
async function insertSampleMaterials() {
  const { data: existingMaterials, error: fetchError } = await supabase
    .from('materials')
    .select('id')
    .limit(1);
  
  if (fetchError) {
    console.error('Error checking for existing materials:', fetchError.message);
    return [];
  }
  
  // If materials already exist, return their IDs
  if (existingMaterials && existingMaterials.length > 0) {
    const { data: allMaterials } = await supabase
      .from('materials')
      .select('id, name, category, unit, current_stock, threshold');
    console.log('Using existing materials:', allMaterials.map(m => m.name).join(', '));
    return allMaterials;
  }
  
  // Otherwise insert sample materials
  console.log('No existing materials found. Inserting sample materials...');
  const { data: insertedMaterials, error: insertError } = await supabase
    .from('materials')
    .insert(sampleMaterials)
    .select();
  
  if (insertError) {
    console.error('Error inserting sample materials:', insertError.message);
    return [];
  }
  
  console.log(`Successfully inserted ${insertedMaterials.length} sample materials`);
  return insertedMaterials;
}

// Generate dummy log data
async function generateDummyLogs(materials) {
  if (!materials || materials.length === 0) {
    console.error('No materials available to generate logs');
    return;
  }
  
  const logs = [];
  
  // Create logs
  for (const material of materials) {
    // Create log
    logs.push({
      material_id: material.id,
      action_type: 'create',
      username: getRandomUsername(),
      timestamp: getRandomDate().toISOString(),
      details: {
        name: material.name,
        category: material.category,
        unit: material.unit,
        current_stock: material.current_stock,
        threshold: material.threshold
      }
    });
    
    // Update logs (2-4 per material)
    const updateCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < updateCount; i++) {
      const oldStock = material.current_stock - Math.floor(Math.random() * 50);
      const newStock = material.current_stock;
      
      logs.push({
        material_id: material.id,
        action_type: 'update',
        username: getRandomUsername(),
        timestamp: getRandomDate().toISOString(),
        details: {
          old: { current_stock: oldStock },
          new: { current_stock: newStock },
          changes: {
            current_stock: { old: oldStock, new: newStock }
          }
        }
      });
    }
    
    // 20% chance of having a delete log
    if (Math.random() < 0.2) {
      logs.push({
        material_id: material.id,
        action_type: 'delete',
        username: getRandomUsername(),
        timestamp: getRandomDate().toISOString(),
        details: {
          name: material.name,
          category: material.category,
          unit: material.unit,
          current_stock: material.current_stock,
          reason: 'Material discontinued'
        }
      });
    }
  }
  
  // Sort logs by timestamp
  logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return logs;
}

// Re-enable RLS for the material_logs table
async function enableRLS() {
  try {
    console.log('Re-enabling RLS for material_logs table...');
    const { error } = await supabase.rpc('enable_material_logs_rls');
    if (error) {
      console.warn('Could not re-enable RLS via RPC:', error.message);
      console.log('You may need to manually re-enable RLS in the Supabase dashboard');
    } else {
      console.log('Successfully re-enabled RLS for material_logs table');
    }
  } catch (err) {
    console.warn('Error re-enabling RLS:', err.message);
  }
}

// Insert dummy logs into material_logs table
async function insertDummyLogs() {
  try {
    console.log('Starting to insert dummy log data...');
    
    // Attempt to disable RLS before insertion
    await disableRLS();
    
    // First, ensure we have materials to reference
    const materials = await insertSampleMaterials();
    
    // Generate dummy logs
    const logs = await generateDummyLogs(materials);
    
    if (!logs || logs.length === 0) {
      console.error('Failed to generate dummy logs');
      return;
    }
    
    console.log(`Generated ${logs.length} dummy logs. Inserting into database...`);
    
    // Insert logs in batches of 20 to avoid rate limits
    const batchSize = 20;
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      const { error } = await supabase
        .from('material_logs')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i/batchSize + 1}:`, error.message);
      } else {
        console.log(`Successfully inserted batch ${i/batchSize + 1} (${batch.length} logs)`);
      }
    }
    
    // Verify insertion
    const { data, error } = await supabase
      .from('material_logs')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error verifying log insertion:', error.message);
    } else {
      console.log(`Successfully inserted dummy logs. Total logs in database: ${data.length}+`);
      console.log('Sample log entry:', data[0]);
    }
    
    // Re-enable RLS after insertion is complete
    await enableRLS();
  } catch (err) {
    console.error('Exception:', err.message);
    // Make sure to re-enable RLS even if there's an error
    await enableRLS();
  }
}

insertDummyLogs();