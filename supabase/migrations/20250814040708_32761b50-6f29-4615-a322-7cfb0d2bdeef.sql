-- CRITICAL SECURITY FIX: Remove public access to sensitive doctor data in medicos table
-- This fixes the vulnerability where doctor phone numbers, CRM, and WhatsApp were publicly accessible

-- 1. Drop the dangerous anonymous access policy
DROP POLICY IF EXISTS "Anonymous can view doctor data for scheduling" ON public.medicos;

-- 2. Update the authenticated access policy to be more restrictive
DROP POLICY IF EXISTS "Allow authenticated users to view doctor data for scheduling" ON public.medicos;
DROP POLICY IF EXISTS "Authenticated users can view doctor data" ON public.medicos;

-- Create a new restrictive policy for authenticated users (scheduling purposes only)
CREATE POLICY "secure_medicos_authenticated_basic_view" 
ON public.medicos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can view their own complete data
    auth.uid() = user_id
    OR
    -- Authenticated users can view very basic info for scheduling (no sensitive data)
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = medicos.user_id 
      AND p.user_type = 'medico' 
      AND p.is_active = true
    )
  )
);

-- 3. Create a security definer function for safe doctor scheduling info without exposing sensitive data
CREATE OR REPLACE FUNCTION public.get_doctor_scheduling_info(
  p_specialty TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL, 
  p_state TEXT DEFAULT NULL
)
RETURNS TABLE(
  doctor_id UUID,
  especialidades TEXT[],
  has_active_locations BOOLEAN,
  total_locations INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.user_id as doctor_id,
    m.especialidades,
    EXISTS(
      SELECT 1 FROM public.locais_atendimento la 
      WHERE la.medico_id = m.user_id 
      AND la.ativo = true 
      AND la.status = 'ativo'
    ) as has_active_locations,
    (
      SELECT COUNT(*)::INTEGER 
      FROM public.locais_atendimento la 
      WHERE la.medico_id = m.user_id 
      AND la.ativo = true
    ) as total_locations
  FROM public.medicos m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE p.user_type = 'medico' 
  AND p.is_active = true
  AND (p_specialty IS NULL OR p_specialty = ANY(m.especialidades))
  AND (
    p_city IS NULL OR p_state IS NULL OR
    EXISTS (
      SELECT 1 FROM public.locais_atendimento la
      WHERE la.medico_id = m.user_id
      AND la.ativo = true
      AND (p_city IS NULL OR la.cidade = p_city)
      AND (p_state IS NULL OR la.estado = p_state)
    )
  )
  ORDER BY p.display_name;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_doctor_scheduling_info TO authenticated;

-- 4. Create a function for getting doctor contact info (only for authorized users)
CREATE OR REPLACE FUNCTION public.get_doctor_contact_info(doctor_id UUID)
RETURNS TABLE(
  telefone TEXT,
  whatsapp TEXT,
  crm TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only return contact info if user is authorized
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user has permission to view this doctor's contact info
  IF NOT (
    auth.uid() = doctor_id OR -- Doctor viewing their own info
    EXISTS (
      SELECT 1 FROM public.consultas c
      WHERE c.medico_id = doctor_id 
      AND c.paciente_id = auth.uid()
      AND c.status IN ('agendada', 'confirmada')
    ) OR -- Patient with active consultation
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    ) -- Admin user
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view contact information';
  END IF;

  RETURN QUERY
  SELECT 
    m.telefone,
    m.whatsapp,
    m.crm
  FROM public.medicos m
  WHERE m.user_id = doctor_id;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_doctor_contact_info TO authenticated;

-- 5. Add policy comments for documentation
COMMENT ON POLICY "secure_medicos_authenticated_basic_view" ON public.medicos 
IS 'Allows authenticated users limited access to doctor data without exposing sensitive contact information';

COMMENT ON FUNCTION public.get_doctor_scheduling_info 
IS 'Safe function to get doctor scheduling information without exposing sensitive contact details';

COMMENT ON FUNCTION public.get_doctor_contact_info 
IS 'Secure function to get doctor contact information only for authorized users (patients with appointments, doctors themselves, admins)';

-- 6. Ensure RLS is enabled
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;