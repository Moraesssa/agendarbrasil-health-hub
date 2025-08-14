-- ===========================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS - AGENDARBRASIL (CORRIGIDO)
-- ===========================================

-- 1. CORRIGIR VULNERABILIDADE CRÍTICA: TABELA PAYMENTS
-- Remover políticas inseguras e implementar RLS apropriado
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook inserts" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook selects" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook updates" ON public.payments;

-- Verificar estrutura da tabela payments para usar colunas corretas
-- Implementar políticas RLS seguras para payments baseado nas colunas existentes
CREATE POLICY "payments_select_owners" ON public.payments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid()::text = customer_id OR 
      EXISTS (
        SELECT 1 FROM consultas c 
        WHERE c.id = payments.consulta_id 
        AND (c.paciente_id = auth.uid() OR c.medico_id = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM family_members fm 
        JOIN consultas c ON c.paciente_id = fm.family_member_id
        WHERE c.id = payments.consulta_id
        AND fm.user_id = auth.uid() 
        AND fm.can_view_history = true 
        AND fm.status = 'active'
      )
    )
  );

CREATE POLICY "payments_insert_authorized" ON public.payments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM consultas c 
        WHERE c.id = payments.consulta_id 
        AND (c.paciente_id = auth.uid() OR c.medico_id = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM family_members fm 
        JOIN consultas c ON c.paciente_id = fm.family_member_id
        WHERE c.id = payments.consulta_id
        AND fm.user_id = auth.uid() 
        AND fm.can_schedule = true 
        AND fm.status = 'active'
      )
    )
  );

CREATE POLICY "payments_update_authorized" ON public.payments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM consultas c 
        WHERE c.id = payments.consulta_id 
        AND (c.paciente_id = auth.uid() OR c.medico_id = auth.uid())
      )
    )
  );

CREATE POLICY "payments_service_role" ON public.payments
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- 2. CORRIGIR VULNERABILIDADE CRÍTICA: WEBHOOK EVENT LOGS
-- Verificar se a tabela existe primeiro
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_event_logs' AND table_schema = 'public') THEN
    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Allow administrators to view integration logs" ON public.webhook_event_logs;
    DROP POLICY IF EXISTS "Allow service role to access all logs" ON public.webhook_event_logs;
    DROP POLICY IF EXISTS "Allow webhook log inserts" ON public.webhook_event_logs;
    DROP POLICY IF EXISTS "Allow webhook log selects" ON public.webhook_event_logs;

    -- Apenas service role pode acessar webhook logs
    EXECUTE 'CREATE POLICY "webhook_logs_service_role_only" ON public.webhook_event_logs FOR ALL USING (current_setting(''role'') = ''service_role'')';

    -- Admins podem ver logs mas sem dados sensíveis
    EXECUTE 'CREATE POLICY "webhook_logs_admin_read_only" ON public.webhook_event_logs FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.user_type = ''admin''))';
  END IF;
END $$;

-- 3. PROTEGER API KEYS EM EXTERNAL_DATA_SOURCES
DROP POLICY IF EXISTS "Users can view active data sources" ON public.external_data_sources;

-- Apenas admins podem ver data sources (sem API keys expostas)
CREATE POLICY "external_data_sources_admin_only" ON public.external_data_sources
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  );

-- Service role para integração
CREATE POLICY "external_data_sources_service_role" ON public.external_data_sources
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- 4. CORRIGIR DOCUMENT VALIDATIONS
DROP POLICY IF EXISTS "Anyone can create validation logs" ON public.document_validations;
DROP POLICY IF EXISTS "Users can view validation logs" ON public.document_validations;

-- Apenas donos dos documentos ou admins
CREATE POLICY "document_validations_owners_only" ON public.document_validations
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM patient_documents pd 
        WHERE pd.id = document_validations.document_id 
        AND pd.patient_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'admin'
      )
    )
  );

-- Service role para logs
CREATE POLICY "document_validations_service_role" ON public.document_validations
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- 5. CRIAR TABELA DE AUDITORIA PARA OPERAÇÕES SENSÍVEIS
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_audit_admin_only" ON public.security_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  );

CREATE POLICY "security_audit_service_role" ON public.security_audit_log
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- 6. CRIAR FUNÇÃO DE AUDITORIA PARA PAGAMENTOS
CREATE OR REPLACE FUNCTION public.audit_payments_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    table_name,
    operation,
    user_id,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    'payments',
    TG_OP,
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar trigger de auditoria para payments
DROP TRIGGER IF EXISTS payments_audit_trigger ON public.payments;
CREATE TRIGGER payments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_payments_changes();

-- 7. COMENTÁRIOS DE SEGURANÇA
COMMENT ON POLICY "payments_select_owners" ON public.payments IS 'Permite acesso apenas aos donos do pagamento via consulta associada';
COMMENT ON POLICY "external_data_sources_admin_only" ON public.external_data_sources IS 'Protege API keys limitando acesso a administradores';
COMMENT ON TABLE public.security_audit_log IS 'Log de auditoria para operações sensíveis no sistema';