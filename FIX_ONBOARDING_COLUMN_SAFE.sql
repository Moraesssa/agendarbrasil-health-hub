-- =================================================================
-- SCRIPT SEGURO: ADICIONAR COLUNA onboarding_completed SE NÃO EXISTIR
-- =================================================================
--
-- Este script resolve o erro: "Could not find the 'onboarding_completed' column"
-- Verifica se a coluna existe antes de tentar adicioná-la
--
-- =================================================================

DO $$
BEGIN
    -- Verificar se a coluna onboarding_completed já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_completed'
    ) THEN
        -- Adicionar a coluna se ela não existir
        ALTER TABLE public.profiles 
        ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
        
        -- Adicionar comentário para documentação
        COMMENT ON COLUMN public.profiles.onboarding_completed 
        IS 'Indica se o usuário completou o fluxo de onboarding';
        
        RAISE NOTICE 'Coluna onboarding_completed adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna onboarding_completed já existe na tabela profiles';
    END IF;
    
    -- Verificar se a tabela profiles existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'ERRO: Tabela profiles não existe! Execute primeiro o script de criação das tabelas.';
    END IF;
    
END $$;

-- Verificar a estrutura atual da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Confirmar que a correção funcionou
SELECT 'Verificação concluída! A coluna onboarding_completed deve estar disponível agora.' as status;