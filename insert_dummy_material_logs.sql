-- SQL script to insert dummy log data into material_logs table

-- First, let's check if we have materials to reference
DO $$
DECLARE
    material_count INTEGER;
    material_id BIGINT;
    material_name TEXT;
    material_category TEXT;
    material_unit TEXT;
    material_stock NUMERIC;
    material_threshold NUMERIC;
    username_array TEXT[] := ARRAY['admin', 'john.doe', 'jane.smith', 'warehouse.manager', 'site.supervisor'];
    random_username TEXT;
    random_timestamp TIMESTAMPTZ;
    i INTEGER;
    update_count INTEGER;
    old_stock NUMERIC;
    new_stock NUMERIC;
    has_delete BOOLEAN;
BEGIN
    -- Check if we have materials
    SELECT COUNT(*) INTO material_count FROM public.materials;
    
    -- If no materials exist, insert sample materials
    IF material_count = 0 THEN
        RAISE NOTICE 'No materials found. Inserting sample materials...';
        
        INSERT INTO public.materials (name, category, current_stock, unit, threshold)
        VALUES 
            ('Cement', 'Construction', 500, 'kg', 100),
            ('Steel Rods', 'Construction', 200, 'pieces', 50),
            ('Paint', 'Finishing', 50, 'liters', 10),
            ('Bricks', 'Construction', 1000, 'pieces', 200),
            ('Timber', 'Raw Materials', 30, 'cubic meters', 5);
            
        RAISE NOTICE 'Inserted 5 sample materials';
    ELSE
        RAISE NOTICE 'Found % existing materials', material_count;
    END IF;
    
    -- Get all materials to create logs for
    FOR material_id, material_name, material_category, material_unit, material_stock, material_threshold IN 
        SELECT id, name, category, unit, current_stock, threshold FROM public.materials
    LOOP
        RAISE NOTICE 'Creating logs for material: %', material_name;
        
        -- Random username for each log
        random_username := username_array[1 + floor(random() * array_length(username_array, 1))::INTEGER];
        
        -- Create log - timestamp between 30 days ago and now
        random_timestamp := NOW() - (random() * INTERVAL '30 days');
        
        INSERT INTO public.material_logs (
            material_id, 
            action_type, 
            username, 
            timestamp, 
            details
        ) VALUES (
            material_id,
            'create',
            random_username,
            random_timestamp,
            jsonb_build_object(
                'name', material_name,
                'category', material_category,
                'unit', material_unit,
                'current_stock', material_stock,
                'threshold', material_threshold
            )
        );
        
        -- 2-4 update logs per material
        update_count := 2 + floor(random() * 3)::INTEGER;
        
        FOR i IN 1..update_count LOOP
            -- Random username for each log
            random_username := username_array[1 + floor(random() * array_length(username_array, 1))::INTEGER];
            
            -- Random timestamp after creation but before now
            random_timestamp := random_timestamp + (random() * (NOW() - random_timestamp));
            
            -- Random stock change
            old_stock := material_stock - floor(random() * 50);
            new_stock := material_stock;
            
            INSERT INTO public.material_logs (
                material_id, 
                action_type, 
                username, 
                timestamp, 
                details
            ) VALUES (
                material_id,
                'update',
                random_username,
                random_timestamp,
                jsonb_build_object(
                    'old', jsonb_build_object('current_stock', old_stock),
                    'new', jsonb_build_object('current_stock', new_stock),
                    'changes', jsonb_build_object(
                        'current_stock', jsonb_build_object(
                            'old', old_stock,
                            'new', new_stock
                        )
                    )
                )
            );
        END LOOP;
        
        -- 20% chance of having a delete log
        has_delete := random() < 0.2;
        
        IF has_delete THEN
            -- Random username for delete log
            random_username := username_array[1 + floor(random() * array_length(username_array, 1))::INTEGER];
            
            -- Random timestamp after all updates but before now
            random_timestamp := random_timestamp + (random() * (NOW() - random_timestamp));
            
            INSERT INTO public.material_logs (
                material_id, 
                action_type, 
                username, 
                timestamp, 
                details
            ) VALUES (
                material_id,
                'delete',
                random_username,
                random_timestamp,
                jsonb_build_object(
                    'name', material_name,
                    'category', material_category,
                    'unit', material_unit,
                    'current_stock', material_stock,
                    'reason', 'Material discontinued'
                )
            );
        END IF;
    END LOOP;
    
    -- Count how many logs were inserted
    RAISE NOTICE 'Finished inserting dummy log data';
    RAISE NOTICE 'Total material_logs records: %', (SELECT COUNT(*) FROM public.material_logs);
END;
$$;