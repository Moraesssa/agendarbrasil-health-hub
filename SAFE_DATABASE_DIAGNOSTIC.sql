-- ========================================
-- DIAGNÓSTICO SEGURO DA ESTRUTURA DO BANCO DE DADOS
-- Verifica o que realmente existe antes de tentar acessar qualquer tabela
-- ========================================

-- 1. VERIFICAR TODAS AS TABELAS EXISTENTES
SELECT 'STEP 1: VERIFICANDO TODAS AS TABELAS EXISTENTES' as diagnostic_step;

SELECT 
    schemaname as schema_name,
    tablename as table_name,
    tableowner as owner,
    CASE 
        WHEN tablename IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento') 
        THEN '🎯 TABELA ESPERADA PELO SISTEMA' 
        ELSE '📋 OUTRA TABELA' 
    END as table_category
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. VERIFICAR TODAS AS VIEWS EXISTENTES
SELECT 'STEP 2: VERIFICANDO TODAS AS VIEWS EXISTENTES' as diagnostic_step;

SELECT 
    schemaname as schema_name,
    viewname as view_name,
    viewowner as owner,
    CASE 
        WHEN viewname IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento') 
        THEN '🎯 VIEW ESPERADA PELO SISTEMA' 
        ELSE '📋 OUTRA VIEW' 
    END as view_category
FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;

-- 3. VERIFICAR SE PROFILES É TABELA OU VIEW
SELECT 'STEP 3: VERIFICANDO TIPO DO OBJETO PROFILES' as diagnostic_step;

SELECT 
    'profiles' as object_name,
    'TABELA' as object_type,
    tableowner as owner
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles'

UNION ALL

SELECT 
    'profiles' as object_name,
    'VIEW' as object_type,
    viewowner as owner
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'profiles'

UNION ALL

SELECT 
    'profiles' as object_name,
    'NÃO EXISTE' as object_type,
    NULL as owner
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'
    UNION
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles'
);

-- 4. VERIFICAR SE MEDICOS É TABELA OU VIEW
SELECT 'STEP 4: VERIFICANDO TIPO DO OBJETO MEDICOS' as diagnostic_step;

SELECT 
    'medicos' as object_name,
    'TABELA' as object_type,
    tableowner as owner
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'medicos'

UNION ALL

SELECT 
    'medicos' as object_name,
    'VIEW' as object_type,
    viewowner as owner
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'medicos'

UNION ALL

SELECT 
    'medicos' as object_name,
    'NÃO EXISTE' as object_type,
    NULL as owner
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medicos'
    UNION
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'medicos'
);

-- 5. VERIFICAR SE PACIENTES É TABELA OU VIEW
SELECT 'STEP 5: VERIFICANDO TIPO DO OBJETO PACIENTES' as diagnostic_step;

SELECT 
    'pacientes' as object_name,
    'TABELA' as object_type,
    tableowner as owner
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'pacientes'

UNION ALL

SELECT 
    'pacientes' as object_name,
    'VIEW' as object_type,
    viewowner as owner
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'pacientes'

UNION ALL

SELECT 
    'pacientes' as object_name,
    'NÃO EXISTE' as object_type,
    NULL as owner
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pacientes'
    UNION
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'pacientes'
);

-- 6. VERIFICAR SE CONSULTAS É TABELA OU VIEW
SELECT 'STEP 6: VERIFICANDO TIPO DO OBJETO CONSULTAS' as diagnostic_step;

SELECT 
    'consultas' as object_name,
    'TABELA' as object_type,
    tableowner as owner
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'consultas'

UNION ALL

SELECT 
    'consultas' as object_name,
    'VIEW' as object_type,
    viewowner as owner
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'consultas'

UNION ALL

SELECT 
    'consultas' as object_name,
    'NÃO EXISTE' as object_type,
    NULL as owner
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consultas'
    UNION
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'consultas'
);

-- 7. VERIFICAR SE LOCAIS_ATENDIMENTO É TABELA OU VIEW
SELECT 'STEP 7: VERIFICANDO TIPO DO OBJETO LOCAIS_ATENDIMENTO' as diagnostic_step;

SELECT 
    'locais_atendimento' as object_name,
    'TABELA' as object_type,
    tableowner as owner
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'locais_atendimento'

UNION ALL

