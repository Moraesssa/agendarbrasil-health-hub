-- Script para testar se a correção dos horários funcionou

-- 1. Verificar se a função RPC foi criada
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'get_doctor_schedule_data' 
AND routine_schema = 'public';

-- 2. Testar a função RPC com um médico real (substitua o UUID)
-- SELECT * FROM public.get_doctor_schedule_data('SUBSTITUA-POR-UUID-REAL', '2024-01-01');

-- 3. Verificar as novas políticas RLS
SELECT 
    tablename,
    policyname,
    cmd as operation,
    qual as condition
FROM pg_policies 
WHERE tablename IN ('medicos', 'locais_atendimento')
AND policyname LIKE '%authenticated%'
ORDER BY tablename, policyname;

-- 4. Testar acesso direto às tabelas
SELECT 
    'medicos' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN configuracoes IS NOT NULL THEN 1 END) as com_configuracoes
FROM public.medicos;

SELECT 
    'locais_atendimento' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
FROM public.locais_atendimento;

-- 5. Verificar estrutura dos horários de um médico
SELECT 
    user_id,
    configuracoes->'horarioAtendimento' as horarios,
    jsonb_typeof(configuracoes->'horarioAtendimento') as tipo_horarios
FROM public.medicos 
WHERE configuracoes->'horarioAtendimento' IS NOT NULL
LIMIT 3;