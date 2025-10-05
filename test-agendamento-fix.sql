-- ================================================================
-- SCRIPT DE TESTE - VALIDAÇÃO DO FIX DE AGENDAMENTO
-- ================================================================
-- Execute este script APÓS aplicar o FIX_AGENDAMENTO_HORARIOS.sql
-- para validar se tudo está funcionando corretamente
-- ================================================================

\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║         TESTE DE VALIDAÇÃO - SISTEMA DE AGENDAMENTO          ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

-- ================================================================
-- TESTE 1: Verificar se as funções foram criadas
-- ================================================================

\echo '📋 TESTE 1: Verificando funções RPC...'
\echo ''

SELECT 
  routine_name as "Função",
  routine_type as "Tipo",
  CASE 
    WHEN routine_name IN ('get_doctor_schedule_v2', 'get_available_time_slots', 'reserve_appointment_v2') 
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_doctor_schedule_v2',
  'get_available_time_slots', 
  'reserve_appointment_v2',
  'get_specialties',
  'get_available_states',
  'get_available_cities',
  'get_doctors_by_location_and_specialty'
)
ORDER BY routine_name;

\echo ''
\echo '---'
\echo ''

-- ================================================================
-- TESTE 2: Verificar estrutura de dados
-- ================================================================

\echo '📊 TESTE 2: Verificando estrutura de dados...'
\echo ''

-- Médicos cadastrados
SELECT 
  '👨‍⚕️ Médicos cadastrados' as "Categoria",
  COUNT(*) as "Total",
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '⚠️ NENHUM MÉDICO' END as "Status"
FROM medicos;

-- Locais de atendimento
SELECT 
  '🏥 Locais de atendimento ativos' as "Categoria",
  COUNT(*) as "Total",
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '⚠️ NENHUM LOCAL' END as "Status"
FROM locais_atendimento
WHERE ativo = true;

-- Horários de funcionamento
SELECT 
  '⏰ Horários de funcionamento' as "Categoria",
  COUNT(*) as "Total",
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '⚠️ NENHUM HORÁRIO' END as "Status"
FROM horarios_funcionamento
WHERE ativo = true;

\echo ''
\echo '---'
\echo ''

-- ================================================================
-- TESTE 3: Verificar médicos com configuração completa
-- ================================================================

\echo '🔍 TESTE 3: Médicos com configuração completa...'
\echo ''

SELECT 
  m.id as "ID Médico",
  p.display_name as "Nome",
  m.especialidades[1] as "Especialidade",
  COUNT(DISTINCT la.id) as "Locais",
  COUNT(DISTINCT hf.id) as "Horários",
  CASE 
    WHEN COUNT(DISTINCT la.id) > 0 AND COUNT(DISTINCT hf.id) > 0 
    THEN '✅ COMPLETO'
    WHEN COUNT(DISTINCT la.id) > 0 
    THEN '⚠️ SEM HORÁRIOS'
    ELSE '❌ SEM LOCAIS'
  END as "Status"
FROM medicos m
JOIN profiles p ON m.user_id = p.id
LEFT JOIN locais_atendimento la ON la.medico_id = m.id AND la.ativo = true
LEFT JOIN horarios_funcionamento hf ON hf.medico_id = m.id AND hf.ativo = true
GROUP BY m.id, p.display_name, m.especialidades
ORDER BY "Status" DESC, p.display_name
LIMIT 10;

\echo ''
\echo '---'
\echo ''

-- ================================================================
-- TESTE 4: Testar função get_doctor_schedule_v2
-- ================================================================

\echo '🧪 TESTE 4: Testando get_doctor_schedule_v2...'
\echo ''

DO $$
DECLARE
  v_doctor_id UUID;
  v_doctor_name TEXT;
  v_test_date DATE;
  v_result JSONB;
  v_locations_count INTEGER;
