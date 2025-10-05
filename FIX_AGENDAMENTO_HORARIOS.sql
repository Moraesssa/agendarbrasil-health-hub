-- ================================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE AGENDAMENTO - HORÁRIOS
-- ================================================================
-- Este script corrige o problema de horários não aparecendo na página de agendamento
-- Problema identificado: função get_doctor_schedule_v2 não existe
-- ================================================================

BEGIN;

-- ================================================================
-- ETAPA 1: CRIAR FUNÇÃO PARA BUSCAR HORÁRIOS DISPONÍVEIS
-- ================================================================

SELECT '1. CRIANDO FUNÇÃO get_doctor_schedule_v2' as etapa;

-- Dropar função antiga se existir
DROP FUNCTION IF EXISTS public.get_doctor_schedule_v2(UUID, DATE);
DROP FUNCTION IF EXISTS public.get_doctor_schedule(UUID, DATE);

-- Criar nova função que retorna horários disponíveis por local
CREATE OR REPLACE FUNCTION public.get_doctor_schedule_v2(
  p_doctor_id UUID,
  p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_locations JSONB;
  v_day_of_week INTEGER;
BEGIN
  -- Obter dia da semana (0 = domingo, 6 = sábado)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Buscar locais de atendimento com horários disponíveis
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', la.id,
      'nome_local', la.nome,
      'endereco', jsonb_build_object(
        'logradouro', la.endereco,
        'numero', la.numero,
        'complemento', la.complemento,
        'bairro', la.bairro,
        'cidade', la.cidade,
        'estado', la.estado,
        'cep', la.cep
      ),
      'horarios_disponiveis', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'time', TO_CHAR(slot_time, 'HH24:MI'),
            'available', NOT EXISTS (
              SELECT 1 FROM consultas c
              WHERE c.medico_id = p_doctor_id
              AND c.data_consulta::date = p_date
              AND TO_CHAR(c.data_consulta, 'HH24:MI') = TO_CHAR(slot_time, 'HH24:MI')
              AND c.status IN ('agendada', 'confirmada', 'scheduled', 'confirmed', 'pending_payment')
            )
          )
          ORDER BY slot_time
        )
        FROM (
          -- Gerar slots de horário baseado nos horários de funcionamento
          SELECT generate_series(
            (p_date + hf.hora_inicio)::timestamp,
            (p_date + hf.hora_fim - INTERVAL '30 minutes')::timestamp,
            INTERVAL '30 minutes'
          ) AS slot_time
          FROM horarios_funcionamento hf
          WHERE hf.medico_id = p_doctor_id
          AND hf.local_id = la.id
          AND hf.dia_semana = v_day_of_week
          AND hf.ativo = true
        ) slots
      )
    )
  ) INTO v_locations
  FROM locais_atendimento la
  WHERE la.medico_id = p_doctor_id
  AND la.ativo = true
  AND EXISTS (
    SELECT 1 FROM horarios_funcionamento hf
    WHERE hf.medico_id = p_doctor_id
    AND hf.local_id = la.id
    AND hf.dia_semana = v_day_of_week
    AND hf.ativo = true
  );
  
  -- Construir resultado final
  v_result := jsonb_build_object(
    'doctor_id', p_doctor_id,
    'date', p_date,
    'locations', COALESCE(v_locations, '[]'::jsonb)
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao buscar horários: %', SQLERRM;
    RETURN jsonb_build_object(
      'doctor_id', p_doctor_id,
      'date', p_date,
      'locations', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_v2(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_v2(UUID, DATE) TO anon;

COMMENT ON FUNCTION public.get_doctor_schedule_v2(UUID, DATE) 
IS 'Retorna horários disponíveis de um médico para uma data específica, agrupados por local de atendimento';

-- ================================================================
-- ETAPA 2: CRIAR FUNÇÃO ALTERNATIVA SIMPLIFICADA (FALLBACK)
-- ================================================================

SELECT '2. CRIANDO FUNÇÃO SIMPLIFICADA get_available_time_slots' as etapa;

-- Função alternativa mais simples para casos onde não há horários_funcionamento configurados
CREATE OR REPLACE FUNCTION public.get_available_time_slots(
  p_doctor_id UUID,
  p_date DATE,
  p_start_hour INTEGER DEFAULT 8,
  p_end_hour INTEGER DEFAULT 18,
  p_interval_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_locations JSONB;
BEGIN
  -- Buscar locais de atendimento
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', la.id,
      'nome_local', la.nome,
      'endereco', jsonb_build_object(
        'logradouro', la.endereco,
        'numero', la.numero,
        'complemento', la.complemento,
        'bairro', la.bairro,
        'cidade', la.cidade,
        'estado', la.estado,
        'cep', la.cep
      ),
      'horarios_disponiveis', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'time', TO_CHAR(slot_time, 'HH24:MI'),
            'available', NOT EXISTS (
              SELECT 1 FROM consultas c
              WHERE c.medico_id = p_doctor_id
              AND c.data_consulta::date = p_date
              AND TO_CHAR(c.data_consulta, 'HH24:MI') = TO_CHAR(slot_time, 'HH24:MI')
              AND c.status IN ('agendada', 'confirmada', 'scheduled', 'confirmed', 'pending_payment')
            )
          )
          ORDER BY slot_time
        )
        FROM (
          -- Gerar slots de horário padrão (8h às 18h)
          SELECT generate_series(
            (p_date + (p_start_hour || ' hours')::interval)::timestamp,
            (p_date + (p_end_hour || ' hours')::interval - (p_interval_minutes || ' minutes')::interval)::timestamp,
            (p_interval_minutes || ' minutes')::interval
          ) AS slot_time
        ) slots
      )
    )
  ) INTO v_locations
  FROM locais_atendimento la
  WHERE la.medico_id = p_doctor_id
  AND la.ativo = true;
  
  -- Construir resultado final
  v_result := jsonb_build_object(
    'doctor_id', p_doctor_id,
    'date', p_date,
    'locations', COALESCE(v_locations, '[]'::jsonb)
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao buscar horários: %', SQLERRM;
    RETURN jsonb_build_object(
      'doctor_id', p_doctor_id,
      'date', p_date,
      'locations', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_time_slots(UUID, DATE, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_time_slots(UUID, DATE, INTEGER, INTEGER, INTEGER) TO anon;

-- ================================================================
-- ETAPA 3: ATUALIZAR FUNÇÃO reserve_appointment_v2
-- ================================================================

SELECT '3. CRIANDO FUNÇÃO reserve_appointment_v2' as etapa;

DROP FUNCTION IF EXISTS public.reserve_appointment_v2(UUID, TIMESTAMP WITH TIME ZONE, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION public.reserve_appointment_v2(
  p_doctor_id UUID,
  p_appointment_datetime TIMESTAMP WITH TIME ZONE,
  p_specialty TEXT,
  p_family_member_id UUID DEFAULT NULL,
  p_local_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  appointment_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id UUID;
  v_patient_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_slot_available BOOLEAN;
BEGIN
  -- Obter ID do paciente atual
  SELECT id INTO v_patient_id
  FROM pacientes
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_patient_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Paciente não encontrado'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar se o slot está disponível
  SELECT NOT EXISTS (
    SELECT 1 FROM consultas 
    WHERE medico_id = p_doctor_id 
    AND data_consulta = p_appointment_datetime
    AND status IN ('agendada', 'confirmada', 'scheduled', 'confirmed', 'pending_payment')
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN QUERY SELECT FALSE, 'Este horário não está mais disponível'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Definir tempo de expiração (10 minutos para pagamento)
  v_expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Gerar novo ID de agendamento
  v_appointment_id := gen_random_uuid();

  -- Criar a reserva do agendamento
  INSERT INTO consultas (
    id,
    paciente_id,
    medico_id,
    paciente_familiar_id,
    agendado_por,
    data_consulta,
    tipo_consulta,
    local_id,
    status,
    expires_at,
    created_at
  ) VALUES (
    v_appointment_id,
    v_patient_id,
    p_doctor_id,
    p_family_member_id,
    auth.uid(),
    p_appointment_datetime,
    p_specialty,
    p_local_id,
    'pending_payment',
    v_expires_at,
    NOW()
  );

  RETURN QUERY SELECT TRUE, 'Horário reservado com sucesso'::TEXT, v_appointment_id;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT FALSE, 'Este horário não está mais disponível'::TEXT, NULL::UUID;
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Erro ao reservar horário: ' || SQLERRM)::TEXT, NULL::UUID;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_appointment_v2(UUID, TIMESTAMP WITH TIME ZONE, TEXT, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.reserve_appointment_v2(UUID, TIMESTAMP WITH TIME ZONE, TEXT, UUID, UUID)
IS 'Reserva um horário de consulta para o paciente autenticado';

-- ================================================================
-- ETAPA 4: VERIFICAR E CRIAR DADOS DE TESTE (SE NECESSÁRIO)
-- ================================================================

SELECT '4. VERIFICANDO DADOS DE TESTE' as etapa;

-- Verificar se existem horários de funcionamento configurados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM horarios_funcionamento WHERE ativo = true;
  
  IF v_count = 0 THEN
    RAISE NOTICE 'ATENÇÃO: Nenhum horário de funcionamento configurado!';
    RAISE NOTICE 'Os médicos precisam configurar seus horários de atendimento.';
    RAISE NOTICE 'Use a função get_available_time_slots como fallback.';
  ELSE
    RAISE NOTICE 'Encontrados % horários de funcionamento configurados', v_count;
  END IF;
END $$;

-- ================================================================
-- ETAPA 5: TESTAR AS FUNÇÕES
-- ================================================================

SELECT '5. TESTANDO FUNÇÕES CRIADAS' as etapa;

-- Teste 1: Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type,
  'Função criada com sucesso' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_doctor_schedule_v2', 'get_available_time_slots', 'reserve_appointment_v2')
ORDER BY routine_name;

-- Teste 2: Listar médicos disponíveis para teste
SELECT 
  m.id,
  p.display_name,
  m.especialidades,
  COUNT(DISTINCT la.id) as locais_count,
  COUNT(DISTINCT hf.id) as horarios_count
FROM medicos m
JOIN profiles p ON m.user_id = p.id
LEFT JOIN locais_atendimento la ON la.medico_id = m.id AND la.ativo = true
LEFT JOIN horarios_funcionamento hf ON hf.medico_id = m.id AND hf.ativo = true
GROUP BY m.id, p.display_name, m.especialidades
LIMIT 5;

COMMIT;

-- ================================================================
-- INSTRUÇÕES FINAIS
-- ================================================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║  CORREÇÃO DO SISTEMA DE AGENDAMENTO CONCLUÍDA COM SUCESSO!   ║
╚════════════════════════════════════════════════════════════════╝

✅ Funções criadas:
   - get_doctor_schedule_v2: Busca horários com base em horários_funcionamento
   - get_available_time_slots: Fallback com horários padrão (8h-18h)
   - reserve_appointment_v2: Reserva horários de consulta

📋 PRÓXIMOS PASSOS:

1. CONFIGURAR HORÁRIOS DOS MÉDICOS:
   Os médicos precisam configurar seus horários de funcionamento na tabela
   horarios_funcionamento para que os horários apareçam corretamente.

2. TESTAR O AGENDAMENTO:
   - Acesse /agendamento
   - Selecione especialidade, estado, cidade e médico
   - Selecione uma data
   - Verifique se os horários aparecem

3. SE OS HORÁRIOS NÃO APARECEREM:
   Execute este comando para usar horários padrão:
   
   SELECT * FROM get_available_time_slots(
     ''[ID_DO_MEDICO]''::uuid,
     CURRENT_DATE + 1,
     8,  -- hora início
     18, -- hora fim
     30  -- intervalo em minutos
   );

4. VERIFICAR LOGS:
   Abra o console do navegador (F12) e verifique se há erros
   relacionados às chamadas RPC.

═══════════════════════════════════════════════════════════════

' as instrucoes;
