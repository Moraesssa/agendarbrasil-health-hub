-- ================================================================
-- QUERIES DE DEBUG - SISTEMA DE AGENDAMENTO
-- ================================================================
-- Use estas queries para investigar problemas no sistema de agendamento
-- ================================================================

-- ================================================================
-- 1. VERIFICAR FUNÇÕES RPC EXISTENTES
-- ================================================================

-- Listar todas as funções relacionadas ao agendamento
SELECT 
  routine_name as "Função",
  routine_type as "Tipo",
  data_type as "Retorno",
  CASE 
    WHEN routine_name LIKE '%schedule%' OR routine_name LIKE '%appointment%' 
    THEN '🎯 AGENDAMENTO'
    ELSE '📋 OUTRA'
  END as "Categoria"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%schedule%' 
  OR routine_name LIKE '%appointment%'
  OR routine_name LIKE '%doctor%'
  OR routine_name LIKE '%slot%'
)
ORDER BY routine_name;

-- ================================================================
-- 2. VERIFICAR MÉDICOS E SUAS CONFIGURAÇÕES
-- ================================================================

-- Médicos com status completo de configuração
SELECT 
  m.id,
  p.display_name as "Nome",
  p.email as "Email",
  m.especialidades as "Especialidades",
  m.crm as "CRM",
  COUNT(DISTINCT la.id) as "Locais Ativos",
  COUNT(DISTINCT hf.id) as "Horários Config",
  COUNT(DISTINCT c.id) as "Consultas Agendadas",
  CASE 
    WHEN COUNT(DISTINCT la.id) = 0 THEN '❌ SEM LOCAIS'
    WHEN COUNT(DISTINCT hf.id) = 0 THEN '⚠️ SEM HORÁRIOS'
    ELSE '✅ COMPLETO'
  END as "Status"
FROM medicos m
JOIN profiles p ON m.user_id = p.id
LEFT JOIN locais_atendimento la ON la.medico_id = m.id AND la.ativo = true
LEFT JOIN horarios_funcionamento hf ON hf.medico_id = m.id AND hf.ativo = true
LEFT JOIN consultas c ON c.medico_id = m.id AND c.status IN ('agendada', 'confirmada')
GROUP BY m.id, p.display_name, p.email, m.especialidades, m.crm
ORDER BY "Status" DESC, p.display_name;

-- ================================================================
-- 3. VERIFICAR LOCAIS DE ATENDIMENTO
-- ================================================================

-- Locais de atendimento por médico
SELECT 
  p.display_name as "Médico",
  la.nome as "Local",
  la.cidade || '/' || la.estado as "Cidade/UF",
  la.endereco as "Endereço",
  la.ativo as "Ativo",
  COUNT(hf.id) as "Horários Config"
FROM locais_atendimento la
JOIN medicos m ON la.medico_id = m.id
JOIN profiles p ON m.user_id = p.id
LEFT JOIN horarios_funcionamento hf ON hf.local_id = la.id AND hf.ativo = true
GROUP BY p.display_name, la.nome, la.cidade, la.estado, la.endereco, la.ativo
ORDER BY p.display_name, la.nome;

-- ================================================================
-- 4. VERIFICAR HORÁRIOS DE FUNCIONAMENTO
-- ================================================================

-- Horários configurados por médico e dia da semana
SELECT 
  p.display_name as "Médico",
  la.nome as "Local",
  CASE hf.dia_semana
    WHEN 0 THEN '🔴 Domingo'
    WHEN 1 THEN '📅 Segunda'
    WHEN 2 THEN '📅 Terça'
    WHEN 3 THEN '📅 Quarta'
    WHEN 4 THEN '📅 Quinta'
    WHEN 5 THEN '📅 Sexta'
    WHEN 6 THEN '🔵 Sábado'
  END as "Dia",
  hf.hora_inicio as "Início",
  hf.hora_fim as "Fim",
  hf.ativo as "Ativo"
FROM horarios_funcionamento hf
JOIN medicos m ON hf.medico_id = m.id
JOIN profiles p ON m.user_id = p.id
LEFT JOIN locais_atendimento la ON hf.local_id = la.id
ORDER BY p.display_name, hf.dia_semana, hf.hora_inicio;

-- ================================================================
-- 5. VERIFICAR CONSULTAS AGENDADAS
-- ================================================================

