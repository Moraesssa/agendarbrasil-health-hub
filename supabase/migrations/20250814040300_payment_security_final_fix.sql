-- FINAL SECURITY FIX: Complete payment data protection
-- Addresses: Payment Information Could Be Stolen by Hackers
-- Issue: PUBLIC_PAYMENT_DATA_ACCESS

-- 1. Ensure RLS is enabled (critical)
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- 2. Drop any remaining permissive policies
DROP POLICY IF EXISTS "Allow all operations on pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Pacientes podem ver seus próprios pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Médicos podem ver os pagamentos de suas consultas" ON public.pagamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar pagamentos" ON public.pagamentos;

-- 3. Create comprehensive secure policies

-- SELECT: Patients can only see their own payments
CREATE POLICY "pagamentos_select_patient_own" 
ON public.pagamentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = paciente_id 
    OR 
    auth.uid() = usuario_id
  )
);

-- SELECT: Family members with view permissions
CREATE POLICY "pagamentos_select_family_view" 
ON public.pagamentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid()
    AND (fm.family_member_id = paciente_id OR fm.family_member_id = usuario_id)
    AND fm.can_view_history = true 
    AND fm.status = 'active'
  )
);

-- SELECT: Doctors can see payments for their consultations only
CREATE POLICY "pagamentos_select_doctor_own" 
ON public.pagamentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = medico_id
);

-- INSERT: Only authenticated users for themselves or family
CREATE POLICY "pagamentos_insert_secure" 
ON public.pagamentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- User creating payment for themselves
    auth.uid() = paciente_id 
    OR 
    auth.uid() = usuario_id
    OR
    -- Family member with scheduling permission
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND (fm.family_member_id = paciente_id OR fm.family_member_id = usuario_id)
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
);

-- UPDATE: Restricted to owners and doctors (status updates only)
CREATE POLICY "pagamentos_update_patient" 
ON public.pagamentos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = paciente_id 
    OR 
    auth.uid() = usuario_id
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
      AND (fm.family_member_id = paciente_id OR fm.family_member_id = usuario_id)
      AND fm.can_schedule = true
      AND fm.status = 'active'
    )
  )
)
WITH CHECK (
  -- Prevent modification of sensitive financial data
  OLD.valor = NEW.valor AND
  OLD.gateway_id = NEW.gateway_id AND
  OLD.dados_gateway = NEW.dados_gateway
);

CREATE POLICY "pagamentos_update_doctor" 
ON public.pagamentos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND auth.uid() = medico_id
)
WITH CHECK (
  -- Doctors can only update status, not financial data
  OLD.valor = NEW.valor AND
  OLD.gateway_id = NEW.gateway_id AND
  OLD.dados_gateway = NEW.dados_gateway AND
  OLD.paciente_id = NEW.paciente_id AND
  OLD.medico_id = NEW.medico_id
);

-- DELETE: Very restrictive - only payment owners
CREATE POLICY "pagamentos_delete_owner_only" 
ON public.pagamentos 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = paciente_id 
    OR 
    auth.uid() = usuario_id
  )
);

-- SERVICE ROLE: Full access for webhooks and admin operations
CREATE POLICY "pagamentos_service_role_access" 
ON public.pagamentos 
FOR ALL 
USING (
  current_setting('role') = 'service_role'
);

-- 4. Add security constraints to prevent data leaks
ALTER TABLE public.pagamentos 
ADD CONSTRAINT check_sensitive_data_not_null 
CHECK (
  gateway_id IS NOT NULL OR metodo_pagamento = 'manual'
);

-- 5. Create audit trigger for payment modifications
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all payment modifications for security audit
  INSERT INTO public.audit_log (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    timestamp
  ) VALUES (
    'pagamentos',
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "audit_log_service_role_only" 
ON public.audit_log 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Create the audit trigger
DROP TRIGGER IF EXISTS payment_audit_trigger ON public.pagamentos;
CREATE TRIGGER payment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();

-- 6. Add comments for documentation
COMMENT ON POLICY "pagamentos_select_patient_own" ON public.pagamentos 
IS 'Permite que pacientes vejam apenas seus próprios pagamentos';

COMMENT ON POLICY "pagamentos_select_family_view" ON public.pagamentos 
IS 'Permite que familiares com permissão vejam pagamentos de membros da família';

COMMENT ON POLICY "pagamentos_select_doctor_own" ON public.pagamentos 
IS 'Permite que médicos vejam pagamentos apenas de suas consultas';

COMMENT ON POLICY "pagamentos_insert_secure" ON public.pagamentos 
IS 'Permite criação de pagamentos apenas para usuários autorizados';

COMMENT ON POLICY "pagamentos_service_role_access" ON public.pagamentos 
IS 'Acesso completo para service role (webhooks e operações administrativas)';

-- 7. Create function to validate payment access
CREATE OR REPLACE FUNCTION validate_payment_access(payment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check if current user has access to this payment
  SELECT EXISTS(
    SELECT 1 FROM public.pagamentos p
    WHERE p.id = payment_id
    AND (
      auth.uid() = p.paciente_id 
      OR auth.uid() = p.usuario_id
      OR auth.uid() = p.medico_id
      OR EXISTS (
        SELECT 1 FROM public.family_members fm 
        WHERE fm.user_id = auth.uid()
        AND (fm.family_member_id = p.paciente_id OR fm.family_member_id = p.usuario_id)
        AND fm.can_view_history = true 
        AND fm.status = 'active'
      )
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_payment_access(UUID) TO authenticated;

COMMENT ON FUNCTION validate_payment_access(UUID) 
IS 'Valida se o usuário atual tem acesso a um pagamento específico';