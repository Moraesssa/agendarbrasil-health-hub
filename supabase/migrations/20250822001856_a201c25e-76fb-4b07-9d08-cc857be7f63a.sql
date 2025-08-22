-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix RLS policies for consultas table
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consultas
CREATE POLICY "Users can view their own consultations as patient"
ON public.consultas
FOR SELECT
USING (auth.uid() = paciente_id OR auth.uid() = paciente_familiar_id);

CREATE POLICY "Users can view their own consultations as doctor"
ON public.consultas
FOR SELECT
USING (auth.uid() = medico_id);

CREATE POLICY "Users can insert their own consultations"
ON public.consultas
FOR INSERT
WITH CHECK (auth.uid() = paciente_id OR auth.uid() = paciente_familiar_id OR auth.uid() = medico_id);

CREATE POLICY "Users can update their own consultations as patient"
ON public.consultas
FOR UPDATE
USING (auth.uid() = paciente_id OR auth.uid() = paciente_familiar_id);

CREATE POLICY "Users can update their own consultations as doctor"
ON public.consultas
FOR UPDATE
USING (auth.uid() = medico_id);

-- Create RLS policies for pagamentos table
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.pagamentos
FOR SELECT
USING (auth.uid() = usuario_id OR auth.uid() = paciente_id OR auth.uid() = medico_id);

CREATE POLICY "Users can insert their own payments"
ON public.pagamentos
FOR INSERT
WITH CHECK (auth.uid() = usuario_id OR auth.uid() = paciente_id OR auth.uid() = medico_id);

CREATE POLICY "Users can update their own payments"
ON public.pagamentos
FOR UPDATE
USING (auth.uid() = usuario_id OR auth.uid() = paciente_id OR auth.uid() = medico_id);

-- Fix search_path for functions that need it
CREATE OR REPLACE FUNCTION public.get_doctor_scheduling_info(p_specialty text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_state text DEFAULT NULL::text)
RETURNS TABLE(doctor_id uuid, especialidades text[], has_active_locations boolean, total_locations integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_doctors_for_scheduling(p_specialty text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_state text DEFAULT NULL::text)
RETURNS TABLE(id uuid, display_name text, user_type text, is_active boolean, photo_url text, has_specialty boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_doctor_basic_info(doctor_ids uuid[] DEFAULT NULL::uuid[])
RETURNS TABLE(id uuid, display_name text, user_type text, is_active boolean, photo_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.user_type,
    p.is_active,
    p.photo_url
  FROM public.profiles p
  WHERE p.user_type = 'medico' 
  AND p.is_active = true
  AND (doctor_ids IS NULL OR p.id = ANY(doctor_ids))
  ORDER BY p.display_name;
END;
$function$;

-- Add audit trigger for consultas table
CREATE TRIGGER consultas_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.consultas
FOR EACH ROW EXECUTE FUNCTION public.simple_audit_trigger();

-- Add audit trigger for pagamentos table  
CREATE TRIGGER pagamentos_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.simple_audit_trigger();