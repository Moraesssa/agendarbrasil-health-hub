-- Universal fix for doctor configurations
-- This migration normalizes all horarioAtendimento to proper array format and ensures data consistency

DO $$
DECLARE
    medico_record RECORD;
    dia_semana TEXT;
    blocos_dia JSONB;
    local_record RECORD;
    blocos_normalizados JSONB := '{}';
    dias_semana TEXT[] := ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
BEGIN
    -- Loop through all doctors
    FOR medico_record IN 
        SELECT user_id, configuracoes 
        FROM medicos 
        WHERE configuracoes IS NOT NULL
    LOOP
        blocos_normalizados := '{}';
        
        -- Process each day of the week
        FOREACH dia_semana IN ARRAY dias_semana
        LOOP
            -- Get blocks for this day (could be null, object, or already array)
            blocos_dia := medico_record.configuracoes->'horarioAtendimento'->dia_semana;
            
            IF blocos_dia IS NOT NULL THEN
                -- If it's already an array, keep it
                IF jsonb_typeof(blocos_dia) = 'array' THEN
                    blocos_normalizados := blocos_normalizados || jsonb_build_object(dia_semana, blocos_dia);
                -- If it's an object (single block), convert to array
                ELSIF jsonb_typeof(blocos_dia) = 'object' THEN
                    blocos_normalizados := blocos_normalizados || jsonb_build_object(dia_semana, jsonb_build_array(blocos_dia));
                END IF;
            ELSE
                -- If null, create empty array
                blocos_normalizados := blocos_normalizados || jsonb_build_object(dia_semana, '[]'::jsonb);
            END IF;
        END LOOP;
        
        -- Now ensure all blocks have proper local_id assignments
        -- Get all active locations for this doctor
        FOR local_record IN 
            SELECT id, nome_local 
            FROM locais_atendimento 
            WHERE medico_id = medico_record.user_id AND ativo = true
            ORDER BY created_at
        LOOP
            -- For each day, update blocks that are active but don't have local_id
            FOREACH dia_semana IN ARRAY dias_semana
            LOOP
                blocos_dia := blocos_normalizados->dia_semana;
                
                IF jsonb_typeof(blocos_dia) = 'array' AND jsonb_array_length(blocos_dia) > 0 THEN
                    -- Update blocks without local_id assignment
                    FOR i IN 0..jsonb_array_length(blocos_dia)-1
                    LOOP
                        IF (blocos_dia->i->>'ativo')::boolean = true AND 
                           (blocos_dia->i->>'local_id' IS NULL OR blocos_dia->i->>'local_id' = '' OR blocos_dia->i->>'local_id' = 'null') THEN
                            -- Assign this location to the block
                            blocos_dia := jsonb_set(
                                blocos_dia, 
                                ('{' || i || ',local_id}')::text[], 
                                to_jsonb(local_record.id::text)
                            );
                        END IF;
                    END LOOP;
                    
                    -- Update the normalized object
                    blocos_normalizados := blocos_normalizados || jsonb_build_object(dia_semana, blocos_dia);
                END IF;
            END LOOP;
            
            -- Exit after first location (we can expand this logic later for multiple locations)
            EXIT;
        END LOOP;
        
        -- Update the doctor's configuration with normalized data
        UPDATE medicos 
        SET configuracoes = jsonb_set(
            COALESCE(configuracoes, '{}'),
            '{horarioAtendimento}',
            blocos_normalizados
        )
        WHERE user_id = medico_record.user_id;
        
        RAISE NOTICE 'Updated doctor %: %', medico_record.user_id, blocos_normalizados;
    END LOOP;
    
    RAISE NOTICE 'Successfully normalized all doctor configurations';
END $$;

-- Add constraint to ensure horarioAtendimento is always an object with day arrays
ALTER TABLE medicos 
ADD CONSTRAINT check_horario_atendimento_format 
CHECK (
    configuracoes->'horarioAtendimento' IS NULL OR 
    (
        jsonb_typeof(configuracoes->'horarioAtendimento') = 'object' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'segunda') = 'array' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'terca') = 'array' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'quarta') = 'array' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'quinta') = 'array' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'sexta') = 'array' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'sabado') = 'array' AND
        jsonb_typeof(configuracoes->'horarioAtendimento'->'domingo') = 'array'
    )
);