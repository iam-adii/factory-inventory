# Material Logs - Dummy Data Generator

This directory contains scripts to generate and insert dummy log data into the `material_logs` table in your Supabase database. These logs represent a history of material-related actions (create, update, delete) with appropriate timestamps, usernames, and detailed information.

## Available Scripts

### SQL Script (Recommended)

The SQL script is the recommended method as it bypasses Row Level Security (RLS) issues and can be run directly in the Supabase SQL Editor.

**File:** `insert_dummy_material_logs.sql`

**How to use:**
1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `insert_dummy_material_logs.sql`
4. Run the script

The script will:
- Check if materials exist in your database
- Create sample materials if none exist
- Generate dummy log entries for each material including:
  - Creation logs
  - 2-4 update logs per material
  - Occasional deletion logs (20% chance per material)
- Use realistic timestamps spanning the last 30 days
- Use various sample usernames

### JavaScript Script (Alternative)

**File:** `insert-material-logs.js`

**Note:** This script may encounter RLS policy issues if you don't have the appropriate permissions.

**How to use:**
```
node insert-material-logs.js
```

## Viewing the Logs

After running either script, you can view the generated logs in your application's Material Logs section or directly in the Supabase Table Editor.

## Troubleshooting

If you encounter RLS policy errors when using the JavaScript script, use the SQL script instead, or refer to `disable_rls_function.sql` for information on temporarily disabling RLS (requires admin privileges).