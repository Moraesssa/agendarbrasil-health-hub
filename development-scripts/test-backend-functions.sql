-- Script para testar as funções do backend após as correções
-- Execute este script no Supabase SQL Editor para verificar se tudo está funcionando

-- 1. Testar get_specialties
SELECT 'Testing get_specialties...' as test;
SELECT public.get_specialties() as specialties;

-- 2. Testar get_available_states
SELECT 'Testing get_available_states...' as test;
SELECT * FROM public.get_available_states();

-- 3. Testar get_available_cities (substitua 'SP' por um estado válido)
SELECT 'Testing get_available_cities...' as test;
SELECT * FROM public.get_available_cities('SP');

-- 4. Testar get_doctors_by_location_and_specialty (ajuste os parâmetros)
SELECT 'Testing get_doctors_by_location_and_specialty...' as test;
SELECT * FROM public.get_doctors_by_location_and_specialty('Cardiologia', 'São Paulo', 'SP');

-- 5. Verificar políticas RLS da tabela medicos
SELECT 'Checking medicos RLS policies...' as test;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'medicos';

-- 6. Verificar foreign keys da tabela consultas
SELECT 'Checking consultas foreign keys...' as test;
SELECT 
    tc.constraint_name,
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
AND tc.table_name = 'consultas';

-- 7. Verificar integridade dos dados
SELECT 'Checking data integrity...' as test;
SELECT 
    'Consultas with invalid medico_id' as issue,
    COUNT(*) as count
FROM public.consultas c
LEFT JOIN public.profiles p ON c.medico_id = p.id
WHERE c.medico_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
    'Consultas with invalid paciente_id' as issue,
    COUNT(*) as count
FROM public.consultas c
LEFT JOIN public.profiles p ON c.paciente_id = p.id
WHERE c.paciente_id IS NOT NULL AND p.id IS NULL;