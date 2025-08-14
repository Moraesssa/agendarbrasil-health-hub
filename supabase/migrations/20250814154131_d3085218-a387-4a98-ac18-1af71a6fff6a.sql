-- ===========================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS - AGENDARBRASIL
-- ===========================================

-- 1. CORRIGIR VULNERABILIDADE CRÍTICA: TABELA PAYMENTS
-- Remover políticas inseguras e implementar RLS apropriado
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook inserts" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook selects" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook updates" ON public.payments;

-- Implementar políticas RLS seguras para payments
CREATE POLICY "payments_select_owners" ON public.payments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = usuario_id OR 
      auth.uid() = paciente_id OR
      auth.uid() = medico_id OR
      EXISTS (
        SELECT 1 FROM family_members fm 
        WHERE fm.user_id = auth.uid() 
        AND (fm.family_member_id = payments.paciente_id OR fm.family_member_id = payments.usuario_id)
        AND fm.can_view_history = true 
        AND fm.status = 'active'
      )
    )
  );

CREATE POLICY "payments_insert_authorized" ON public.payments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = usuario_id OR 
      auth.uid() = paciente_id OR
      EXISTS (
        SELECT 1 FROM family_members fm 
        WHERE fm.user_id = auth.uid() 
        AND (fm.family_member_id = payments.paciente_id OR fm.family_member_id = payments.usuario_id)
        AND fm.can_schedule = true 
        AND fm.status = 'active'
      )
    )
  );

CREATE POLICY "payments_update_authorized" ON public.payments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = usuario_id OR 
      auth.uid() = paciente_id OR
      auth.uid() = medico_id
    )
  );

CREATE POLICY "payments_service_role" ON public.payments
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- 2. CORRIGIR VULNERABILIDADE CRÍTICA: WEBHOOK EVENT LOGS
DROP POLICY IF EXISTS "Allow administrators to view integration logs" ON public.webhook_event_logs;
DROP POLICY IF EXISTS "Allow service role to access all logs" ON public.webhook_event_logs;
DROP POLICY IF EXISTS "Allow webhook log inserts" ON public.webhook_event_logs;
DROP POLICY IF EXISTS "Allow webhook log selects" ON public.webhook_event_logs;

-- Apenas service role pode acessar webhook logs
CREATE POLICY "webhook_logs_service_role_only" ON public.webhook_event_logs
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- Admins podem ver logs mas sem dados sensíveis
CREATE POLICY "webhook_logs_admin_read_only" ON public.webhook_event_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    )
  );

-- 3. PROTEGER API KEYS EM EXTERNAL_DATA_SOURCES
DROP POLICY IF EXISTS "Users can view active data sources" ON public.external_data_sources;

-- Apenas admins podem ver data sources (sem API keys)
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

-- 5. CORRIGIR FUNÇÕES COM SEARCH_PATH VULNERÁVEL
-- Atualizar funções críticas com search_path seguro

-- update_location_timestamp
CREATE OR REPLACE FUNCTION public.update_location_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.ultima_atualizacao = NOW();
    RETURN NEW;
END;
$function$;

-- cleanup_expired_reservations  
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.temporary_reservations 
  WHERE expires_at < now();
  RETURN NULL;
END;
$function$;

-- notify_waiting_list
CREATE OR REPLACE FUNCTION public.notify_waiting_list()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Se uma consulta foi cancelada, notificar lista de espera
  IF OLD.status IN ('agendada', 'confirmada') AND NEW.status = 'cancelada' THEN
    -- Marcar primeira pessoa da lista de espera como notificada
    UPDATE public.waiting_list 
    SET status = 'notified', updated_at = now()
    WHERE medico_id = NEW.medico_id 
      AND data_preferencia = NEW.data_consulta::date
      AND status = 'active'
      AND id = (
        SELECT id FROM public.waiting_list
        WHERE medico_id = NEW.medico_id 
          AND data_preferencia = NEW.data_consulta::date
          AND status = 'active'
        ORDER BY created_at
        LIMIT 1
      );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- update_fhir_last_updated
CREATE OR REPLACE FUNCTION public.update_fhir_last_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$function$;

