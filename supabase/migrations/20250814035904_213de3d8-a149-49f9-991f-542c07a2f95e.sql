-- CRITICAL SECURITY FIX: Secure patient data in consultations table
-- This fixes the vulnerability where patient information was publicly accessible

-- 1. Drop ALL existing dangerous policies that allow public access
DROP POLICY IF EXISTS "Allow all operations on consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow consultation inserts" ON public.consultations;
DROP POLICY IF EXISTS "Allow consultation selects" ON public.consultations;

-- 2. Create secure SELECT policies for consultation access
CREATE POLICY "secure_consultations_select_patients" 
ON public.consultations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Patients can see consultations where they provided their email
    auth.user() ->> 'email' = patient_email
    OR
    -- Check if user has family member permissions to view this patient's data
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_consultations_select_admin" 
ON public.consultations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'admin'
  )
);

-- 3. Create secure INSERT policies for consultation creation
CREATE POLICY "secure_consultations_insert" 
ON public.consultations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User creating consultation with their own email
    auth.user() ->> 'email' = patient_email
    OR
    -- Family member with scheduling permission can create consultations
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
    OR
    -- Admin users can create consultations
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  )
);

-- 4. Create secure UPDATE policies for consultation updates
CREATE POLICY "secure_consultations_update_patients" 
ON public.consultations 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    -- User updating their own consultation
    auth.user() ->> 'email' = patient_email
    OR
    -- Family member with scheduling permission can update consultations
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_consultations_update_admin" 
ON public.consultations 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'admin'
  )
);

-- 5. Create secure DELETE policies (very restrictive for consultation data)
CREATE POLICY "secure_consultations_delete_owners" 
ON public.consultations 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    -- User deleting their own consultation
    auth.user() ->> 'email' = patient_email
    OR
    -- Family member with cancel permission can delete consultations
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_cancel = true
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_consultations_delete_admin" 
ON public.consultations 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'admin'
  )
);

-- 6. Create service role policy for administrative access and system operations
CREATE POLICY "secure_consultations_service_role" 
ON public.consultations 
FOR ALL 
USING (
  -- Allow service role full access for system operations
  current_setting('role') = 'service_role'
);

-- 7. Add policy comments for documentation
COMMENT ON POLICY "secure_consultations_select_patients" ON public.consultations 
IS 'Allows patients and authorized family members to view consultation records';

COMMENT ON POLICY "secure_consultations_select_admin" ON public.consultations 
IS 'Allows admin users to view all consultation records';

COMMENT ON POLICY "secure_consultations_insert" ON public.consultations 
IS 'Allows authenticated users to create consultations for themselves or family members';

COMMENT ON POLICY "secure_consultations_service_role" ON public.consultations 
IS 'Allows service role full access for system operations and administrative functions';

-- 8. Ensure RLS is enabled
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;