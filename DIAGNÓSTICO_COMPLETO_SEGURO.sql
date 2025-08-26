-- ========================================
-- DIAGNÓSTICO COMPLETO E SEGURO DO BANCO DE DADOS
-- Analisa toda a estrutura existente antes de aplicar correções
-- ========================================

-- PASSO 1: LISTAR TODAS AS TABELAS EXISTENTES
SELECT 'STEP 1: TABELAS EXISTENTES' as diagnostic_step;

SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    'TABELA' as object_type
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- PASSO 2: LISTAR TODAS AS VIEWS EXISTENTES
SELECT 'STEP 2: VIEWS EXISTENTES' as diagnostic_step;

SELECT 
    schemaname as schema,
    viewname as view_name,
    viewowner as owner,
    'VIEW' as object_type
FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;

-- PASSO 3: VERIFICAR ESPECIFICAMENTE OS OBJETOS DO SISTEMA DE AGENDAMENTO
SELECT 'STEP 3: STATUS DOS OBJETOS PRINCIPAIS' as diagnostic_step;

WITH system_objects AS (
    SELECT 'profiles' as object_name
    UNION ALL SELECT 'medicos'
    UNION ALL SELECT 'pacientes'
    UNION ALL SELECT 'consultas'
    UNION ALL SELECT 'locais_atendimento'
),
object_status AS (
    SELECT 
        so.object_name,
        CASE WHEN pt.tablename IS NOT NULL THEN 'TABELA' ELSE NULL END as is_table,
        CASE WHEN pv.viewname IS NOT NULL THEN 'VIEW' ELSE NULL END as is_view
    FROM system_objects so
    LEFT JOIN pg_tables pt ON pt.tablename = so.object_name AND pt.schemaname = 'public'
    LEFT JOIN pg_views pv ON pv.viewname = so.object_name AND pv.schemaname = 'public'
)
SELECT 
    object_name,
    COALESCE(is_table, is_view, 'NÃO EXISTE') as object_type,
    CASE 
        WHEN is_table IS NOT NULL OR is_view IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ AUSENTE'
    END as status
FROM object_status
ORDER BY object_name;

-- PASSO 4: ESTRUTURA DETALHADA DE CADA TABELA EXISTENTE
SELECT 'STEP 4: ESTRUTURA DAS TABELAS' as diagnostic_step;

-- Verificar profiles
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'ESTRUTURA DA TABELA: profiles';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - % | % | nullable: % | default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSIF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles') THEN
        RAISE NOTICE 'profiles existe como VIEW (não tabela)';
    ELSE
        RAISE NOTICE 'profiles NÃO EXISTE';
    END IF;
END $$;

-- Verificar medicos
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medicos') THEN
        RAISE NOTICE 'ESTRUTURA DA TABELA: medicos';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'medicos' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - % | % | nullable: % | default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'medicos NÃO EXISTE';
    END IF;
END $$;

-- Verificar pacientes
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pacientes') THEN
        RAISE NOTICE 'ESTRUTURA DA TABELA: pacientes';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'pacientes' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - % | % | nullable: % | default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'pacientes NÃO EXISTE';
    END IF;
END $$;

-- Verificar consultas
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consultas') THEN
        RAISE NOTICE 'ESTRUTURA DA TABELA: consultas';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'consultas' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - % | % | nullable: % | default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'consultas NÃO EXISTE';
    END IF;
END $$;

-- Verificar locais_atendimento
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'locais_atendimento') THEN
        RAISE NOTICE 'ESTRUTURA DA TABELA: locais_atendimento';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'locais_atendimento' AND table_schema = 'public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - % | % | nullable: % | default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'locais_atendimento NÃO EXISTE';
    END IF;
END $$;

-- PASSO 5: VERIFICAR CHAVES ESTRANGEIRAS EXISTENTES
SELECT 'STEP 5: CHAVES ESTRANGEIRAS' as diagnostic_step;

SELECT 
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino,
    tc.constraint_name as nome_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- PASSO 6: VERIFICAR ÍNDICES EXISTENTES
SELECT 'STEP 6: ÍNDICES EXISTENTES' as diagnostic_step;

SELECT 
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name
FROM pg_class t, pg_class i, pg_index ix, pg_attribute a
WHERE t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento')
ORDER BY t.relname, i.relname;

-- PASSO 7: VERIFICAR FUNÇÕES RPC EXISTENTES
SELECT 'STEP 7: FUNÇÕES RPC EXISTENTES' as diagnostic_step;

SELECT 
    routine_name as function_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN ('get_specialties', 'get_available_states', 'get_available_cities', 'get_doctors_by_location_and_specialty', 'reserve_appointment_slot')
ORDER BY routine_name;

-- PASSO 8: VERIFICAR DADOS EXISTENTES (CONTAGEM)
SELECT 'STEP 8: CONTAGEM DE DADOS' as diagnostic_step;

