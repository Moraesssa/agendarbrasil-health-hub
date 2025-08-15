-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- AgendarBrasil - Correção completa de vulnerabilidades mantendo funcionalidades

-- 1. Corrigir exposição da tabela payments/pagamentos
-- Remover policies excessivamente permissivas e implementar acesso restrito

-- Primeiro, corrigir a tabela pagamentos
DROP POLICY IF EXISTS "rls_pagamentos_select" ON public.pagamentos;
DROP POLICY IF EXISTS "rls_pagamentos_insert" ON public.pagamentos;
DROP POLICY IF EXISTS "rls_pagamentos_update" ON public.pagamentos;
DROP POLICY IF EXISTS "rls_pagamentos_delete" ON public.pagamentos;

-- Criar policies restritivas para pagamentos
CREATE POLICY "pagamentos_select_own" ON public.pagamentos
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = usuario_id OR 
    auth.uid() = paciente_id OR 
    auth.uid() = medico_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
);

CREATE POLICY "pagamentos_insert_authorized" ON public.pagamentos
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = usuario_id OR 
    auth.uid() = paciente_id OR 
    auth.uid() = medico_id
  )
);

CREATE POLICY "pagamentos_update_own" ON public.pagamentos
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = usuario_id OR 
    auth.uid() = paciente_id OR 
    auth.uid() = medico_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
);

CREATE POLICY "pagamentos_delete_admin_only" ON public.pagamentos
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- 2. Proteger catálogo médico (medical_services)
-- Remover acesso público e exigir autenticação
DROP POLICY IF EXISTS "Anyone can view medical services" ON public.medical_services;

CREATE POLICY "authenticated_users_can_view_medical_services" ON public.medical_services
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- 3. Corrigir funções SQL vulneráveis - adicionar SET search_path = ''

-- Corrigir get_my_locations
CREATE OR REPLACE FUNCTION public.get_my_locations()
RETURNS SETOF locais_atendimento
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT *
  FROM public.locais_atendimento
  WHERE medico_id = auth.uid()
  ORDER BY nome_local;
$function$;

-- Corrigir get_doctor_basic_info
CREATE OR REPLACE FUNCTION public.get_doctor_basic_info(doctor_ids uuid[] DEFAULT NULL::uuid[])
RETURNS TABLE(id uuid, display_name text, user_type text, is_active boolean, photo_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Corrigir get_doctors_by_location_and_specialty
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(p_specialty text, p_city text, p_state text)
RETURNS TABLE(id uuid, display_name text, especialidades text[], crm text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Corrigir get_available_states
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Corrigir get_available_cities
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Corrigir get_family_members
CREATE OR REPLACE FUNCTION public.get_family_members(user_uuid uuid)
RETURNS TABLE(id uuid, family_member_id uuid, display_name text, email text, relationship text, permission_level text, can_schedule boolean, can_view_history boolean, can_cancel boolean, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    fm.id,
    fm.family_member_id,
    p.display_name,
    p.email,
    fm.relationship,
    fm.permission_level,
    fm.can_schedule,
    fm.can_view_history,
    fm.can_cancel,
    fm.status
  FROM public.family_members fm
  JOIN public.profiles p ON p.id = fm.family_member_id
  WHERE fm.user_id = user_uuid AND fm.status = 'active'
  ORDER BY fm.created_at DESC;
$function$;

-- Corrigir reserve_appointment_slot
CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(p_doctor_id uuid, p_patient_id uuid, p_family_member_id uuid, p_scheduled_by_id uuid, p_appointment_datetime timestamp with time zone, p_specialty text)
RETURNS TABLE(success boolean, appointment_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_slot_available BOOLEAN;
    v_new_appointment_id UUID;
    v_expiration_time TIMESTAMPTZ := now() + interval '15 minutes';
BEGIN
    -- Check if a slot is already scheduled or pending for the same doctor and time
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.consultas c
        WHERE c.medico_id = p_doctor_id
          AND c.consultation_date = p_appointment_datetime
          AND (
            c.status IN ('scheduled', 'agendada', 'confirmada') OR
            (c.status IN ('pending_payment', 'pending') AND c.expires_at > now()) OR
            (c.status_pagamento = 'pendente' AND c.expires_at > now())
          )
    ) INTO v_slot_available;

    IF v_slot_available THEN
        -- Insert a new appointment
        INSERT INTO public.consultas (
            medico_id,
            paciente_id,
            paciente_familiar_id,
            consultation_date,
            consultation_type,
            status,
            status_pagamento,
            expires_at,
            patient_name,
            patient_email,
            notes
        )
        VALUES (
            p_doctor_id,
            p_patient_id,
            p_family_member_id,
            p_appointment_datetime,
            p_specialty,
            'agendada',
            'pendente',
            v_expiration_time,
            COALESCE(
                (SELECT display_name FROM public.profiles WHERE id = COALESCE(p_family_member_id, p_patient_id)),
                'Paciente'
            ),
            COALESCE(
                (SELECT email FROM public.profiles WHERE id = COALESCE(p_family_member_id, p_patient_id)),
                'email@exemplo.com'
            ),
            'Consulta agendada via sistema'
        )
        RETURNING id INTO v_new_appointment_id;

        RETURN QUERY SELECT TRUE, v_new_appointment_id, 'Horário reservado com sucesso'::text;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Este horário não está mais disponível'::text;
    END IF;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Este horário já foi ocupado por outro paciente'::text;
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, ('Erro interno: ' || SQLERRM)::text;
END;
$function$;

-- 4. Implementar auditoria para tabelas críticas
-- Criar tabela de auditoria simples se não existir
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    changed_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Criar policy para auditoria - apenas admins podem ver
CREATE POLICY "audit_log_admin_only" ON public.security_audit_log
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Criar trigger para auditar mudanças em pagamentos
CREATE OR REPLACE FUNCTION public.audit_payments_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Criar trigger para pagamentos se não existir
DROP TRIGGER IF EXISTS payment_audit_trigger ON public.pagamentos;
CREATE TRIGGER payment_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
    FOR EACH ROW EXECUTE FUNCTION public.audit_payments_changes();

-- Comentários para documentação
COMMENT ON TABLE public.security_audit_log IS 'Log de auditoria para operações críticas de segurança';
COMMENT ON FUNCTION public.audit_payments_changes() IS 'Função de auditoria para mudanças na tabela de pagamentos';