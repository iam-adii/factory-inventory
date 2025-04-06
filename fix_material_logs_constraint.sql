-- SQL script to fix the material_logs table by dropping the NOT NULL constraint on material_id

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

-- Verify the change
DO $$ 
DECLARE
    is_nullable text;
BEGIN
    SELECT is_nullable INTO is_nullable
    FROM information_schema.columns
    WHERE table_name = 'material_logs' AND column_name = 'material_id';
    
    RAISE NOTICE 'material_id is_nullable: %', is_nullable;
END $$;