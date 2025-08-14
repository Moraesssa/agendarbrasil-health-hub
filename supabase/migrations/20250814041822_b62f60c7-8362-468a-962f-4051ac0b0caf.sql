-- Check current policies on profiles table and fix security vulnerability
-- First, let's see what policies exist and then drop any public ones

-- Drop any problematic public policies that might exist
DROP POLICY IF EXISTS "public_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Ensure we have the secure function for doctor discovery
CREATE OR REPLACE FUNCTION public.get_doctors_for_scheduling(
  p_specialty text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  display_name text,
  user_type text,
  is_active boolean,
  photo_url text,
  has_specialty boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.user_type,
    p.is_active,
    p.photo_url,
    CASE 
      WHEN p_specialty IS NULL THEN true
      ELSE (
        SELECT p_specialty = ANY(m.especialidades)
        FROM public.medicos m 
        WHERE m.user_id = p.id
      )
    END as has_specialty
  FROM public.profiles p
  WHERE p.user_type = 'medico' 
  AND p.is_active = true
  AND (
    p_specialty IS NULL OR
    EXISTS (
      SELECT 1 FROM public.medicos m 
      WHERE m.user_id = p.id 
      AND p_specialty = ANY(m.especialidades)
    )
  )
  AND (
    p_city IS NULL OR p_state IS NULL OR
    EXISTS (
      SELECT 1 FROM public.locais_atendimento la
      WHERE la.medico_id = p.id
      AND la.ativo = true
      AND (p_city IS NULL OR la.cidade = p_city)
      AND (p_state IS NULL OR la.estado = p_state)
    )
  )
  ORDER BY p.display_name;
END;
$$;

-- Add documentation
COMMENT ON FUNCTION public.get_doctors_for_scheduling(text, text, text) 
IS 'Secure function to get basic doctor info for scheduling without exposing sensitive data like email addresses';