-- Migration to fix doctor search by location and specialty (v2)
-- Corrects handling for 'especialidades' as a TEXT[] column.

-- Step 1: Add 'cidade' and 'estado' columns to the 'medicos' table.
ALTER TABLE public.medicos
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Step 2: Create a temporary helper function to clean up the old 'especialidades' format from a TEXT array.
-- This function handles TEXT[] input and converts strings like "{\"Dermatologia\"]}" to valid JSON '["Dermatologia"]'.
CREATE OR REPLACE FUNCTION temporary_fix_especialidades(p_especialidades TEXT[])
RETURNS JSONB AS $$
DECLARE
    malformed_string TEXT;
    cleaned_text TEXT;
    json_array JSONB;
BEGIN
    -- If the input array is NULL or empty, return an empty jsonb array.
    IF p_especialidades IS NULL OR array_length(p_especialidades, 1) IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    -- Extract the first element, which contains the malformed string.
    malformed_string := p_especialidades[1];

    -- Check if the string is already valid JSON.
    BEGIN
        RETURN malformed_string::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
        -- If not, it's likely the broken format "{\"Specialty\"]}".
        -- This regex extracts the specialty name from inside the format.
        cleaned_text := regexp_replace(malformed_string, '^"{\\"(.*)\\"\]}"$', '\1');

        -- If the regex worked, build a JSON array with the result.
        IF cleaned_text IS NOT NULL AND cleaned_text != malformed_string THEN
            json_array := jsonb_build_array(cleaned_text);
        ELSE
            -- As a fallback, return an empty JSON array.
            json_array := '[]'::jsonb;
        END IF;

        RETURN json_array;
    END;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Alter the 'especialidades' column to use the JSONB type.
-- The USING clause now correctly calls the function with the TEXT[] column.
ALTER TABLE public.medicos
ALTER COLUMN especialidades TYPE JSONB
USING temporary_fix_especialidades(especialidades);

-- Set a default value for new rows.
ALTER TABLE public.medicos
ALTER COLUMN especialidades SET DEFAULT '[]'::jsonb;

-- Drop the temporary function, making sure to use the correct TEXT[] signature.
DROP FUNCTION temporary_fix_especialidades(TEXT[]);

-- Step 4: Populate the 'estado' column from the 'crm' column.
UPDATE public.medicos
SET estado = split_part(crm, '-', 2)
WHERE estado IS NULL AND crm LIKE '%-%';

-- Step 5: Drop the old search function if it exists.
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT);

-- Step 6: Recreate the search function with the correct logic for JSONB.
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
        m.id,
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

-- Step 7: Grant permissions on the new function.
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Step 8: Add a comment to the function for documentation.
COMMENT ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) IS 'Searches for doctors by specialty, city, and state (v2).';
