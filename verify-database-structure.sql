-- ========================================
-- VERIFICAÇÃO COMPLETA DA ESTRUTURA DO BANCO DE DADOS
-- Verifica se perfis, médicos, pacientes e campos de agendamento estão sendo criados
-- ========================================

-- 1. VERIFICAR EXISTÊNCIA DAS TABELAS PRINCIPAIS
SELECT 'VERIFICANDO TABELAS PRINCIPAIS' as status;

SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    CASE 
        WHEN tablename IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento') 
        THEN '✅ ESSENCIAL' 
        ELSE '📋 AUXILIAR' 
    END as importance
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento', 'pagamentos')
ORDER BY tablename;

-- 2. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 'VERIFICANDO ESTRUTURA - PROFILES' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'email', 'user_type', 'display_name', 'is_active') 
        THEN '✅ CAMPO ESSENCIAL'
        ELSE '📋 CAMPO ADICIONAL'
    END as field_status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA MEDICOS
SELECT 'VERIFICANDO ESTRUTURA - MEDICOS' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'crm', 'especialidades', 'telefone') 
        THEN '✅ CAMPO ESSENCIAL'
        ELSE '📋 CAMPO ADICIONAL'
    END as field_status
FROM information_schema.columns 
WHERE table_name = 'medicos' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUTURA DA TABELA PACIENTES
SELECT 'VERIFICANDO ESTRUTURA - PACIENTES' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'dados_pessoais', 'contato') 
        THEN '✅ CAMPO ESSENCIAL'
        ELSE '📋 CAMPO ADICIONAL'
    END as field_status
FROM information_schema.columns 
WHERE table_name = 'pacientes' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. VERIFICAR ESTRUTURA DA TABELA CONSULTAS (AGENDAMENTOS)
SELECT 'VERIFICANDO ESTRUTURA - CONSULTAS' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'paciente_id', 'medico_id', 'data_consulta', 'status', 'tipo_consulta') 
        THEN '✅ CAMPO ESSENCIAL'
        ELSE '📋 CAMPO ADICIONAL'
    END as field_status
FROM information_schema.columns 
WHERE table_name = 'consultas' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR ESTRUTURA DA TABELA LOCAIS_ATENDIMENTO (ESTADO, CIDADE)
SELECT 'VERIFICANDO ESTRUTURA - LOCAIS_ATENDIMENTO' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'medico_id', 'nome_local', 'cidade', 'estado', 'endereco') 
        THEN '✅ CAMPO ESSENCIAL'
        ELSE '📋 CAMPO ADICIONAL'
    END as field_status
FROM information_schema.columns 
WHERE table_name = 'locais_atendimento' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. VERIFICAR DADOS EXISTENTES - CONTAGEM
SELECT 'VERIFICANDO DADOS EXISTENTES' as status;

SELECT 
    'profiles' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN user_type = 'paciente' THEN 1 END) as pacientes,
    COUNT(CASE WHEN user_type = 'medico' THEN 1 END) as medicos
FROM profiles
UNION ALL
SELECT 
    'medicos' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN crm IS NOT NULL THEN 1 END) as com_crm,
    COUNT(CASE WHEN especialidades IS NOT NULL AND array_length(especialidades, 1) > 0 THEN 1 END) as com_especialidades
FROM medicos
UNION ALL
SELECT 
    'pacientes' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN dados_pessoais IS NOT NULL THEN 1 END) as com_dados_pessoais,
    COUNT(CASE WHEN contato IS NOT NULL THEN 1 END) as com_contato
FROM pacientes
UNION ALL
SELECT 
    'consultas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as agendadas,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas
FROM consultas
UNION ALL
SELECT 
    'locais_atendimento' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN cidade IS NOT NULL THEN 1 END) as com_cidade,
    COUNT(CASE WHEN estado IS NOT NULL THEN 1 END) as com_estado
FROM locais_atendimento;

-- 8. VERIFICAR CHAVES ESTRANGEIRAS E RELACIONAMENTOS
SELECT 'VERIFICANDO RELACIONAMENTOS' as status;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento')
ORDER BY tc.table_name;

-- 9. VERIFICAR POLÍTICAS RLS (ROW LEVEL SECURITY)
SELECT 'VERIFICANDO POLÍTICAS RLS' as status;

SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVADO'
        ELSE '❌ RLS DESATIVADO'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento')
ORDER BY tablename;

