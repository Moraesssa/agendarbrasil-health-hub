-- ================================================================
-- DIAGNÓSTICO COMPLETO DO BANCO DE DADOS
-- ================================================================
-- Execute este script no Supabase SQL Editor para ver a estrutura
-- completa e identificar problemas
-- ================================================================

\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║           DIAGNÓSTICO COMPLETO DO BANCO DE DADOS              ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

-- ================================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
1. TABELAS EXISTENTES
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  CASE 
    WHEN tablename IN ('medicos', 'pacientes', 'locais_atendimento', 'horarios_disponibilidade', 'consultas', 'profiles')
    THEN '✅ ESSENCIAL'
    ELSE '📋 OUTRA'
  END as "Status"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN tablename IN ('medicos', 'pacientes', 'locais_atendimento', 'horarios_disponibilidade', 'consultas', 'profiles')
    THEN 1 ELSE 2 
  END,
  tablename;

-- ================================================================
-- 2. ESTRUTURA DA TABELA MEDICOS
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
2. ESTRUTURA DA TABELA MEDICOS
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  character_maximum_length as "Tamanho",
  is_nullable as "Nullable",
  column_default as "Padrão"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'medicos'
ORDER BY ordinal_position;

-- ================================================================
-- 3. ESTRUTURA DA TABELA LOCAIS_ATENDIMENTO
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
3. ESTRUTURA DA TABELA LOCAIS_ATENDIMENTO
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  character_maximum_length as "Tamanho",
  is_nullable as "Nullable",
  column_default as "Padrão"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'locais_atendimento'
ORDER BY ordinal_position;

-- ================================================================
-- 4. VERIFICAR TIPOS DAS COLUNAS CHAVE
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
4. TIPOS DAS COLUNAS CHAVE (IMPORTANTE!)
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  'medicos.id' as "Coluna",
  data_type as "Tipo",
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID'
    WHEN data_type LIKE '%int%' THEN '⚠️ INTEGER/BIGINT'
    ELSE '❓ OUTRO'
  END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'id'

UNION ALL

SELECT 
  'medicos.user_id' as "Coluna",
  data_type as "Tipo",
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID'
    WHEN data_type LIKE '%int%' THEN '⚠️ INTEGER/BIGINT'
    ELSE '❓ OUTRO'
  END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medicos' AND column_name = 'user_id'

UNION ALL

SELECT 
  'locais_atendimento.medico_id' as "Coluna",
  data_type as "Tipo",
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID'
    WHEN data_type LIKE '%int%' THEN '⚠️ INTEGER/BIGINT'
    ELSE '❓ OUTRO'
  END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'locais_atendimento' AND column_name = 'medico_id';

-- ================================================================
-- 5. CONTAR REGISTROS
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
5. CONTAGEM DE REGISTROS
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  'Médicos' as "Tabela",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE id IS NOT NULL) as "Com ID",
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as "Com User ID"
FROM medicos

UNION ALL

SELECT 
  'Pacientes' as "Tabela",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE id IS NOT NULL) as "Com ID",
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as "Com User ID"
FROM pacientes

UNION ALL

SELECT 
  'Locais Atendimento' as "Tabela",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE ativo = true) as "Ativos",
  COUNT(DISTINCT medico_id) as "Médicos Únicos"
FROM locais_atendimento

UNION ALL

SELECT 
  'Consultas' as "Tabela",
  COUNT(*) as "Total",
  COUNT(*) FILTER (WHERE status IN ('agendada', 'confirmada')) as "Ativas",
  COUNT(DISTINCT medico_id) as "Médicos com Consultas"
FROM consultas;

-- ================================================================
-- 6. BUSCAR MÉDICO davirh1221
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
6. BUSCANDO MÉDICO davirh1221
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  m.id::text as "ID Médico",
  m.user_id::text as "User ID",
  COALESCE(p.display_name, p.email, m.crm) as "Nome",
  p.email as "Email",
  m.crm as "CRM",
  m.especialidades as "Especialidades"
FROM medicos m
LEFT JOIN profiles p ON p.id = m.user_id
WHERE p.email ILIKE '%davirh1221%'
   OR p.display_name ILIKE '%davirh1221%'
   OR m.crm ILIKE '%davirh1221%'
LIMIT 5;

-- ================================================================
-- 7. LOCAIS DO MÉDICO davirh1221
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
7. LOCAIS DE ATENDIMENTO DO MÉDICO davirh1221
═══════════════════════════════════════════════════════════════
' as info;

WITH medico_info AS (
  SELECT m.id::text as medico_id, m.user_id::text as user_id
  FROM medicos m
  LEFT JOIN profiles p ON p.id = m.user_id
  WHERE p.email ILIKE '%davirh1221%'
     OR p.display_name ILIKE '%davirh1221%'
     OR m.crm ILIKE '%davirh1221%'
  LIMIT 1
)
SELECT 
  la.id::text as "ID Local",
  la.medico_id::text as "Medico ID (na tabela)",
  mi.medico_id as "Medico ID (esperado)",
  mi.user_id as "User ID (esperado)",
  CASE 
    WHEN la.medico_id::text = mi.medico_id THEN '✅ MATCH com medicos.id'
    WHEN la.medico_id::text = mi.user_id THEN '✅ MATCH com medicos.user_id'
    ELSE '❌ NÃO MATCH'
  END as "Status Match",
  COALESCE(la.nome, la.name, 'Sem nome') as "Nome Local",
  COALESCE(la.cidade, la.city, 'Sem cidade') as "Cidade",
  COALESCE(la.estado, la.state, 'Sem estado') as "Estado",
  la.ativo as "Ativo"
