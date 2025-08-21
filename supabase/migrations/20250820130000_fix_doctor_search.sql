-- Migration to fix doctor search by location and specialty (v3)
-- Drops the default value before altering column type to prevent casting errors.

-- Step 1: Add 'cidade' and 'estado' columns to the 'medicos' table.
ALTER TABLE public.medicos
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Step 2: Create a temporary helper function to clean up the old 'especialidades' format from a TEXT array.
CREATE OR REPLACE FUNCTION temporary_fix_especialidades(p_especialidades TEXT[])
RETURNS JSONB AS $$
DECLARE
    malformed_string TEXT;
    cleaned_text TEXT;
    json_array JSONB;
BEGIN
    IF p_especialidades IS NULL OR array_length(p_especialidades, 1) IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;
    malformed_string := p_especialidades[1];
    BEGIN
        RETURN malformed_string::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
        cleaned_text := regexp_replace(malformed_string, '^"{\\"(.*)\\"\]}"$', '\1');
        IF cleaned_text IS NOT NULL AND cleaned_text != malformed_string THEN
            json_array := jsonb_build_array(cleaned_text);
        ELSE
            json_array := '[]'::jsonb;
        END IF;
        RETURN json_array;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Explicitly drop the old default value on 'especialidades'.
-- This prevents PostgreSQL from trying to auto-cast an incompatible default.
ALTER TABLE public.medicos
ALTER COLUMN especialidades DROP DEFAULT;

-- Step 4: Alter the 'especialidades' column to use the JSONB type.
ALTER TABLE public.medicos
ALTER COLUMN especialidades TYPE JSONB
USING temporary_fix_especialidades(especialidades);

-- Step 5: Now, set the new, correct default value for the JSONB column.
ALTER TABLE public.medicos
ALTER COLUMN especialidades SET DEFAULT '[]'::jsonb;

-- Drop the temporary helper function.
DROP FUNCTION temporary_fix_especialidades(TEXT[]);

-- Step 6: Populate the 'estado' column from the 'crm' column.
UPDATE public.medicos
SET estado = split_part(crm, '-', 2)
WHERE estado IS NULL AND crm LIKE '%-%';

-- Step 7: Drop the old search function if it exists.
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT);

-- Step 8: Recreate the search function with the correct logic for JSONB.
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty TEXT,
    p_city TEXT,
    p_state TEXT
)
RETURNS TABLE(
    id UUID,
    display_name TEXT,
    especialidades JSONB,
    crm TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.user_id as id,
        p.display_name,
        m.especialidades,
        m.crm
    FROM
        public.medicos AS m
    LEFT JOIN
        public.profiles AS p ON m.user_id = p.id
    WHERE
        m.cidade ILIKE p_city AND
        m.estado ILIKE p_state AND
        m.especialidades @> to_jsonb(p_specialty::text);
END;
$$ LANGUAGE plpgsql;

-- Step 9: Grant permissions and add a comment.
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;
COMMENT ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) IS 'Searches for doctors by specialty, city, and state (v3).';
