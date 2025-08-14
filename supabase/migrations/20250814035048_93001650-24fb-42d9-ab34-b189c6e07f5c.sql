-- SECURITY FIX: Replace insecure policies with proper RLS for consultas table
-- This fixes the critical vulnerability where patient data was publicly accessible

-- 1. Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow all operations on consultas" ON public.consultas;
DROP POLICY IF EXISTS "Patients can view their own consultations" ON public.consultas;
DROP POLICY IF EXISTS "Doctors can view their consultations" ON public.consultas;
DROP POLICY IF EXISTS "Authenticated users can create consultations" ON public.consultas;
DROP POLICY IF EXISTS "Patients can update their consultations" ON public.consultas;
DROP POLICY IF EXISTS "Doctors can update their consultations" ON public.consultas;
DROP POLICY IF EXISTS "Patients can cancel their consultations" ON public.consultas;
DROP POLICY IF EXISTS "Doctors can delete their consultations" ON public.consultas;

-- 2. Create comprehensive secure policies
CREATE POLICY "secure_consultas_select_patients" 
ON public.consultas 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Patient can see their own consultations
    auth.uid() = paciente_id 
    OR 
    -- Family member with view permissions can see consultations
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = auth.uid()
      AND fm.family_member_id = paciente_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_consultas_select_doctors" 
ON public.consultas 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

CREATE POLICY "secure_consultas_insert" 
ON public.consultas 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User creating consultation for themselves
    auth.uid() = paciente_id
    OR
    -- Family member with scheduling permission
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND fm.family_member_id = paciente_id
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_consultas_update_patients" 
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

CREATE POLICY "secure_consultas_update_doctors" 
ON public.consultas 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

CREATE POLICY "secure_consultas_delete_patients" 
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

CREATE POLICY "secure_consultas_delete_doctors" 
ON public.consultas 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 3. Ensure RLS is enabled
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;