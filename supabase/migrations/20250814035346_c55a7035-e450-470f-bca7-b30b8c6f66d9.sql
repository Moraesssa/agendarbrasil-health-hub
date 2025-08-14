-- CRITICAL SECURITY FIX: Secure payment data in pagamentos table
-- This fixes the vulnerability where payment information was publicly accessible

-- 1. Drop the existing dangerous policy that allows public access to all payment data
DROP POLICY IF EXISTS "Allow all operations on pagamentos" ON public.pagamentos;

-- 2. Create secure SELECT policies for payment access
CREATE POLICY "secure_pagamentos_select_patients" 
ON public.pagamentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- User can see their own payments
    auth.uid() = usuario_id 
    OR 
    auth.uid() = paciente_id
    OR
    -- Family member with view permissions can see payments
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = auth.uid()
      AND (fm.family_member_id = paciente_id OR fm.family_member_id = usuario_id)
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_pagamentos_select_doctors" 
ON public.pagamentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 3. Create secure INSERT policies for payment creation
CREATE POLICY "secure_pagamentos_insert" 
ON public.pagamentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User creating payment for themselves
    auth.uid() = usuario_id 
    OR 
    auth.uid() = paciente_id
    OR
    -- Family member with scheduling permission can create payments
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND (fm.family_member_id = paciente_id OR fm.family_member_id = usuario_id)
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

-- 4. Create secure UPDATE policies for payment updates
CREATE POLICY "secure_pagamentos_update_patients" 
ON public.pagamentos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = usuario_id 
    OR 
    auth.uid() = paciente_id
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND (fm.family_member_id = paciente_id OR fm.family_member_id = usuario_id)
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "secure_pagamentos_update_doctors" 
ON public.pagamentos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 5. Create secure DELETE policies (very restrictive for payment data)
CREATE POLICY "secure_pagamentos_delete_owners_only" 
ON public.pagamentos 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = usuario_id 
    OR 
    auth.uid() = paciente_id
  )
);

-- 6. Create service role policy for administrative access and webhooks
CREATE POLICY "secure_pagamentos_service_role" 
ON public.pagamentos 
FOR ALL 
USING (
  -- Allow service role full access for webhooks and admin functions
  current_setting('role') = 'service_role'
);

-- 7. Add policy comments for documentation
COMMENT ON POLICY "secure_pagamentos_select_patients" ON public.pagamentos 
IS 'Allows patients and family members with view permissions to see payment records';

COMMENT ON POLICY "secure_pagamentos_select_doctors" ON public.pagamentos 
IS 'Allows doctors to view payments for their consultations';

COMMENT ON POLICY "secure_pagamentos_insert" ON public.pagamentos 
IS 'Allows authenticated users to create payments for themselves or family members';

COMMENT ON POLICY "secure_pagamentos_service_role" ON public.pagamentos 
IS 'Allows service role full access for webhooks and administrative functions';

-- 8. Ensure RLS is enabled
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;