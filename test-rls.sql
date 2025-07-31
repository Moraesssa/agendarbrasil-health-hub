-- Script SQL para testar políticas RLS e identificar bloqueios
-- Execute no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado nas tabelas críticas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    hasrls
FROM pg_tables 
WHERE tablename IN ('medicos', 'locais_atendimento', 'consultas', 'profiles')
AND schemaname = 'public';

-- 2. Listar todas as políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as condition
FROM pg_policies 
WHERE tablename IN ('medicos', 'locais_atendimento', 'consultas', 'profiles')
ORDER BY tablename, policyname;

-- 3. Verificar se há dados nas tabelas
SELECT 'medicos' as tabela, COUNT(*) as total FROM public.medicos
UNION ALL
SELECT 'locais_atendimento' as tabela, COUNT(*) as total FROM public.locais_atendimento
UNION ALL
SELECT 'consultas' as tabela, COUNT(*) as total FROM public.consultas
UNION ALL
SELECT 'profiles' as tabela, COUNT(*) as total FROM public.profiles;

-- 4. Testar query específica que está falhando (substitua o UUID por um real)
-- SELECT m.configuracoes, la.*
-- FROM public.medicos m
-- LEFT JOIN public.locais_atendimento la ON m.user_id = la.medico_id
-- WHERE m.user_id = 'SUBSTITUA-POR-UUID-REAL'
-- LIMIT 1;

-- 5. Verificar estrutura da tabela medicos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'medicos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela locais_atendimento
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'locais_atendimento' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('medicos', 'locais_atendimento', 'consultas')
    AND tc.table_schema = 'public';