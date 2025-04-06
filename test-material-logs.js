// Simple script to test material_logs table connection
import { createClient } from '@supabase/supabase-js';

// Use the credentials from .env file
const supabaseUrl = 'https://eolunpxwxvybielkntbb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbHVucHh3eHZ5YmllbGtudGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDY5MzAsImV4cCI6MjA1NzYyMjkzMH0.723nMADDJv222jHjs3AcGfjW8ayA_z7q30aMhrfboZg';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test material_logs table
async function testMaterialLogsTable() {
  try {
    console.log('Testing connection to material_logs table...');
    const { data, error } = await supabase.from('material_logs').select('*').limit(5);
    
    if (error) {
      console.error('Error connecting to material_logs table:', error.message);
      if (error.code === '42P01') {
        console.log('The "material_logs" table does not exist. You need to run the material_logs_setup.sql script.');
      }
    } else {
      console.log('Successfully connected to material_logs table!');
      console.log(`Found ${data.length} log entries.`);
      if (data.length > 0) {
        console.log('Sample log entry:', data[0]);
      }
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

testMaterialLogsTable();