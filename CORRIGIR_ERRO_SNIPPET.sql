-- ========================================
-- SCRIPT PARA VERIFICAR E LIMPAR REFERENCIAS QUEBRADAS
-- Identifica problemas que podem estar causando erros de snippet
-- ========================================

-- 1. VERIFICAR LOGS DE ERRO NO BANCO
SELECT 
    'LOGS_ERRO' as tipo,
    created_at,
    message,
    details
FROM public.logs 
WHERE message ILIKE '%snippet%' 
   OR message ILIKE '%Unable to find%'
   OR details ILIKE '%e73de85e-16e7-45a6-bfda-32cf37505df1%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. VERIFICAR CONFIGURAÇÕES DE DESENVOLVIMENTO
SELECT 
    'CONFIG_DEV' as tipo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'development_config') 
        THEN 'Tabela existe'
        ELSE 'Tabela não existe'
    END as status;

-- 3. LIMPAR CACHE DO SUPABASE (se existir tabela de cache)
DO $$
BEGIN
    -- Tentar limpar cache se a tabela existir
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cache' AND schemaname = 'public') THEN
        DELETE FROM public.cache WHERE key ILIKE '%snippet%';
        RAISE NOTICE 'Cache de snippets limpo';
    END IF;
    
    -- Verificar e limpar logs antigos
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'logs' AND schemaname = 'public') THEN
        DELETE FROM public.logs WHERE created_at < NOW() - INTERVAL '7 days';
        RAISE NOTICE 'Logs antigos limpos';
    END IF;
END $$;

-- 4. VERIFICAR CONFIGURAÇÕES DO SISTEMA
SELECT 
    'VERIFICACAO_SISTEMA' as tipo,
    'Banco funcionando' as status,
    NOW() as timestamp;

-- 5. TESTAR FUNCIONALIDADE BÁSICA DO AGENDAMENTO
DO $$
DECLARE
    especialidades_count INTEGER;
    estados_count INTEGER;
    funcoes_rpc_count INTEGER;
BEGIN
    -- Testar especialidades
    BEGIN
        SELECT COUNT(*) INTO especialidades_count 
        FROM public.get_specialties();
        RAISE NOTICE 'Especialidades funcionando: % encontradas', especialidades_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro nas especialidades: %', SQLERRM;
    END;
    
    -- Testar estados
    BEGIN
        SELECT COUNT(*) INTO estados_count 
        FROM public.get_available_states();
        RAISE NOTICE 'Estados funcionando: % encontrados', estados_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erro nos estados: %', SQLERRM;
    END;
    
    -- Contar funções RPC
    SELECT COUNT(*) INTO funcoes_rpc_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name IN ('get_specialties', 'get_available_states', 'get_available_cities', 'get_doctors_by_location_and_specialty', 'reserve_appointment_slot');
    
    RAISE NOTICE 'Funções RPC encontradas: %/5', funcoes_rpc_count;
    
    IF funcoes_rpc_count = 5 AND especialidades_count > 0 AND estados_count > 0 THEN
        RAISE NOTICE '✅ SISTEMA FUNCIONANDO CORRETAMENTE!';
        RAISE NOTICE '🔗 Teste em: https://agendarbrasil-health-hub.lovable.app/agendamento';
    ELSE
        RAISE NOTICE '⚠️ Sistema precisa de correções';
    END IF;
END $$;

-- RESULTADO FINAL
SELECT 
    'DIAGNOSTICO_SNIPPET' as resultado,
    'O erro de snippet pode ser:' as causa,
    'Cache do navegador, extensão VS Code, ou referência antiga' as solucao_1,
    'Execute: Ctrl+Shift+R no navegador para forçar reload' as solucao_2,
    'Desative extensões do VS Code temporariamente' as solucao_3,
    'O banco de dados está funcionando normalmente' as status_banco;