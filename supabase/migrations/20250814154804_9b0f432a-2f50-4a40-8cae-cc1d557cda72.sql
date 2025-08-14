-- CORREÇÃO CRÍTICA DE SEGURANÇA - APLICAR AGORA!
-- Remove todas as políticas perigosas e implementa segurança adequada

-- 1. DROPAR TODAS AS POLÍTICAS PERIGOSAS DA TABELA PAYMENTS
DROP POLICY IF EXISTS "Allow all operations on payments" ON pagamentos;
DROP POLICY IF EXISTS "Allow webhook selects" ON pagamentos;
DROP POLICY IF EXISTS "Allow webhook updates" ON pagamentos;
DROP POLICY IF EXISTS "Allow webhook inserts" ON pagamentos;
DROP POLICY IF EXISTS "Enable all operations for service role" ON pagamentos;

-- 2. DROPAR TODAS AS POLÍTICAS PERIGOSAS DA TABELA WEBHOOK_EVENT_LOGS
DROP POLICY IF EXISTS "Allow webhook log selects" ON webhook_event_logs;
DROP POLICY IF EXISTS "Allow webhook log inserts" ON webhook_event_logs;
DROP POLICY IF EXISTS "Allow administrators to view integration logs" ON webhook_event_logs;

-- 3. DROPAR POLÍTICAS MUITO PERMISSIVAS DE OUTRAS TABELAS
DROP POLICY IF EXISTS "Anyone can create validation logs" ON document_validations;
DROP POLICY IF EXISTS "Users can view validation logs" ON document_validations;
DROP POLICY IF EXISTS "Users can view active data sources" ON external_data_sources;

-- 4. GARANTIR QUE RLS ESTÁ HABILITADO EM TODAS AS TABELAS CRÍTICAS
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS SEGURAS PARA PAYMENTS
-- Apenas usuários donos dos pagamentos podem ver/alterar seus pagamentos
CREATE POLICY "secure_payments_select_owners" ON pagamentos
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        auth.uid() = paciente_id OR 
        auth.uid() = medico_id OR 
        auth.uid() = usuario_id OR
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.user_id = auth.uid() 
            AND (fm.family_member_id = pagamentos.paciente_id OR fm.family_member_id = pagamentos.usuario_id)
            AND fm.can_view_history = true 
            AND fm.status = 'active'
        )
    )
);

CREATE POLICY "secure_payments_insert" ON pagamentos
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
        auth.uid() = paciente_id OR 
        auth.uid() = usuario_id OR
        EXISTS (
            SELECT 1 FROM family_members fm 
            WHERE fm.user_id = auth.uid() 
            AND (fm.family_member_id = pagamentos.paciente_id OR fm.family_member_id = pagamentos.usuario_id)
            AND fm.can_schedule = true 
            AND fm.status = 'active'
        )
    )
);

CREATE POLICY "secure_payments_update" ON pagamentos
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
        auth.uid() = paciente_id OR 
        auth.uid() = medico_id OR 
        auth.uid() = usuario_id
    )
);

CREATE POLICY "secure_payments_delete" ON pagamentos
FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
        auth.uid() = paciente_id OR 
        auth.uid() = usuario_id
    )
);

-- Service role para webhooks
CREATE POLICY "payments_service_role_access" ON pagamentos
FOR ALL USING (current_setting('role') = 'service_role');

-- 6. CRIAR POLÍTICAS SEGURAS PARA WEBHOOK_EVENT_LOGS
-- Apenas service role e admins podem acessar
CREATE POLICY "webhook_logs_service_role" ON webhook_event_logs
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "webhook_logs_admin_access" ON webhook_event_logs
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'admin'
    )
);

-- 7. CRIAR POLÍTICAS SEGURAS PARA DOCUMENT_VALIDATIONS
-- Apenas donos dos documentos podem criar validações
CREATE POLICY "document_validations_owner_only" ON document_validations
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM patient_documents pd 
        WHERE pd.id = document_validations.document_id 
        AND pd.patient_id = auth.uid()
    )
);

CREATE POLICY "document_validations_view_own" ON document_validations
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM patient_documents pd 
        WHERE pd.id = document_validations.document_id 
        AND pd.patient_id = auth.uid()
    )
);

