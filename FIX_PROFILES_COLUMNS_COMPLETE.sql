-- =================================================================
-- SCRIPT COMPLETO: VERIFICAR E ADICIONAR COLUNAS FALTANTES NA TABELA PROFILES
-- =================================================================
--
-- Este script resolve erros relacionados a colunas faltantes na tabela profiles
-- Baseado na análise do código, as seguintes colunas são necessárias:
-- - onboarding_completed (BOOLEAN)
-- - user_type (TEXT)
-- - is_active (BOOLEAN) 
-- - last_login (TIMESTAMP)
-- - display_name (TEXT)
-- - photo_url (TEXT)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
--
-- =================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Primeiro, verificar se a tabela profiles existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Tabela profiles não existe! Execute primeiro o script de criação das tabelas básicas.';
    END IF;
    
    RAISE NOTICE 'Tabela profiles encontrada. Verificando colunas...';
    
    -- Verificar e adicionar coluna onboarding_completed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
        COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica se o usuário completou o fluxo de onboarding';
        RAISE NOTICE '✅ Coluna onboarding_completed adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna onboarding_completed já existe';
    END IF;
    
    -- Verificar e adicionar coluna user_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT CHECK (user_type IN ('paciente', 'medico', 'admin'));
        COMMENT ON COLUMN public.profiles.user_type IS 'Tipo de usuário: paciente, medico ou admin';
        RAISE NOTICE '✅ Coluna user_type adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna user_type já existe';
    END IF;
    
    -- Verificar e adicionar coluna is_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        COMMENT ON COLUMN public.profiles.is_active IS 'Indica se o usuário está ativo no sistema';
        RAISE NOTICE '✅ Coluna is_active adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna is_active já existe';
    END IF;
    
    -- Verificar e adicionar coluna last_login
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE DEFAULT now();
        COMMENT ON COLUMN public.profiles.last_login IS 'Data e hora do último login do usuário';
        RAISE NOTICE '✅ Coluna last_login adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna last_login já existe';
    END IF;
    
    -- Verificar e adicionar coluna display_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
        COMMENT ON COLUMN public.profiles.display_name IS 'Nome de exibição do usuário';
        RAISE NOTICE '✅ Coluna display_name adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna display_name já existe';
    END IF;
    
    -- Verificar e adicionar coluna photo_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN photo_url TEXT;
        COMMENT ON COLUMN public.profiles.photo_url IS 'URL da foto de perfil do usuário';
        RAISE NOTICE '✅ Coluna photo_url adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna photo_url já existe';
    END IF;
    
    -- Verificar e adicionar coluna created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
        COMMENT ON COLUMN public.profiles.created_at IS 'Data e hora de criação do perfil';
        RAISE NOTICE '✅ Coluna created_at adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna created_at já existe';
    END IF;
    
    -- Verificar e adicionar coluna updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
        COMMENT ON COLUMN public.profiles.updated_at IS 'Data e hora da última atualização do perfil';
        RAISE NOTICE '✅ Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna updated_at já existe';
    END IF;
    
    -- Verificar se a coluna email existe (essencial)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT NOT NULL;
        COMMENT ON COLUMN public.profiles.email IS 'Email do usuário';
        RAISE NOTICE '✅ Coluna email adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna email já existe';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Verificação de colunas concluída!';
    RAISE NOTICE '';
    
END $$;

-- Criar ou atualizar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Mostrar estrutura final da tabela
SELECT 
    'ESTRUTURA FINAL DA TABELA PROFILES:' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('onboarding_completed', 'user_type', 'is_active', 'last_login', 'display_name', 'photo_url', 'email') 
        THEN '🎯 ESSENCIAL PARA O SISTEMA'
        ELSE '📋 OUTRAS COLUNAS'
    END as importancia
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT 
    'DADOS NA TABELA:' as titulo,
    COUNT(*) as total_registros
FROM public.profiles;

SELECT 'Correção concluída! O erro "Could not find the onboarding_completed column" deve estar resolvido.' as status;