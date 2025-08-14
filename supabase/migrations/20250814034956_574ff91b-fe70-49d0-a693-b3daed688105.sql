-- SECURITY FIX: Implement proper RLS policies for consultas table
-- This fixes the critical vulnerability where patient data was publicly accessible

-- 1. Drop the existing dangerous policy that allows public access
DROP POLICY IF EXISTS "Allow all operations on consultas" ON public.consultas;

-- 2. Create secure policies for SELECT operations
CREATE POLICY "Patients can view their own consultations" 
ON public.consultas 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Patient can see their own consultations
    auth.uid() = paciente_id 
    OR 
    -- Patient can see consultations they scheduled for family members
    auth.uid() = (
      SELECT fm.user_id 
      FROM public.family_members fm 
      WHERE fm.family_member_id = paciente_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Doctors can view their consultations" 
ON public.consultas 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 3. Create secure policies for INSERT operations
CREATE POLICY "Authenticated users can create consultations" 
ON public.consultas 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User creating consultation for themselves
    auth.uid() = paciente_id
    OR
    -- User creating consultation for family member they can schedule for
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.family_member_id = paciente_id
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

-- 4. Create secure policies for UPDATE operations
CREATE POLICY "Patients can update their consultations" 
ON public.consultas 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = paciente_id
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.family_member_id = paciente_id
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Doctors can update their consultations" 
ON public.consultas 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 5. Create secure policies for DELETE operations
CREATE POLICY "Patients can cancel their consultations" 
ON public.consultas 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = paciente_id
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.family_member_id = paciente_id
      AND fm.can_cancel = true
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Doctors can delete their consultations" 
ON public.consultas 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 6. Add policy comments for documentation
COMMENT ON POLICY "Patients can view their own consultations" ON public.consultas 
IS 'Allows patients to view consultations where they are the patient or have family member permissions';

COMMENT ON POLICY "Doctors can view their consultations" ON public.consultas 
IS 'Allows doctors to view consultations where they are the attending physician';

COMMENT ON POLICY "Authenticated users can create consultations" ON public.consultas 
IS 'Allows authenticated users to create consultations for themselves or family members with scheduling permissions';

-- 7. Ensure RLS is enabled (should already be, but confirming)
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;