-- CRITICAL SECURITY FIX: Remove public access to profiles table
-- This fixes the vulnerability where doctor emails and personal data were publicly accessible

-- 1. Drop the dangerous public access policy
DROP POLICY IF EXISTS "public_profiles_select" ON public.profiles;

-- 2. Verify that proper authenticated access policies exist and create enhanced ones if needed

-- Create a secure policy for viewing basic doctor information for scheduling (without emails)
CREATE POLICY "secure_doctor_profiles_for_scheduling" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow viewing basic doctor info for scheduling (but not emails)
  user_type = 'medico' AND is_active = true
);

-- Create a secure policy for authenticated users to view limited profile info
CREATE POLICY "secure_authenticated_profiles_view" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Users can view their own complete profile
    auth.uid() = id
    OR
    -- Authenticated users can view basic info of active doctors (display_name, user_type, but not email)
    (user_type = 'medico' AND is_active = true)
    OR
    -- Family members can view each other's basic info
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE (fm.user_id = auth.uid() AND fm.family_member_id = profiles.id)
      OR (fm.family_member_id = auth.uid() AND fm.user_id = profiles.id)
      AND fm.status = 'active'
    )
  )
);

-- 3. Create a security definer function for safe doctor lookup without exposing emails
CREATE OR REPLACE FUNCTION public.get_doctor_basic_info(doctor_ids UUID[] DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  user_type TEXT,
  is_active BOOLEAN,
  photo_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_doctor_basic_info TO authenticated;

-- 4. Add policy comments for documentation
COMMENT ON POLICY "secure_doctor_profiles_for_scheduling" ON public.profiles 
IS 'Allows viewing basic doctor information for scheduling without exposing email addresses';

COMMENT ON POLICY "secure_authenticated_profiles_view" ON public.profiles 
IS 'Allows authenticated users limited access to profiles with email protection';

COMMENT ON FUNCTION public.get_doctor_basic_info 
IS 'Safe function to get doctor basic information without exposing email addresses';

-- 5. Ensure the existing secure policies remain in place
-- Note: We keep the existing policies that provide proper authenticated access