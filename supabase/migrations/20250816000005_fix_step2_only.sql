-- Migration CONSERVADORA para corrigir APENAS Step 2 - Estados
-- Data: 2025-08-16
-- ATENÇÃO: NÃO altera dados existentes, apenas corrige função

-- 1. VERIFICAR se função get_available_states existe e funciona
DO $$
DECLARE
    func_exists BOOLEAN;
    test_result INTEGER;
BEGIN
    -- Verificar se função existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_available_states'
    ) INTO func_exists;
    
    RAISE NOTICE 'Função get_available_states existe: %', func_exists;
    
    IF func_exists THEN
        -- Testar se função retorna dados
        BEGIN
            SELECT COUNT(*) INTO test_result FROM public.get_available_states();
            RAISE NOTICE 'Função retorna % estados', test_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERRO ao executar função: %', SQLERRM;
            func_exists := FALSE;
        END;
    END IF;
    
    -- Se função não existe ou não funciona, recriar
    IF NOT func_exists OR test_result = 0 THEN
        RAISE NOTICE 'Recriando função get_available_states...';
        
        -- Remover função existente
        DROP FUNCTION IF EXISTS public.get_available_states();
        
        -- Recriar função
        EXECUTE '
        CREATE FUNCTION public.get_available_states()
        RETURNS TABLE(uf TEXT, nome TEXT)
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        AS $func$
          SELECT DISTINCT 
            l.estado as uf,
            l.estado as nome
          FROM public.locais_atendimento l
          JOIN public.medicos m ON m.id = l.medico_id
          WHERE l.is_active = true 
            AND (m.verificacao->>''aprovado'' = ''true'' OR m.verificacao = ''{}''::jsonb)
          ORDER BY l.estado;
        $func$;
        ';
        
        -- Conceder permissões
        GRANT EXECUTE ON FUNCTION public.get_available_states() TO anon, authenticated;
        
        -- Testar novamente
        SELECT COUNT(*) INTO test_result FROM public.get_available_states();
        RAISE NOTICE 'Após recriação, função retorna % estados', test_result;
    END IF;
END $$;

-- 2. VERIFICAÇÃO FINAL - Testar todas as funções do fluxo
DO $$
DECLARE
    especialidades_count INTEGER;
    estados_count INTEGER;
    cidades_df_count INTEGER;
    medicos_df_count INTEGER;
BEGIN
    -- Testar get_specialties
    BEGIN
        SELECT array_length(public.get_specialties(), 1) INTO especialidades_count;
    EXCEPTION WHEN OTHERS THEN
        especialidades_count := 0;
        RAISE NOTICE 'ERRO em get_specialties: %', SQLERRM;
    END;
    
    -- Testar get_available_states
    BEGIN
        SELECT COUNT(*) INTO estados_count FROM public.get_available_states();
    EXCEPTION WHEN OTHERS THEN
        estados_count := 0;
        RAISE NOTICE 'ERRO em get_available_states: %', SQLERRM;
    END;
    
    -- Testar get_available_cities para DF
    BEGIN
        SELECT COUNT(*) INTO cidades_df_count FROM public.get_available_cities('DF');
    EXCEPTION WHEN OTHERS THEN
        cidades_df_count := 0;
        RAISE NOTICE 'ERRO em get_available_cities: %', SQLERRM;
    END;
    
    -- Testar get_doctors_by_location_and_specialty
    BEGIN
        SELECT COUNT(*) INTO medicos_df_count 
        FROM public.get_doctors_by_location_and_specialty('Cardiologia', 'Brasília', 'DF');
    EXCEPTION WHEN OTHERS THEN
        medicos_df_count := 0;
        RAISE NOTICE 'ERRO em get_doctors_by_location_and_specialty: %', SQLERRM;
    END;
    
    -- Relatório final
    RAISE NOTICE '=== VERIFICAÇÃO COMPLETA DO FLUXO ===';
    RAISE NOTICE 'Step 1 - Especialidades: %', COALESCE(especialidades_count, 0);
    RAISE NOTICE 'Step 2 - Estados: %', estados_count;
    RAISE NOTICE 'Step 3 - Cidades DF: %', cidades_df_count;
    RAISE NOTICE 'Step 4 - Médicos DF: %', medicos_df_count;
    
    IF estados_count > 0 AND cidades_df_count > 0 AND medicos_df_count > 0 THEN
        RAISE NOTICE '✅ TODOS OS STEPS FUNCIONANDO!';
    ELSE
        RAISE NOTICE '⚠️ PROBLEMAS DETECTADOS:';
        IF estados_count = 0 THEN RAISE NOTICE '  - Step 2: Sem estados'; END IF;
        IF cidades_df_count = 0 THEN RAISE NOTICE '  - Step 3: Sem cidades DF'; END IF;
        IF medicos_df_count = 0 THEN RAISE NOTICE '  - Step 4: Sem médicos DF'; END IF;
    END IF;
END $$;