-- Consultas futuras
SELECT 
  c.id,
  pm.display_name as "Médico",
  pp.display_name as "Paciente",
  c.data_consulta as "Data/Hora",
  c.tipo_consulta as "Tipo",
  c.status as "Status",
  la.nome as "Local",
  CASE 
    WHEN c.data_consulta < NOW() THEN '⏰ PASSADA'
    WHEN c.data_consulta < NOW() + INTERVAL '24 hours' THEN '🔴 PRÓXIMAS 24H'
    WHEN c.data_consulta < NOW() + INTERVAL '7 days' THEN '🟡 PRÓXIMOS 7 DIAS'
    ELSE '🟢 FUTURO'
  END as "Urgência"
FROM consultas c
JOIN medicos m ON c.medico_id = m.id
JOIN profiles pm ON m.user_id = pm.id
JOIN pacientes pac ON c.paciente_id = pac.id
JOIN profiles pp ON pac.user_id = pp.id
LEFT JOIN locais_atendimento la ON c.local_id = la.id
WHERE c.data_consulta >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY c.data_consulta;

-- ================================================================
-- 6. TESTAR FUNÇÃO get_doctor_schedule_v2
-- ================================================================

-- Teste com primeiro médico disponível
DO $$
DECLARE
  v_doctor_id UUID;
  v_doctor_name TEXT;
  v_result JSONB;
BEGIN
  -- Pegar primeiro médico
  SELECT m.id, p.display_name INTO v_doctor_id, v_doctor_name
  FROM medicos m
  JOIN profiles p ON m.user_id = p.id
  LIMIT 1;
  
  IF v_doctor_id IS NULL THEN
    RAISE NOTICE '❌ Nenhum médico encontrado';
    RETURN;
  END IF;
  
  RAISE NOTICE '🧪 Testando get_doctor_schedule_v2';
  RAISE NOTICE '   Médico: % (ID: %)', v_doctor_name, v_doctor_id;
  RAISE NOTICE '   Data: %', CURRENT_DATE + 1;
  
  -- Testar função
  BEGIN
    SELECT get_doctor_schedule_v2(v_doctor_id, CURRENT_DATE + 1) INTO v_result;
    RAISE NOTICE '✅ Função executada com sucesso';
    RAISE NOTICE '   Resultado: %', v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Erro: %', SQLERRM;
  END;
END $$;

-- ================================================================
-- 7. VERIFICAR CONFLITOS DE HORÁRIO
-- ================================================================

-- Encontrar horários com múltiplas consultas (conflitos)
SELECT 
  c.medico_id,
  pm.display_name as "Médico",
  c.data_consulta as "Data/Hora",
  COUNT(*) as "Consultas no mesmo horário",
  string_agg(pp.display_name, ', ') as "Pacientes"
FROM consultas c
JOIN medicos m ON c.medico_id = m.id
JOIN profiles pm ON m.user_id = pm.id
JOIN pacientes pac ON c.paciente_id = pac.id
JOIN profiles pp ON pac.user_id = pp.id
WHERE c.status IN ('agendada', 'confirmada', 'scheduled', 'confirmed')
AND c.data_consulta >= CURRENT_DATE
GROUP BY c.medico_id, pm.display_name, c.data_consulta
HAVING COUNT(*) > 1
ORDER BY c.data_consulta;

-- ================================================================
-- 8. VERIFICAR DISPONIBILIDADE PARA DATA ESPECÍFICA
-- ================================================================

-- Substitua os valores abaixo
\set doctor_id '00000000-0000-0000-0000-000000000000'
\set test_date '2025-01-10'

-- Verificar horários disponíveis
SELECT 
  'Horários configurados' as "Tipo",
  COUNT(*) as "Total"
FROM horarios_funcionamento hf
WHERE hf.medico_id = :'doctor_id'::uuid
AND hf.dia_semana = EXTRACT(DOW FROM :'test_date'::date)
AND hf.ativo = true

UNION ALL

SELECT 
  'Consultas agendadas' as "Tipo",
  COUNT(*) as "Total"
FROM consultas c
WHERE c.medico_id = :'doctor_id'::uuid
AND c.data_consulta::date = :'test_date'::date
AND c.status IN ('agendada', 'confirmada', 'scheduled', 'confirmed');

-- ================================================================
-- 9. VERIFICAR PERMISSÕES RLS
-- ================================================================

