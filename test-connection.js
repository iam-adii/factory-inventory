// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

// Use the credentials from .env file
const supabaseUrl = 'https://eolunpxwxvybielkntbb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbHVucHh3eHZ5YmllbGtudGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDY5MzAsImV4cCI6MjA1NzYyMjkzMH0.723nMADDJv222jHjs3AcGfjW8ayA_z7q30aMhrfboZg';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  try {
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('materials').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      if (error.code === '42P01') {
        console.log('The "materials" table does not exist yet. This is expected if you haven\'t created the tables.');
        console.log('The connection to Supabase is working, but you need to create the tables using the SQL script.');
      }
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

testConnection();