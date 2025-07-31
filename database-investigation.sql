-- =====================================================
-- INVESTIGAÇÃO COMPLETA DA ESTRUTURA DO BANCO DE DADOS
-- =====================================================
-- Este script mapeia toda a estrutura do banco para análise segura
-- Execute cada seção separadamente para análise detalhada

-- =====================================================
-- 1. MAPEAMENTO COMPLETO DE TABELAS E COLUNAS
-- =====================================================
SELECT 
    '=== TABELAS E COLUNAS ===' as section_title;

SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN c.column_name LIKE '%_id' OR c.column_name = 'id' THEN '🔑 KEY'
        WHEN c.data_type LIKE '%timestamp%' THEN '📅 TIME'
        WHEN c.data_type = 'jsonb' THEN '📋 JSON'
        WHEN c.data_type LIKE '%text%' THEN '📝 TEXT'
        ELSE '📊 DATA'
    END as column_type_icon
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- 2. MAPEAMENTO DE FOREIGN KEYS E RELACIONAMENTOS
-- =====================================================
SELECT 
    '=== FOREIGN KEYS E RELACIONAMENTOS ===' as section_title;

SELECT 
    tc.constraint_name,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    rc.delete_rule,
    rc.update_rule,
    '🔗 ' || tc.table_name || '.' || kcu.column_name || ' → ' || ccu.table_name || '.' || ccu.column_name as relationship
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 3. MAPEAMENTO COMPLETO DE FUNÇÕES
-- =====================================================
SELECT 
    '=== FUNÇÕES DO BANCO ===' as section_title;

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    l.lanname as language,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef
        WHEN true THEN '🔒 SECURITY DEFINER'
        ELSE '👤 SECURITY INVOKER'
    END as security_type,
    LENGTH(p.prosrc) as body_length,
    '📋 Function: ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as function_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY p.proname;

-- =====================================================
-- 4. DETALHES ESPECÍFICOS DA FUNÇÃO reserve_appointment_slot
-- =====================================================
SELECT 
    '=== DETALHES DA FUNÇÃO reserve_appointment_slot ===' as section_title;

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosrc as function_body,
    array_to_string(p.proargnames, ', ') as parameter_names,
    array_to_string(p.proargtypes::regtype[], ', ') as parameter_types
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'reserve_appointment_slot';

-- =====================================================
-- 5. MAPEAMENTO DE POLÍTICAS RLS
-- =====================================================
SELECT 
    '=== POLÍTICAS RLS (ROW LEVEL SECURITY) ===' as section_title;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command_type,
    qual as using_expression,
    with_check,
    '🛡️ ' || tablename || ' → ' || policyname || ' (' || cmd || ')' as policy_summary
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. ÍNDICES E CONSTRAINTS
-- =====================================================
SELECT 
    '=== ÍNDICES E CONSTRAINTS ===' as section_title;

SELECT 
    t.relname as table_name,
    i.relname as index_name,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary,
    array_to_string(array_agg(a.attname ORDER BY c.ordinality), ', ') as columns,
    CASE 
        WHEN ix.indisprimary THEN '🔑 PRIMARY KEY'
        WHEN ix.indisunique THEN '🔒 UNIQUE'
        ELSE '📇 INDEX'
    END as constraint_type
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN unnest(ix.indkey) WITH ORDINALITY AS c(colnum, ordinality) ON true
JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = c.colnum
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
AND t.relkind = 'r'  -- Only tables
GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
ORDER BY t.relname, i.relname;

-- =====================================================
-- 7. ANÁLISE ESPECÍFICA DA TABELA CONSULTAS
-- =====================================================
SELECT 
    '=== ANÁLISE DETALHADA DA TABELA CONSULTAS ===' as section_title;

-- Estrutura da tabela consultas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    CASE 
        WHEN column_name = 'id' THEN '🆔 Primary Key'
        WHEN column_name LIKE '%_id' THEN '🔗 Foreign Key'
        WHEN column_name LIKE '%_at' OR column_name LIKE 'data_%' THEN '📅 Timestamp'
        WHEN data_type = 'jsonb' THEN '📋 JSON Data'
        WHEN column_name LIKE 'status%' THEN '📊 Status Field'
        ELSE '📝 Data Field'
    END as field_purpose
