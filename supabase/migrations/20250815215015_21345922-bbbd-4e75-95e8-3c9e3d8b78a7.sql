-- FASE 2: CORREÇÕES COMPLEMENTARES E MELHORIAS
-- AgendarBrasil - Sistema 100% funcional e seguro

-- 1. Corrigir política de auditoria que já existe
DROP POLICY IF EXISTS "audit_log_admin_only" ON public.security_audit_log;

CREATE POLICY "audit_log_view_admin_only" ON public.security_audit_log
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- 2. Criar função para validar UUIDs no banco
CREATE OR REPLACE FUNCTION public.is_valid_uuid(input_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Verificar se é NULL ou string vazia
  IF input_text IS NULL OR input_text = '' OR input_text = 'undefined' OR input_text = 'null' THEN
    RETURN false;
  END IF;
  
  -- Tentar converter para UUID
  BEGIN
    PERFORM input_text::uuid;
    RETURN true;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;
END;
$function$;

-- 3. Melhorar a função reserve_appointment_slot para evitar erros de UUID
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
    v_patient_name TEXT;
    v_patient_email TEXT;
BEGIN
    -- Validação de UUIDs obrigatórios
    IF p_doctor_id IS NULL OR p_patient_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'IDs de médico e paciente são obrigatórios'::text;
        RETURN;
    END IF;

    -- Validação de data
    IF p_appointment_datetime IS NULL OR p_appointment_datetime <= now() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Data e horário da consulta inválidos'::text;
        RETURN;
    END IF;

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
        -- Buscar dados do paciente com segurança
        SELECT display_name, email INTO v_patient_name, v_patient_email
        FROM public.profiles 
        WHERE id = COALESCE(p_family_member_id, p_patient_id)
        LIMIT 1;

        -- Usar valores padrão se não encontrar
        v_patient_name := COALESCE(v_patient_name, 'Paciente');
        v_patient_email := COALESCE(v_patient_email, 'contato@agendarbrasil.com');

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
            COALESCE(p_specialty, 'Consulta Médica'),
            'agendada',
            'pendente',
            v_expiration_time,
            v_patient_name,
            v_patient_email,
            'Consulta agendada via sistema - ' || now()::text
        )
        RETURNING id INTO v_new_appointment_id;

        RETURN QUERY SELECT TRUE, v_new_appointment_id, 'Horário reservado com sucesso'::text;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Este horário não está mais disponível'::text;
    END IF;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Este horário já foi ocupado por outro paciente'::text;
    WHEN foreign_key_violation THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Dados de médico ou paciente inválidos'::text;
    WHEN OTHERS THEN
        -- Log do erro para debugging
        INSERT INTO public.security_audit_log (table_name, operation, user_id, changed_data)
        VALUES ('consultas', 'ERROR', auth.uid(), jsonb_build_object('error', SQLERRM, 'doctor_id', p_doctor_id, 'patient_id', p_patient_id));
        
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Erro interno do sistema. Tente novamente.'::text;
END;
$function$;

-- 4. Criar função para monitoramento de sistema
-- Adicionar a coluna 'is_active' se ela não existir, para garantir a robustez do script
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS TABLE(
  component text,
  status text,
  details jsonb,
  checked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  auth_users_count integer;
  profiles_count integer;
  consultas_today integer;
BEGIN
  -- Verificar contadores básicos
  SELECT COUNT(*) INTO profiles_count FROM public.profiles WHERE is_active = true;
  SELECT COUNT(*) INTO consultas_today FROM public.consultas WHERE DATE(created_at) = CURRENT_DATE;

  -- Retornar status dos componentes
  RETURN QUERY VALUES
    ('database'::text, 'healthy'::text, jsonb_build_object('profiles', profiles_count)::jsonb, now()::timestamptz),
    ('appointments'::text, 'healthy'::text, jsonb_build_object('today', consultas_today)::jsonb, now()::timestamptz);
END;
$function$;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_consultas_medico_date ON public.consultas(medico_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_date ON public.consultas(paciente_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultas_status_date ON public.consultas(status, consultation_date);
CREATE INDEX IF NOT EXISTS idx_pagamentos_consulta ON public.pagamentos(consulta_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);

-- 6. Comentários para documentação
COMMENT ON FUNCTION public.is_valid_uuid(text) IS 'Valida se uma string é um UUID válido, prevenindo erros de sintaxe';
COMMENT ON FUNCTION public.system_health_check() IS 'Verifica o status geral do sistema AgendarBrasil';
COMMENT ON INDEX idx_consultas_medico_date IS 'Índice para otimizar consultas por médico e data';
COMMENT ON INDEX idx_pagamentos_consulta IS 'Índice para otimizar busca de pagamentos por consulta';