-- 8. CRIAR POLÍTICAS SEGURAS PARA EXTERNAL_DATA_SOURCES
-- Apenas admins podem ver fontes de dados
CREATE POLICY "external_data_sources_admin_only" ON external_data_sources
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'admin'
    )
);

-- 9. CRIAR TABELA DE AUDITORIA DE SEGURANÇA
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

-- Habilitar RLS na tabela de auditoria
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "audit_log_admin_only" ON security_audit_log
FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'admin'
    )
);

-- Service role pode inserir logs
CREATE POLICY "audit_log_service_insert" ON security_audit_log
FOR INSERT WITH CHECK (current_setting('role') = 'service_role');

-- 10. FUNÇÃO DE AUDITORIA PARA PAYMENTS
CREATE OR REPLACE FUNCTION audit_payments_changes()
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
        'pagamentos',
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

-- 11. TRIGGER DE AUDITORIA PARA PAYMENTS
DROP TRIGGER IF EXISTS payment_audit_trigger ON pagamentos;
CREATE TRIGGER payment_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION audit_payments_changes();

-- 12. CORRIGIR FUNÇÕES VULNERÁVEIS - ADICIONAR search_path
CREATE OR REPLACE FUNCTION public.get_my_locations()
RETURNS SETOF locais_atendimento
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT *
  FROM public.locais_atendimento
  WHERE medico_id = auth.uid()
  ORDER BY nome_local;
$$;

CREATE OR REPLACE FUNCTION public.get_doctor_basic_info(doctor_ids uuid[] DEFAULT NULL::uuid[])
RETURNS TABLE(id uuid, display_name text, user_type text, is_active boolean, photo_url text)
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

CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(p_specialty text, p_city text, p_state text)
RETURNS TABLE(id uuid, display_name text, especialidades text[], crm text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    m.especialidades,
    m.crm
  FROM public.profiles p
  JOIN public.medicos m ON p.id = m.user_id
  JOIN public.locais_atendimento l ON m.user_id = l.medico_id
  WHERE p.user_type = 'medico'
  AND p.is_active = true
  AND l.ativo = true
  AND p_specialty = ANY(m.especialidades)
  AND (l.endereco ->> 'cidade') = p_city
  AND (l.endereco ->> 'uf') = p_state
  ORDER BY p.display_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT (l.endereco ->> 'uf')::text as uf
  FROM public.locais_atendimento l
  JOIN public.medicos m ON l.medico_id = m.user_id
  JOIN public.profiles p ON m.user_id = p.id
  WHERE l.ativo = true 
  AND p.is_active = true
  AND (l.endereco ->> 'uf') IS NOT NULL
  ORDER BY uf;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT (l.endereco ->> 'cidade')::text as cidade
  FROM public.locais_atendimento l
  JOIN public.medicos m ON l.medico_id = m.user_id
  JOIN public.profiles p ON m.user_id = p.id
  WHERE l.ativo = true 
  AND p.is_active = true
  AND (l.endereco ->> 'uf') = state_uf
  AND (l.endereco ->> 'cidade') IS NOT NULL
  ORDER BY cidade;
END;
$$;

-- 13. COMENTÁRIOS DE SEGURANÇA NAS POLÍTICAS
COMMENT ON POLICY "secure_payments_select_owners" ON pagamentos IS 'SECURITY: Apenas donos dos pagamentos podem visualizar - pacientes, médicos ou familiares autorizados';
COMMENT ON POLICY "payments_service_role_access" ON pagamentos IS 'SECURITY: Service role para processamento de webhooks - acesso total restrito';
COMMENT ON POLICY "webhook_logs_service_role" ON webhook_event_logs IS 'SECURITY: Apenas service role pode gerenciar logs de webhook';
COMMENT ON POLICY "document_validations_owner_only" ON document_validations IS 'SECURITY: Apenas donos dos documentos podem criar validações';
COMMENT ON POLICY "external_data_sources_admin_only" ON external_data_sources IS 'SECURITY: Apenas admins podem acessar fontes de dados externas';

-- 14. CRIAR TABELA WEBHOOK_EVENT_LOGS SE NÃO EXISTIR
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

-- Garantir RLS na tabela de webhook logs
ALTER TABLE webhook_event_logs ENABLE ROW LEVEL SECURITY;