FROM information_schema.columns 
WHERE table_name = 'consultas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 8. VERIFICAÇÃO DE DEPENDÊNCIAS DA FUNÇÃO
-- =====================================================
SELECT 
    '=== DEPENDÊNCIAS DA FUNÇÃO reserve_appointment_slot ===' as section_title;

-- Verificar se alguma view ou função depende desta função
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_object,
    dependent_view.relkind as object_type,
    CASE dependent_view.relkind
        WHEN 'r' THEN '📋 Table'
        WHEN 'v' THEN '👁️ View'
        WHEN 'm' THEN '📊 Materialized View'
        WHEN 'f' THEN '🔧 Function'
    END as object_type_icon
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
JOIN pg_proc source_proc ON pg_depend.refobjid = source_proc.oid
JOIN pg_namespace source_ns ON source_proc.pronamespace = source_ns.oid
WHERE source_ns.nspname = 'public' 
AND source_proc.proname = 'reserve_appointment_slot'

UNION

-- Verificar triggers que possam usar a função
SELECT 
    'public' as dependent_schema,
    t.tgname as dependent_object,
    'trigger' as object_type,
    '⚡ Trigger' as object_type_icon
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'reserve_appointment_slot';

-- =====================================================
-- 9. ANÁLISE DE DADOS EXISTENTES
-- =====================================================
SELECT 
    '=== ANÁLISE DE DADOS EXISTENTES ===' as section_title;

-- Contagem de registros por tabela
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count,
    '👥 Users' as description
FROM profiles
UNION ALL
SELECT 
    'medicos' as table_name,
    COUNT(*) as record_count,
    '👨‍⚕️ Doctors' as description
FROM medicos
UNION ALL
SELECT 
    'pacientes' as table_name,
    COUNT(*) as record_count,
    '🏥 Patients' as description
FROM pacientes
UNION ALL
SELECT 
    'consultas' as table_name,
    COUNT(*) as record_count,
    '📅 Appointments' as description
FROM consultas
UNION ALL
SELECT 
    'locais_atendimento' as table_name,
    COUNT(*) as record_count,
    '🏢 Locations' as description
FROM locais_atendimento
UNION ALL
SELECT 
    'pagamentos' as table_name,
    COUNT(*) as record_count,
    '💳 Payments' as description
FROM pagamentos
ORDER BY record_count DESC;

-- =====================================================
-- 10. VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL
-- =====================================================
SELECT 
    '=== VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL ===' as section_title;

-- Verificar consultas com referências inválidas
SELECT 
    'consultas → profiles (paciente_id)' as relationship,
    COUNT(*) as invalid_references,
    CASE WHEN COUNT(*) > 0 THEN '❌ PROBLEMA' ELSE '✅ OK' END as status
FROM consultas c
LEFT JOIN profiles p ON c.paciente_id = p.id
WHERE c.paciente_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
    'consultas → profiles (medico_id)' as relationship,
    COUNT(*) as invalid_references,
    CASE WHEN COUNT(*) > 0 THEN '❌ PROBLEMA' ELSE '✅ OK' END as status
FROM consultas c
LEFT JOIN profiles p ON c.medico_id = p.id
WHERE c.medico_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
    'pagamentos → consultas' as relationship,
    COUNT(*) as invalid_references,
    CASE WHEN COUNT(*) > 0 THEN '❌ PROBLEMA' ELSE '✅ OK' END as status
FROM pagamentos pg
LEFT JOIN consultas c ON pg.consulta_id = c.id
WHERE pg.consulta_id IS NOT NULL AND c.id IS NULL;

-- =====================================================
-- 11. RESUMO EXECUTIVO
-- =====================================================
SELECT 
    '=== RESUMO EXECUTIVO ===' as section_title;

SELECT 
    'Database Health Check' as analysis_type,
    'Estrutura mapeada com sucesso' as status,
    'Pronto para análise de impacto' as next_step,
    NOW() as analysis_timestamp;