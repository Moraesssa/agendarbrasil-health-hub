-- ================================================================
-- DIAGNÓSTICO COMPLETO DA ESTRUTURA DO BANCO DE DADOS
-- Verifica quais tabelas, views e estruturas realmente existem
-- ================================================================

SELECT '🔍 INICIANDO DIAGNÓSTICO COMPLETO DA ESTRUTURA DO BANCO' as status;

-- ================================================================
-- 1. LISTAR TODAS AS TABELAS NO SCHEMA PUBLIC
-- ================================================================

SELECT '📊 1. TABELAS EXISTENTES NO SCHEMA PUBLIC' as secao;

SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    '📋 TABELA' as type
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ================================================================
-- 2. LISTAR TODAS AS VIEWS NO SCHEMA PUBLIC
-- ================================================================

SELECT '👁️ 2. VIEWS EXISTENTES NO SCHEMA PUBLIC' as secao;

SELECT 
    schemaname as schema,
    viewname as view_name,
    viewowner as owner,
    '👁️ VIEW' as type
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- ================================================================
-- 3. VERIFICAR SE PROFILES É TABELA OU VIEW
-- ================================================================

SELECT '🔍 3. VERIFICANDO TIPO DE "profiles"' as secao;

-- Verificar se profiles é uma tabela
SELECT 
    'profiles' as object_name,
    'TABELA' as object_type,
    tablename as name
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles'

UNION ALL

-- Verificar se profiles é uma view
SELECT 
    'profiles' as object_name,
    'VIEW' as object_type,
    viewname as name
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'profiles';

-- ================================================================
-- 4. ESTRUTURA DA TABELA/VIEW PROFILES (SE EXISTIR)
-- ================================================================

SELECT '📋 4. ESTRUTURA DE "profiles"' as secao;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- 5. VERIFICAR TABELAS RELACIONADAS A USUÁRIOS
-- ================================================================

SELECT '👥 5. TABELAS RELACIONADAS A USUÁRIOS' as secao;

SELECT 
    tablename as table_name,
    '📋 TABELA DE USUÁRIOS' as description
FROM pg_tables 
WHERE schemaname = 'public' 
    AND (
        tablename ILIKE '%user%' OR 
        tablename ILIKE '%profile%' OR
        tablename ILIKE '%medico%' OR
        tablename ILIKE '%paciente%' OR
        tablename ILIKE '%auth%'
    )
ORDER BY tablename;

-- ================================================================
-- 6. VERIFICAR SCHEMA AUTH (SUPABASE)
-- ================================================================

SELECT '🔐 6. TABELAS NO SCHEMA AUTH (SUPABASE)' as secao;

SELECT 
    schemaname as schema,
    tablename as table_name,
    '🔐 AUTH TABLE' as type
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- ================================================================
-- 7. VERIFICAR ESTRUTURA DE MEDICOS
-- ================================================================

SELECT '👨‍⚕️ 7. ESTRUTURA DA TABELA MEDICOS' as secao;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medicos' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- 8. VERIFICAR ESTRUTURA DE PACIENTES
-- ================================================================

SELECT '👥 8. ESTRUTURA DA TABELA PACIENTES' as secao;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pacientes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- 9. VERIFICAR ESTRUTURA DE CONSULTAS
-- ================================================================

SELECT '📅 9. ESTRUTURA DA TABELA CONSULTAS' as secao;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultas' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- 10. VERIFICAR ESTRUTURA DE LOCAIS_ATENDIMENTO
-- ================================================================

SELECT '🏥 10. ESTRUTURA DA TABELA LOCAIS_ATENDIMENTO' as secao;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'locais_atendimento' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- 11. VERIFICAR FUNÇÕES RPC EXISTENTES
-- ================================================================

SELECT '🔧 11. FUNÇÕES RPC EXISTENTES' as secao;

SELECT 
    routine_name as function_name,
    routine_type as function_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name ILIKE '%specialty%' OR
        routine_name ILIKE '%state%' OR
        routine_name ILIKE '%city%' OR
        routine_name ILIKE '%doctor%' OR
        routine_name ILIKE '%appointment%'
    )
ORDER BY routine_name;

-- ================================================================
-- 12. CONTAR REGISTROS NAS TABELAS PRINCIPAIS
-- ================================================================

SELECT '📊 12. CONTAGEM DE REGISTROS' as secao;

-- Contar auth.users
SELECT 'auth.users' as tabela, COUNT(*) as total_registros
FROM auth.users

UNION ALL

-- Contar profiles (se for tabela)
SELECT 'profiles' as tabela, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')
           THEN (SELECT COUNT(*) FROM profiles)::TEXT::INTEGER
           ELSE 0
       END as total_registros

UNION ALL

-- Contar medicos
SELECT 'medicos' as tabela,
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medicos')
           THEN (SELECT COUNT(*) FROM medicos)::TEXT::INTEGER
           ELSE 0
       END as total_registros

UNION ALL

-- Contar pacientes  
SELECT 'pacientes' as tabela,
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pacientes')
           THEN (SELECT COUNT(*) FROM pacientes)::TEXT::INTEGER
           ELSE 0
       END as total_registros

UNION ALL

-- Contar consultas
SELECT 'consultas' as tabela,
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consultas')
           THEN (SELECT COUNT(*) FROM consultas)::TEXT::INTEGER
           ELSE 0
       END as total_registros

UNION ALL

-- Contar locais_atendimento
SELECT 'locais_atendimento' as tabela,
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locais_atendimento')
           THEN (SELECT COUNT(*) FROM locais_atendimento)::TEXT::INTEGER
           ELSE 0
       END as total_registros;

-- ================================================================
-- 13. VERIFICAR DEFINIÇÃO DA VIEW PROFILES (SE FOR VIEW)
-- ================================================================

SELECT '📋 13. DEFINIÇÃO DA VIEW PROFILES (SE EXISTIR)' as secao;

SELECT 
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname = 'profiles';

-- ================================================================
-- 14. VERIFICAR TRIGGERS RELACIONADOS A PROFILES
-- ================================================================

SELECT '⚡ 14. TRIGGERS RELACIONADOS A PROFILES' as secao;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
    OR trigger_name ILIKE '%profile%'
    OR trigger_name ILIKE '%user%';

-- ================================================================
-- RESUMO FINAL
-- ================================================================

SELECT '📋 RESUMO DO DIAGNÓSTICO COMPLETO' as status;

SELECT 'Execute este script para identificar a estrutura real do banco' as instrucao_1;
SELECT 'Com base nos resultados, criaremos a correção adequada' as instrucao_2;
SELECT 'Verifique especialmente se "profiles" é TABELA ou VIEW' as instrucao_3;