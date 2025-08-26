-- ========================================
-- DIAGNÓSTICO SIMPLES E DIRETO DO BANCO
-- Retorna resultados como tabelas, não como mensagens
-- ========================================

-- 1. VERIFICAR TODAS AS TABELAS EXISTENTES
SELECT 'TABELAS_EXISTENTES' as tipo, tablename as nome, 'TABELA' as objeto_tipo
FROM pg_tables 
WHERE schemaname = 'public' 
UNION ALL
SELECT 'VIEWS_EXISTENTES' as tipo, viewname as nome, 'VIEW' as objeto_tipo
FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY tipo, nome;

-- 2. STATUS DOS OBJETOS PRINCIPAIS DO SISTEMA
SELECT 
    'profiles' as objeto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN 'TABELA'
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public') THEN 'VIEW'
        ELSE 'NÃO_EXISTE'
    END as status
UNION ALL
SELECT 
    'medicos' as objeto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'medicos' AND schemaname = 'public') THEN 'TABELA'
        ELSE 'NÃO_EXISTE'
    END as status
UNION ALL
SELECT 
    'pacientes' as objeto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pacientes' AND schemaname = 'public') THEN 'TABELA'
        ELSE 'NÃO_EXISTE'
    END as status
UNION ALL
SELECT 
    'consultas' as objeto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas' AND schemaname = 'public') THEN 'TABELA'
        ELSE 'NÃO_EXISTE'
    END as status
UNION ALL
SELECT 
    'locais_atendimento' as objeto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'locais_atendimento' AND schemaname = 'public') THEN 'TABELA'
        ELSE 'NÃO_EXISTE'
    END as status;

-- 3. ESTRUTURA DA TABELA PROFILES (SE EXISTIR)
SELECT 
    'PROFILES_COLUNAS' as info_tipo,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public')
ORDER BY ordinal_position;

-- 4. ESTRUTURA DA TABELA CONSULTAS (SE EXISTIR)
SELECT 
    'CONSULTAS_COLUNAS' as info_tipo,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'consultas' 
    AND table_schema = 'public'
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas' AND schemaname = 'public')
ORDER BY ordinal_position;

-- 5. FUNÇÕES RPC EXISTENTES
SELECT 
    'FUNCOES_RPC' as info_tipo,
    routine_name as nome_funcao,
    'EXISTE' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN ('get_specialties', 'get_available_states', 'get_available_cities', 'get_doctors_by_location_and_specialty', 'reserve_appointment_slot');

-- 6. RESUMO FINAL E RECOMENDAÇÃO
SELECT 
    'RECOMENDACAO' as tipo,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') 
             AND NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public') 
        THEN 'CRIAR_TUDO_DO_ZERO'
        
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public') 
        THEN 'PROFILES_É_VIEW_CRIAR_USER_PROFILES'
        
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas' AND schemaname = 'public')
        THEN 'CRIAR_TABELAS_FALTANTES'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'consultas' 
                AND column_name = 'data_consulta' 
                AND table_schema = 'public'
        )
        THEN 'CORRIGIR_COLUNAS_CONSULTAS'
        
        ELSE 'ESTRUTURA_PARECE_OK'
    END as acao_recomendada,
    
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') 
             AND NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public') 
        THEN 'Use: FIX_AGENDAMENTO_COMPLETO_DO_ZERO.sql'
        
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'profiles' AND schemaname = 'public') 
        THEN 'Use: FIX_AGENDAMENTO_COM_VIEWS.sql'
        
        WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'consultas' AND schemaname = 'public')
        THEN 'Use: FIX_AGENDAMENTO_PARCIAL.sql'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'consultas' 
                AND column_name = 'data_consulta' 
                AND table_schema = 'public'
        )
        THEN 'Use: FIX_AGENDAMENTO_COLUNAS.sql'
        
        ELSE 'Estrutura parece OK - verificar dados'
    END as script_usar;