-- notify_location_status_change
CREATE OR REPLACE FUNCTION public.notify_location_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'location_status_change',
            json_build_object(
                'location_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'medico_id', NEW.medico_id,
                'timestamp', NOW()
            )::text
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- notify_referral_event
CREATE OR REPLACE FUNCTION public.notify_referral_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
declare
  v_user_id uuid;
  v_title text;
  v_message text;
  v_action_url text;
  v_type text;
  v_action_required boolean := false;
  v_priority text := 'normal';
  v_doctor_name text;
  v_origin_name text;
begin
  v_user_id := coalesce(NEW.paciente_id, OLD.paciente_id);

  -- Tentar obter nomes (se existirem perfis)
  if coalesce(NEW.medico_origem_id, OLD.medico_origem_id) is not null then
    select p.display_name into v_origin_name
    from public.profiles p
    where p.id = coalesce(NEW.medico_origem_id, OLD.medico_origem_id)
    limit 1;
  end if;

  if coalesce(NEW.medico_destino_id, OLD.medico_destino_id) is not null then
    select p.display_name into v_doctor_name
    from public.profiles p
    where p.id = coalesce(NEW.medico_destino_id, OLD.medico_destino_id)
    limit 1;
  end if;

  if TG_OP = 'INSERT' then
    v_title := 'Novo encaminhamento';
    v_type := 'referral_created';
    v_message := format(
      'Você foi encaminhado para %s por %s. Aguardando confirmação do médico de destino.',
      coalesce(NEW.especialidade, 'especialidade'),
      coalesce(v_origin_name, 'seu médico')
    );
    v_action_required := false;
    v_action_url := '/perfil';

  elsif TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    if NEW.status = 'aceito' then
      v_title := 'Encaminhamento aceito';
      v_type := 'referral_accepted';
      v_priority := 'high';
      v_action_required := true;
      v_message := format(
        'Dr(a). %s aceitou seu encaminhamento para %s. Escolha um horário para consulta.',
        coalesce(v_doctor_name, 'o médico'),
        coalesce(NEW.especialidade, 'especialidade')
      );
      v_action_url := '/agendamento?doctorId='||coalesce(NEW.medico_destino_id::text,'')||
                      '&specialty='||coalesce(NEW.especialidade,'')||
                      '&ref='||coalesce(NEW.id::text,'');

    elsif NEW.status = 'rejeitado' then
      v_title := 'Encaminhamento rejeitado';
      v_type := 'referral_rejected';
      v_message := 'O encaminhamento foi rejeitado. Entre em contato com seu médico para alternativas.';
      v_action_required := false;
      v_action_url := '/perfil';

    elsif NEW.status = 'realizado' then
      v_title := 'Encaminhamento concluído';
      v_type := 'referral_completed';
      v_message := 'Encaminhamento concluído. Consulte seu histórico para detalhes.';
      v_action_required := false;
      v_action_url := '/historico';

    else
      -- Outros status não geram notificação
      return NEW;
    end if;
  else
    return NEW;
  end if;

  insert into public.family_notifications (
    id, user_id, patient_id, title, message, notification_type,
    priority, action_required, action_url, read, created_at, scheduled_for
  ) values (
    gen_random_uuid(),
    v_user_id,
    v_user_id,
    v_title,
    v_message,
    v_type,
    v_priority,
    v_action_required,
    v_action_url,
    false,
    now(),
    now()
  );

  return NEW;
end;
$function$;

-- 6. CRIAR TABELA DE AUDITORIA PARA OPERAÇÕES SENSÍVEIS
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

-- 7. CRIAR FUNÇÃO DE AUDITORIA PARA PAGAMENTOS
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

-- 8. COMENTÁRIOS DE SEGURANÇA
COMMENT ON POLICY "payments_select_owners" ON public.payments IS 'Permite acesso apenas aos donos do pagamento e familiares autorizados';
COMMENT ON POLICY "webhook_logs_service_role_only" ON public.webhook_event_logs IS 'Acesso restrito ao service role para proteção de dados de webhook';
COMMENT ON POLICY "external_data_sources_admin_only" ON public.external_data_sources IS 'Protege API keys limitando acesso a administradores';
COMMENT ON TABLE public.security_audit_log IS 'Log de auditoria para operações sensíveis no sistema';