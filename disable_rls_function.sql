-- Function to disable RLS for material_logs table
-- This should be executed in the Supabase SQL editor

CREATE OR REPLACE FUNCTION public.disable_material_logs_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Temporarily disable RLS for material_logs table
  ALTER TABLE public.material_logs DISABLE ROW LEVEL SECURITY;
  
  -- You might want to add a trigger or scheduled function to re-enable RLS after some time
  -- For now, you'll need to manually re-enable it after running your script:
  -- ALTER TABLE public.material_logs ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permission to authenticated users
-- Note: In production, you should be more restrictive with this permission
GRANT EXECUTE ON FUNCTION public.disable_material_logs_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_material_logs_rls() TO anon;

-- Function to re-enable RLS for material_logs table
CREATE OR REPLACE FUNCTION public.enable_material_logs_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Re-enable RLS for material_logs table
  ALTER TABLE public.material_logs ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.enable_material_logs_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_material_logs_rls() TO anon;