BEGIN
  -- Pegar primeiro médico com horários configurados
  SELECT m.id, p.display_name INTO v_doctor_id, v_doctor_name
  FROM medicos m
  JOIN profiles p ON m.user_id = p.id
  WHERE EXISTS (
    SELECT 1 FROM horarios_funcionamento hf
    WHERE hf.medico_id = m.id AND hf.ativo = true
  )
  LIMIT 1;
  
  IF v_doctor_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum médico com horários configurados encontrado';
    RAISE NOTICE '   Configure horários para pelo menos um médico para testar';
    RETURN;
  END IF;
  
  -- Data de teste (próxima segunda-feira)
  v_test_date := CURRENT_DATE + ((8 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7);
  
  -- Testar função
  SELECT get_doctor_schedule_v2(v_doctor_id, v_test_date) INTO v_result;
  
  -- Contar locais retornados
  SELECT jsonb_array_length(v_result->'locations') INTO v_locations_count;
  
  RAISE NOTICE '✅ Teste executado com sucesso!';
  RAISE NOTICE '   Médico: % (ID: %)', v_doctor_name, v_doctor_id;
  RAISE NOTICE '   Data: %', v_test_date;
  RAISE NOTICE '   Locais retornados: %', v_locations_count;
  
  IF v_locations_count > 0 THEN
    RAISE NOTICE '   Status: ✅ FUNCIONANDO';
  ELSE
    RAISE NOTICE '   Status: ⚠️ SEM HORÁRIOS DISPONÍVEIS';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao testar função: %', SQLERRM;
END $$;

\echo ''
\echo '---'
\echo ''

-- ================================================================
-- TESTE 5: Testar função fallback get_available_time_slots
-- ================================================================

\echo '🧪 TESTE 5: Testando get_available_time_slots (fallback)...'
\echo ''

DO $$
DECLARE
  v_doctor_id UUID;
  v_doctor_name TEXT;
  v_test_date DATE;
  v_result JSONB;
  v_locations_count INTEGER;
BEGIN
  -- Pegar primeiro médico
  SELECT m.id, p.display_name INTO v_doctor_id, v_doctor_name
  FROM medicos m
  JOIN profiles p ON m.user_id = p.id
  LIMIT 1;
  
  IF v_doctor_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum médico encontrado';
    RETURN;
  END IF;
  
  -- Data de teste (amanhã)
  v_test_date := CURRENT_DATE + 1;
  
  -- Testar função fallback
  SELECT get_available_time_slots(v_doctor_id, v_test_date, 8, 18, 30) INTO v_result;
  
  -- Contar locais retornados
  SELECT jsonb_array_length(v_result->'locations') INTO v_locations_count;
  
  RAISE NOTICE '✅ Teste executado com sucesso!';
  RAISE NOTICE '   Médico: % (ID: %)', v_doctor_name, v_doctor_id;
  RAISE NOTICE '   Data: %', v_test_date;
  RAISE NOTICE '   Locais retornados: %', v_locations_count;
  RAISE NOTICE '   Status: ✅ FUNCIONANDO (horários padrão 8h-18h)';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao testar função: %', SQLERRM;
END $$;

\echo ''
\echo '---'
\echo ''

-- ================================================================
-- TESTE 6: Verificar permissões RLS
-- ================================================================

\echo '🔒 TESTE 6: Verificando políticas RLS...'
\echo ''

SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  policyname as "Política",
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ SELECT'
    WHEN cmd = 'INSERT' THEN '➕ INSERT'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    ELSE cmd
  END as "Comando",
  CASE 
    WHEN roles::text LIKE '%authenticated%' THEN '✅ OK'
    ELSE '⚠️ VERIFICAR'
  END as "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('consultas', 'locais_atendimento', 'horarios_funcionamento', 'medicos', 'pacientes')
ORDER BY tablename, cmd;

\echo ''
\echo '---'
\echo ''

-- ================================================================
-- RESUMO FINAL
-- ================================================================

\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║                      RESUMO DOS TESTES                        ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

DO $$
DECLARE
  v_functions_ok INTEGER;
  v_doctors_count INTEGER;
  v_locations_count INTEGER;
  v_schedules_count INTEGER;
  v_status TEXT;
BEGIN
  -- Contar funções
  SELECT COUNT(*) INTO v_functions_ok
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('get_doctor_schedule_v2', 'get_available_time_slots', 'reserve_appointment_v2');
  
  -- Contar dados
  SELECT COUNT(*) INTO v_doctors_count FROM medicos;
  SELECT COUNT(*) INTO v_locations_count FROM locais_atendimento WHERE ativo = true;
  SELECT COUNT(*) INTO v_schedules_count FROM horarios_funcionamento WHERE ativo = true;
  
  RAISE NOTICE '📊 ESTATÍSTICAS:';
  RAISE NOTICE '   Funções RPC criadas: %/3', v_functions_ok;
  RAISE NOTICE '   Médicos cadastrados: %', v_doctors_count;
  RAISE NOTICE '   Locais ativos: %', v_locations_count;
  RAISE NOTICE '   Horários configurados: %', v_schedules_count;
  RAISE NOTICE '';
  
  -- Determinar status geral
  IF v_functions_ok = 3 AND v_doctors_count > 0 AND v_locations_count > 0 THEN
    IF v_schedules_count > 0 THEN
      v_status := '✅ SISTEMA PRONTO PARA USO';
    ELSE
      v_status := '⚠️ CONFIGURE HORÁRIOS DOS MÉDICOS';
    END IF;
  ELSIF v_functions_ok = 3 THEN
    v_status := '⚠️ CADASTRE MÉDICOS E LOCAIS';
  ELSE
    v_status := '❌ EXECUTE O SCRIPT DE CORREÇÃO';
  END IF;
  
  RAISE NOTICE '🎯 STATUS GERAL: %', v_status;
  RAISE NOTICE '';
  
  IF v_status LIKE '%PRONTO%' THEN
    RAISE NOTICE '✅ Tudo certo! Você pode testar o agendamento em /agendamento';
  ELSIF v_status LIKE '%CONFIGURE%' THEN
    RAISE NOTICE '⚠️ Próximo passo: Configure os horários de funcionamento dos médicos';
    RAISE NOTICE '   Use a interface de gerenciamento ou execute:';
    RAISE NOTICE '   INSERT INTO horarios_funcionamento (medico_id, local_id, dia_semana, hora_inicio, hora_fim, ativo)';
    RAISE NOTICE '   VALUES ([medico_id], [local_id], 1, ''08:00'', ''18:00'', true);';
  ELSIF v_status LIKE '%CADASTRE%' THEN
    RAISE NOTICE '⚠️ Próximo passo: Cadastre médicos e locais de atendimento';
  ELSE
    RAISE NOTICE '❌ Execute o script FIX_AGENDAMENTO_HORARIOS.sql primeiro';
  END IF;
END $$;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