-- 10. VERIFICAR ÍNDICES PARA PERFORMANCE
SELECT 'VERIFICANDO ÍNDICES' as status;

SELECT 
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name,
    CASE 
        WHEN ix.indisunique THEN '🔑 UNIQUE'
        WHEN ix.indisprimary THEN '🔑 PRIMARY'
        ELSE '📊 INDEX'
    END as index_type
FROM 
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE 
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN ('profiles', 'medicos', 'pacientes', 'consultas', 'locais_atendimento')
ORDER BY t.relname, i.relname;

-- 11. AMOSTRA DE DADOS PARA VERIFICAÇÃO
SELECT 'VERIFICANDO AMOSTRAS DE DADOS' as status;

-- Profiles sample
SELECT 'AMOSTRA - PROFILES' as tipo, user_type, display_name, email, is_active, created_at
FROM profiles 
WHERE created_at IS NOT NULL
ORDER BY created_at DESC 
LIMIT 3;

-- Medicos sample
SELECT 'AMOSTRA - MEDICOS' as tipo, user_id, crm, especialidades, telefone, created_at
FROM medicos 
WHERE created_at IS NOT NULL
ORDER BY created_at DESC 
LIMIT 3;

-- Consultas sample
SELECT 'AMOSTRA - CONSULTAS' as tipo, paciente_id, medico_id, data_consulta, status, tipo_consulta
FROM consultas 
WHERE created_at IS NOT NULL
ORDER BY created_at DESC 
LIMIT 3;

-- 12. VERIFICAÇÃO FINAL - CAMPOS ESPECÍFICOS SOLICITADOS
SELECT 'VERIFICAÇÃO FINAL DOS CAMPOS SOLICITADOS' as status;

SELECT 
    '✅ PERFIS (paciente/médico)' as campo,
    CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE user_type IN ('paciente', 'medico')) 
         THEN 'OK - Dados encontrados' 
         ELSE 'ATENÇÃO - Sem dados' 
    END as status

UNION ALL

SELECT 
    '✅ ESPECIALIDADES' as campo,
    CASE WHEN EXISTS (SELECT 1 FROM medicos WHERE especialidades IS NOT NULL AND array_length(especialidades, 1) > 0) 
         THEN 'OK - Especialidades cadastradas' 
         ELSE 'ATENÇÃO - Sem especialidades' 
    END as status

UNION ALL

SELECT 
    '✅ ESTADOS E CIDADES' as campo,
    CASE WHEN EXISTS (SELECT 1 FROM locais_atendimento WHERE cidade IS NOT NULL AND estado IS NOT NULL) 
         THEN 'OK - Locais com cidade/estado' 
         ELSE 'ATENÇÃO - Sem dados de localização' 
    END as status

UNION ALL

SELECT 
    '✅ AGENDAMENTOS (médico, data, horário)' as campo,
    CASE WHEN EXISTS (SELECT 1 FROM consultas WHERE medico_id IS NOT NULL AND data_consulta IS NOT NULL) 
         THEN 'OK - Consultas agendadas' 
         ELSE 'ATENÇÃO - Sem agendamentos' 
    END as status

UNION ALL

SELECT 
    '✅ CONFIRMAÇÃO DE AGENDAMENTOS' as campo,
    CASE WHEN EXISTS (SELECT 1 FROM consultas WHERE status IN ('scheduled', 'confirmed', 'pending_payment')) 
         THEN 'OK - Sistema de status funcionando' 
         ELSE 'ATENÇÃO - Sem sistema de confirmação' 
    END as status;

-- 13. RESUMO EXECUTIVO
SELECT 'RESUMO EXECUTIVO' as status;

WITH summary AS (
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'medico') as total_medicos,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'paciente') as total_pacientes,
    (SELECT COUNT(*) FROM medicos) as registros_medicos,
    (SELECT COUNT(*) FROM pacientes) as registros_pacientes,
    (SELECT COUNT(*) FROM consultas) as total_consultas,
    (SELECT COUNT(*) FROM locais_atendimento) as total_locais
)
SELECT 
  total_profiles as "Total de Perfis",
  total_medicos as "Médicos",
  total_pacientes as "Pacientes", 
  registros_medicos as "Registros de Médicos",
  registros_pacientes as "Registros de Pacientes",
  total_consultas as "Total de Consultas",
  total_locais as "Locais de Atendimento"
FROM summary;