DO $$
DECLARE
    count_val INTEGER;
BEGIN
    -- Contar profiles
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.profiles' INTO count_val;
        RAISE NOTICE 'Registros em profiles: %', count_val;
    ELSIF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public') THEN
        RAISE NOTICE 'profiles é uma VIEW - não é possível contar registros diretamente';
    ELSE
        RAISE NOTICE 'profiles não existe';
    END IF;
    
    -- Contar medicos
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'medicos' AND schemaname = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.medicos' INTO count_val;
        RAISE NOTICE 'Registros em medicos: %', count_val;
    ELSE
        RAISE NOTICE 'medicos não existe';
    END IF;
    
    -- Contar pacientes
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pacientes' AND schemaname = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.pacientes' INTO count_val;
        RAISE NOTICE 'Registros em pacientes: %', count_val;
    ELSE
        RAISE NOTICE 'pacientes não existe';
    END IF;
    
    -- Contar consultas
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas' AND schemaname = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.consultas' INTO count_val;
        RAISE NOTICE 'Registros em consultas: %', count_val;
    ELSE
        RAISE NOTICE 'consultas não existe';
    END IF;
    
    -- Contar locais_atendimento
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'locais_atendimento' AND schemaname = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.locais_atendimento' INTO count_val;
        RAISE NOTICE 'Registros em locais_atendimento: %', count_val;
    ELSE
        RAISE NOTICE 'locais_atendimento não existe';
    END IF;
END $$;

-- PASSO 9: VERIFICAR TABELA AUTH.USERS (SUPABASE)
SELECT 'STEP 9: VERIFICAÇÃO AUTH.USERS' as diagnostic_step;

DO $$
DECLARE
    count_val INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'auth') THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM auth.users' INTO count_val;
            RAISE NOTICE 'Usuários autenticados em auth.users: %', count_val;
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE 'Sem permissão para acessar auth.users';
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao acessar auth.users: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'auth.users não existe ou não é acessível';
    END IF;
END $$;

-- PASSO 10: RESUMO FINAL E RECOMENDAÇÕES
SELECT 'STEP 10: RESUMO E RECOMENDAÇÕES' as diagnostic_step;

DO $$
DECLARE
    profiles_exists BOOLEAN;
    profiles_is_view BOOLEAN;
    medicos_exists BOOLEAN;
    pacientes_exists BOOLEAN;
    consultas_exists BOOLEAN;
    locais_exists BOOLEAN;
    recommendation TEXT;
BEGIN
    -- Verificar status dos objetos
    profiles_exists := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public');
    profiles_is_view := EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public');
    medicos_exists := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'medicos' AND schemaname = 'public');
    pacientes_exists := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pacientes' AND schemaname = 'public');
    consultas_exists := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas' AND schemaname = 'public');
    locais_exists := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'locais_atendimento' AND schemaname = 'public');
    
    RAISE NOTICE '=== RESUMO DO DIAGNÓSTICO ===';
    RAISE NOTICE 'profiles: % (view: %)', 
        CASE WHEN profiles_exists THEN 'TABELA' WHEN profiles_is_view THEN 'VIEW' ELSE 'AUSENTE' END,
        profiles_is_view;
    RAISE NOTICE 'medicos: %', CASE WHEN medicos_exists THEN 'EXISTE' ELSE 'AUSENTE' END;
    RAISE NOTICE 'pacientes: %', CASE WHEN pacientes_exists THEN 'EXISTE' ELSE 'AUSENTE' END;
    RAISE NOTICE 'consultas: %', CASE WHEN consultas_exists THEN 'EXISTE' ELSE 'AUSENTE' END;
    RAISE NOTICE 'locais_atendimento: %', CASE WHEN locais_exists THEN 'EXISTE' ELSE 'AUSENTE' END;
    
    -- Determinar recomendação
    IF NOT profiles_exists AND NOT profiles_is_view THEN
        recommendation := 'CRIAR TUDO DO ZERO - Use FIX_AGENDAMENTO_CREATE_FROM_SCRATCH.sql';
    ELSIF profiles_is_view THEN
        recommendation := 'PROFILES É VIEW - Use FIX_AGENDAMENTO_WITH_USER_PROFILES.sql';
    ELSIF NOT consultas_exists THEN
        recommendation := 'CRIAR TABELAS FALTANTES - Use FIX_AGENDAMENTO_PARTIAL.sql';
    ELSE
        recommendation := 'CORRIGIR ESTRUTURA EXISTENTE - Use FIX_AGENDAMENTO_REPAIR.sql';
    END IF;
    
    RAISE NOTICE '=== RECOMENDAÇÃO ===';
    RAISE NOTICE '%', recommendation;
    
END $$;

-- FINAL
SELECT 'DIAGNÓSTICO COMPLETO FINALIZADO!' as final_message;
SELECT 'Analise os resultados acima para determinar o próximo passo.' as next_steps;