FROM locais_atendimento la
CROSS JOIN medico_info mi
WHERE la.medico_id::text IN (mi.medico_id, mi.user_id);

-- ================================================================
-- 8. LISTAR TODOS OS MÉDICOS (PRIMEIROS 10)
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
8. PRIMEIROS 10 MÉDICOS CADASTRADOS
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  m.id::text as "ID",
  m.user_id::text as "User ID",
  COALESCE(p.display_name, p.email, m.crm) as "Nome",
  m.especialidades as "Especialidades",
  (SELECT COUNT(*) FROM locais_atendimento la 
   WHERE la.medico_id::text IN (m.id::text, m.user_id::text) 
   AND la.ativo = true) as "Locais Ativos"
FROM medicos m
LEFT JOIN profiles p ON p.id = m.user_id
ORDER BY m.created_at DESC
LIMIT 10;

-- ================================================================
-- 9. VERIFICAR FUNÇÕES RPC
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
9. FUNÇÕES RPC EXISTENTES
═══════════════════════════════════════════════════════════════
' as info;

SELECT 
  routine_name as "Função",
  routine_type as "Tipo",
  CASE 
    WHEN routine_name IN (
      'get_doctor_schedule_v2',
      'get_available_time_slots',
      'reserve_appointment_v2',
      'get_doctors_by_location_and_specialty',
      'get_specialties',
      'get_available_states',
      'get_available_cities'
    ) THEN '✅ ESSENCIAL'
    ELSE '📋 OUTRA'
  END as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name LIKE '%doctor%' 
   OR routine_name LIKE '%appointment%'
   OR routine_name LIKE '%schedule%'
   OR routine_name LIKE '%specialt%'
ORDER BY 
  CASE 
    WHEN routine_name IN (
      'get_doctor_schedule_v2',
      'get_available_time_slots',
      'reserve_appointment_v2',
      'get_doctors_by_location_and_specialty'
    ) THEN 1 ELSE 2 
  END,
  routine_name;

-- ================================================================
-- 10. TESTAR BUSCA DE MÉDICOS
-- ================================================================

SELECT '
═══════════════════════════════════════════════════════════════
10. TESTE: BUSCAR TODOS OS MÉDICOS (SEM FILTROS)
═══════════════════════════════════════════════════════════════
' as info;

DO $$
DECLARE
  v_count INTEGER;
  v_function_exists BOOLEAN;
BEGIN
  -- Verificar se a função existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'get_doctors_by_location_and_specialty'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    SELECT COUNT(*) INTO v_count
    FROM get_doctors_by_location_and_specialty(NULL, NULL, NULL);
    
    RAISE NOTICE '✅ Função existe e retornou % médicos', v_count;
  ELSE
    RAISE NOTICE '❌ Função get_doctors_by_location_and_specialty NÃO EXISTE';
    RAISE NOTICE '   Execute FIX_BUSCA_MEDICOS_V2_FINAL.sql para criar';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao testar função: %', SQLERRM;
END $$;

-- ================================================================
-- RESUMO FINAL
-- ================================================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                    RESUMO DO DIAGNÓSTICO                      ║
╚════════════════════════════════════════════════════════════════╝

📋 VERIFIQUE OS RESULTADOS ACIMA:

1. ✅ Tabelas essenciais existem?
   - medicos, pacientes, locais_atendimento, consultas

2. ⚠️ TIPOS DAS COLUNAS (IMPORTANTE!):
   - medicos.id: UUID ou BIGINT?
   - medicos.user_id: UUID?
   - locais_atendimento.medico_id: UUID ou BIGINT?
   
   Se houver incompatibilidade (UUID vs BIGINT), os scripts
   já estão preparados para lidar com isso.

3. 👨‍⚕️ Médico davirh1221:
   - Foi encontrado?
   - Tem locais de atendimento ativos?
   - Os IDs fazem match?

4. 🔧 Funções RPC:
   - get_doctors_by_location_and_specialty existe?
   - get_doctor_schedule_v2 existe?
   
   Se NÃO existirem, execute os scripts de correção.

═══════════════════════════════════════════════════════════════

🚀 PRÓXIMOS PASSOS:

Se as funções NÃO existem:
1. Execute: FIX_AGENDAMENTO_HORARIOS_V3_FINAL.sql
2. Execute: FIX_BUSCA_MEDICOS_V2_FINAL.sql

Se o médico NÃO foi encontrado:
- Verifique o cadastro do médico
- Confirme que tem locais ativos

Se os IDs NÃO fazem match:
- Os scripts já tratam isso automaticamente
- Apenas execute os scripts de correção

═══════════════════════════════════════════════════════════════

' as resultado;