-- Políticas RLS das tabelas principais
SELECT 
  tablename as "Tabela",
  policyname as "Política",
  cmd as "Comando",
  qual as "Condição",
  with_check as "Verificação"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('consultas', 'medicos', 'pacientes', 'locais_atendimento', 'horarios_funcionamento')
ORDER BY tablename, cmd;

-- ================================================================
-- 10. ESTATÍSTICAS GERAIS
-- ================================================================

-- Resumo geral do sistema
SELECT 
  'Médicos cadastrados' as "Métrica",
  COUNT(*)::text as "Valor"
FROM medicos

UNION ALL

SELECT 
  'Pacientes cadastrados',
  COUNT(*)::text
FROM pacientes

UNION ALL

SELECT 
  'Locais ativos',
  COUNT(*)::text
FROM locais_atendimento
WHERE ativo = true

UNION ALL

SELECT 
  'Horários configurados',
  COUNT(*)::text
FROM horarios_funcionamento
WHERE ativo = true

UNION ALL

SELECT 
  'Consultas futuras',
  COUNT(*)::text
FROM consultas
WHERE data_consulta >= CURRENT_DATE
AND status IN ('agendada', 'confirmada', 'scheduled', 'confirmed')

UNION ALL

SELECT 
  'Consultas hoje',
  COUNT(*)::text
FROM consultas
WHERE data_consulta::date = CURRENT_DATE
AND status IN ('agendada', 'confirmada', 'scheduled', 'confirmed')

UNION ALL

SELECT 
  'Consultas esta semana',
  COUNT(*)::text
FROM consultas
WHERE data_consulta >= CURRENT_DATE
AND data_consulta < CURRENT_DATE + INTERVAL '7 days'
AND status IN ('agendada', 'confirmada', 'scheduled', 'confirmed');

-- ================================================================
-- 11. LIMPAR DADOS DE TESTE (USE COM CUIDADO!)
-- ================================================================

-- ATENÇÃO: Descomente apenas se quiser limpar dados de teste
-- Isso irá remover TODAS as consultas em status de teste

/*
DELETE FROM consultas 
WHERE status = 'pending_payment' 
AND expires_at < NOW();

SELECT 'Consultas expiradas removidas' as "Ação", 
       COUNT(*) as "Total"
FROM consultas 
WHERE status = 'pending_payment' 
AND expires_at < NOW();
*/

-- ================================================================
-- 12. CRIAR DADOS DE TESTE
-- ================================================================

-- Exemplo de como criar horários de teste para um médico
-- Substitua [ID_DO_MEDICO] e [ID_DO_LOCAL] pelos valores reais

/*
INSERT INTO horarios_funcionamento (
  medico_id,
  local_id,
  dia_semana,
  hora_inicio,
  hora_fim,
  ativo
) VALUES
  -- Segunda a Sexta, 8h às 12h (manhã)
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 1, '08:00', '12:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 2, '08:00', '12:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 3, '08:00', '12:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 4, '08:00', '12:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 5, '08:00', '12:00', true),
  -- Segunda a Sexta, 14h às 18h (tarde)
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 1, '14:00', '18:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 2, '14:00', '18:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 3, '14:00', '18:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 4, '14:00', '18:00', true),
  ('[ID_DO_MEDICO]'::uuid, '[ID_DO_LOCAL]'::uuid, 5, '14:00', '18:00', true);

SELECT 'Horários de teste criados' as "Status";
*/

-- ================================================================
-- FIM DAS QUERIES DE DEBUG
-- ================================================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║              QUERIES DE DEBUG CARREGADAS                      ║
╚════════════════════════════════════════════════════════════════╝

Use as queries acima para investigar problemas no sistema de agendamento.

Queries disponíveis:
1. ✅ Verificar funções RPC
2. 👨‍⚕️ Verificar médicos e configurações
3. 🏥 Verificar locais de atendimento
4. ⏰ Verificar horários de funcionamento
5. 📅 Verificar consultas agendadas
6. 🧪 Testar função get_doctor_schedule_v2
7. ⚠️ Verificar conflitos de horário
8. 🔍 Verificar disponibilidade para data específica
9. 🔒 Verificar permissões RLS
10. 📊 Estatísticas gerais
11. 🗑️ Limpar dados de teste (cuidado!)
12. 🧪 Criar dados de teste

' as info;
