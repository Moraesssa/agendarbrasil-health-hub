-- CORREÇÃO CRÍTICA - REMOVER TODAS AS POLÍTICAS EXISTENTES E RECRIAR SEGURAS

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES DA TABELA PAGAMENTOS
DROP POLICY IF EXISTS "secure_pagamentos_delete_owners_only" ON pagamentos;
DROP POLICY IF EXISTS "secure_pagamentos_insert" ON pagamentos;
DROP POLICY IF EXISTS "secure_pagamentos_select_doctors" ON pagamentos;
DROP POLICY IF EXISTS "secure_pagamentos_select_patients" ON pagamentos;
DROP POLICY IF EXISTS "secure_pagamentos_service_role" ON pagamentos;
DROP POLICY IF EXISTS "secure_pagamentos_update_doctors" ON pagamentos;
DROP POLICY IF EXISTS "secure_pagamentos_update_patients" ON pagamentos;
DROP POLICY IF EXISTS "secure_payments_select_owners" ON pagamentos;
DROP POLICY IF EXISTS "secure_payments_insert" ON pagamentos;
DROP POLICY IF EXISTS "secure_payments_update" ON pagamentos;
DROP POLICY IF EXISTS "secure_payments_delete" ON pagamentos;
DROP POLICY IF EXISTS "payments_service_role_access" ON pagamentos;

-- 2. REMOVER POLÍTICAS DAS OUTRAS TABELAS
DROP POLICY IF EXISTS "Allow administrators to view integration logs" ON integration_logs;
DROP POLICY IF EXISTS "Service role can access all logs" ON integration_logs;
DROP POLICY IF EXISTS "Anyone can create validation logs" ON document_validations;
DROP POLICY IF EXISTS "Users can view validation logs" ON document_validations;
DROP POLICY IF EXISTS "document_validations_owner_only" ON document_validations;
DROP POLICY IF EXISTS "document_validations_view_own" ON document_validations;
DROP POLICY IF EXISTS "Users can view active data sources" ON external_data_sources;
DROP POLICY IF EXISTS "external_data_sources_admin_only" ON external_data_sources;

-- 3. CRIAR POLÍTICAS ULTRA SEGURAS PARA PAGAMENTOS
-- Apenas service role para operações críticas
CREATE POLICY "pagamentos_service_role_only" ON pagamentos
FOR ALL USING (current_setting('role') = 'service_role');

-- Usuários podem ver apenas seus próprios pagamentos
CREATE POLICY "pagamentos_select_own_only" ON pagamentos
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        auth.uid() = paciente_id OR 
        auth.uid() = medico_id OR 
        auth.uid() = usuario_id
    )
);

-- Usuários podem inserir apenas para si mesmos
CREATE POLICY "pagamentos_insert_own_only" ON pagamentos
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
        auth.uid() = paciente_id OR 
        auth.uid() = usuario_id
    )
);

-- Apenas médicos podem atualizar seus pagamentos
CREATE POLICY "pagamentos_update_doctors_only" ON pagamentos
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = medico_id
);

-- 4. CRIAR POLÍTICAS SEGURAS PARA INTEGRATION_LOGS
-- Apenas service role e médicos
CREATE POLICY "integration_logs_service_role" ON integration_logs
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "integration_logs_doctors_only" ON integration_logs
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'medico'
    )
);

-- 5. CRIAR POLÍTICAS SEGURAS PARA DOCUMENT_VALIDATIONS
-- Apenas donos dos documentos
CREATE POLICY "document_validations_strict_owner" ON document_validations
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM patient_documents pd 
        WHERE pd.id = document_validations.document_id 
        AND pd.patient_id = auth.uid()
    )
);

CREATE POLICY "document_validations_view_strict" ON document_validations
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM patient_documents pd 
        WHERE pd.id = document_validations.document_id 
        AND pd.patient_id = auth.uid()
    )
);

-- 6. CRIAR POLÍTICAS SEGURAS PARA EXTERNAL_DATA_SOURCES
-- Apenas médicos verificados
CREATE POLICY "external_data_sources_verified_doctors" ON external_data_sources
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles p 
        JOIN medicos m ON m.user_id = p.id
        WHERE p.id = auth.uid() 
        AND p.user_type = 'medico'
        AND m.verificacao->>'aprovado' = 'true'
    )
);

-- 7. GARANTIR RLS HABILITADO
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR TABELA WEBHOOK_EVENT_LOGS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS webhook_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'received',
    error_message TEXT,
    source_ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_event_logs ENABLE ROW LEVEL SECURITY;

-- Política para webhook logs - apenas service role
CREATE POLICY "webhook_logs_service_only" ON webhook_event_logs
FOR ALL USING (current_setting('role') = 'service_role');

-- 9. CRIAR AUDITORIA SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    changed_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_service_only" ON security_audit_log
FOR ALL USING (current_setting('role') = 'service_role');

-- 10. FUNÇÃO E TRIGGER DE AUDITORIA
CREATE OR REPLACE FUNCTION audit_critical_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        table_name, 
        operation, 
        user_id, 
        changed_data,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para pagamentos
DROP TRIGGER IF EXISTS payments_audit_trigger ON pagamentos;
CREATE TRIGGER payments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

-- 11. COMENTÁRIOS DE SEGURANÇA
COMMENT ON POLICY "pagamentos_service_role_only" ON pagamentos IS 'CRÍTICO: Service role apenas - sem exceções';
COMMENT ON POLICY "pagamentos_select_own_only" ON pagamentos IS 'SEGURO: Usuários veem apenas próprios pagamentos';
COMMENT ON POLICY "webhook_logs_service_only" ON webhook_event_logs IS 'CRÍTICO: Webhooks apenas service role';
COMMENT ON POLICY "external_data_sources_verified_doctors" ON external_data_sources IS 'SEGURO: Apenas médicos verificados';