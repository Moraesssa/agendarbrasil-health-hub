-- CRITICAL SECURITY FIX: Secure patient data in consultations table (FINAL)
-- This fixes the vulnerability where patient information was publicly accessible

-- 1. Drop ALL existing policies completely
DROP POLICY IF EXISTS "Allow all operations on consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow consultation inserts" ON public.consultations;
DROP POLICY IF EXISTS "Allow consultation selects" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_select_patients" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_select_admin" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_insert" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_update_patients" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_update_admin" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_delete_owners" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_delete_admin" ON public.consultations;
DROP POLICY IF EXISTS "secure_consultations_service_role" ON public.consultations;

-- 2. Create comprehensive secure policies
CREATE POLICY "consultations_secure_select_own" 
ON public.consultations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Patients can see consultations where their email matches
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.email = consultations.patient_email
    )
    OR
    -- Family member with view permissions can see consultations
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
    OR
    -- Admin users can see all consultations
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  )
);

CREATE POLICY "consultations_secure_insert" 
ON public.consultations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User creating consultation with their own email
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.email = consultations.patient_email
    )
    OR
    -- Family member with scheduling permission
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

CREATE POLICY "consultations_secure_update" 
ON public.consultations 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    -- User updating their own consultation
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.email = consultations.patient_email
    )
    OR
    -- Family member with scheduling permission
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
    OR
    -- Admin users can update consultations
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  )
);

CREATE POLICY "consultations_secure_delete" 
ON public.consultations 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    -- User deleting their own consultation
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.email = consultations.patient_email
    )
    OR
    -- Family member with cancel permission
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.profiles p ON p.id = fm.family_member_id
      WHERE fm.user_id = auth.uid()
      AND p.email = consultations.patient_email
      AND fm.can_cancel = true
      AND fm.status = 'active'
    )
    OR
    -- Admin users can delete consultations
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  )
);

CREATE POLICY "consultations_service_role_access" 
ON public.consultations 
FOR ALL 
USING (
  -- Allow service role full access for system operations
  current_setting('role') = 'service_role'
);

-- 3. Ensure RLS is enabled
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;