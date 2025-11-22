-- Migration: Fix get_doctors_by_location_and_specialty and add RLS policy for medicos
-- Date: 2025-11-01

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_doctors_by_location_and_specialty(text, text, text);

-- Recreate function with improved logic:
-- - Use LEFT JOIN on locais_atendimento to include doctors without location.
-- - Handle NULL especialidades gracefully.
-- - Apply filters only when parameters are provided.
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty text,
    p_city text,
    p_state text
) RETURNS TABLE(
    id uuid,
    display_name text,
    especialidades jsonb,
    crm text,
    city text,
    state text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.user_id AS id,
        p.display_name,
        COALESCE(m.especialidades, '[]'::jsonb) AS especialidades,
        m.crm,
        la.cidade AS city,
        la.estado AS state
    FROM public.medicos m
    JOIN public.profiles p ON p.id = m.user_id
    LEFT JOIN public.locais_atendimento la ON la.medico_id = m.user_id AND la.ativo = true AND la.status = 'ativo'
    WHERE p.user_type = 'medico'
      AND p.is_active = true
      AND (
            p_specialty IS NULL
            OR (
                m.especialidades IS NOT NULL AND (
                    m.especialidades::jsonb ? p_specialty
                    OR EXISTS (
                        SELECT 1 FROM jsonb_array_elements_text(m.especialidades) AS e(val)
                        WHERE e.val = p_specialty
                    )
                )
            )
      )
      AND (p_city IS NULL OR la.cidade = p_city)
      AND (p_state IS NULL OR la.estado = p_state)
    ORDER BY p.display_name;
END;
$$;

-- Grant execute to relevant roles
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(text, text, text) TO anon, authenticated, service_role;

-- Add RLS policy to allow anonymous read access to medicos (if not already present)
-- Ensure RLS is enabled on medicos table
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;

-- Create policy allowing all reads (adjust as needed for security)
CREATE POLICY "allow_read_medicos_anon" ON public.medicos FOR SELECT USING (true);

-- Apply same policy for authenticated role (optional, but ensures consistency)
CREATE POLICY "allow_read_medicos_auth" ON public.medicos FOR SELECT USING (true);

-- Ensure policies are active
ALTER TABLE public.medicos FORCE ROW LEVEL SECURITY;

-- Optional: Update existing medicos rows to ensure especialidades is not null
UPDATE public.medicos SET especialidades = '[]'::jsonb WHERE especialidades IS NULL;

-- End of migration