SELECT 
    'locais_atendimento' as object_name,
    'VIEW' as object_type,
    viewowner as owner
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'locais_atendimento'

UNION ALL

SELECT 
    'locais_atendimento' as object_name,
    'NÃO EXISTE' as object_type,
    NULL as owner
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locais_atendimento'
    UNION
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'locais_atendimento'
);

-- 8. VERIFICAR TABELA AUTH.USERS (SUPABASE AUTHENTICATION)
SELECT 'STEP 8: VERIFICANDO TABELA AUTH.USERS' as diagnostic_step;

SELECT 
    'auth.users' as object_name,
    'TABELA' as object_type,
    tableowner as owner
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users'

UNION ALL

SELECT 
    'auth.users' as object_name,
    'NÃO EXISTE' as object_type,
    NULL as owner
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users'
);

-- 9. VERIFICAR TRIGGERS E FUNÇÕES EXISTENTES
SELECT 'STEP 9: VERIFICANDO TRIGGERS EXISTENTES' as diagnostic_step;

SELECT 
    trigger_name,
    event_object_table as table_name,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 10. VERIFICAR FUNÇÕES RPC EXISTENTES
SELECT 'STEP 10: VERIFICANDO FUNÇÕES RPC' as diagnostic_step;

SELECT 
    routine_name as function_name,
    routine_type,
    CASE 
        WHEN routine_name IN ('get_specialties', 'get_available_states', 'get_available_cities', 'get_doctors_by_location_and_specialty', 'reserve_appointment_slot') 
        THEN '🎯 FUNÇÃO ESPERADA PELO SISTEMA' 
        ELSE '📋 OUTRA FUNÇÃO' 
    END as function_category
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 11. RESUMO DO QUE EXISTE E DO QUE FALTA
SELECT 'STEP 11: RESUMO FINAL' as diagnostic_step;

WITH object_check AS (
    SELECT 'profiles' as object_name,
           EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') as is_table,
           EXISTS(SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') as is_view
    UNION ALL
    SELECT 'medicos' as object_name,
           EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medicos') as is_table,
           EXISTS(SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'medicos') as is_view
    UNION ALL
    SELECT 'pacientes' as object_name,
           EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pacientes') as is_table,
           EXISTS(SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'pacientes') as is_view
    UNION ALL
    SELECT 'consultas' as object_name,
           EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consultas') as is_table,
           EXISTS(SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'consultas') as is_view
    UNION ALL
    SELECT 'locais_atendimento' as object_name,
           EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locais_atendimento') as is_table,
           EXISTS(SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'locais_atendimento') as is_view
)
SELECT 
    object_name,
    CASE 
        WHEN is_table THEN '✅ É TABELA'
        WHEN is_view THEN '🔍 É VIEW'
        ELSE '❌ NÃO EXISTE'
    END as status,
    CASE 
        WHEN is_table OR is_view THEN '🟢 OK'
        ELSE '🔴 PRECISA CRIAR'
    END as action_needed
FROM object_check
ORDER BY object_name;

-- 12. VERIFICAR SE EXISTEM DADOS NA AUTH.USERS
SELECT 'STEP 12: VERIFICANDO USUÁRIOS AUTENTICADOS' as diagnostic_step;

DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Tentar contar usuários na tabela auth.users
    BEGIN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        RAISE NOTICE 'Usuários encontrados na auth.users: %', user_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Tabela auth.users não existe';
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Sem permissão para acessar auth.users';
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao acessar auth.users: %', SQLERRM;
    END;
END $$;

-- 13. CONCLUSÃO E PRÓXIMOS PASSOS
SELECT 'STEP 13: CONCLUSÃO E PRÓXIMOS PASSOS' as diagnostic_step;

SELECT 
    'DIAGNÓSTICO COMPLETO' as titulo,
    'Execute este script primeiro para entender a estrutura atual do banco.' as instrucao_1,
    'Com base nos resultados, escolha o script de correção apropriado:' as instrucao_2,
    '- Se não existir nenhuma tabela: FIX_AGENDAMENTO_CREATE_TABLES.sql' as opcao_1,
    '- Se existirem apenas views: FIX_AGENDAMENTO_FOR_VIEWS.sql' as opcao_2,
    '- Se existirem tabelas com problemas: FIX_AGENDAMENTO_COMPLETE.sql' as opcao_3;