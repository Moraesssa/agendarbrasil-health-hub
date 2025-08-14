-- Fix profiles table security vulnerability
-- Remove public access to doctor personal information while preserving scheduling functionality

-- 1. Drop the existing problematic public policy (if it exists)
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "public_profiles_select" ON public.profiles;

-- 2. Create secure policies for profiles table
-- Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Create a secure function for doctor discovery that only exposes safe scheduling info
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

-- 4. Add comments for documentation
COMMENT ON POLICY "Users can view their own profile" ON public.profiles 
IS 'Users can only view their own complete profile data';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles 
IS 'Users can only update their own profile data';

COMMENT ON POLICY "Users can insert their own profile" ON public.profiles 
IS 'Users can create their own profile during registration';

COMMENT ON FUNCTION public.get_doctors_for_scheduling(text, text, text) 
IS 'Secure function to get basic doctor info for scheduling without exposing sensitive data like email addresses';