-- =================================================================
-- DIAGNÓSTICO E CORREÇÃO: PROBLEMA DE CRIAÇÃO DE PERFIS
-- =================================================================
--
-- **PROBLEMA IDENTIFICADO:**
-- Usuário com ID c18291c9-b93e-4077-ad0f-86f5ae88b85d está autenticado
-- mas não possui perfil na tabela profiles, causando falhas na aplicação.
--
-- **CAUSA PROVÁVEL:**
-- 1. Trigger de criação automática de perfil não está funcionando
-- 2. Tabela profiles não existe ou está mal configurada
-- 3. Perfil foi deletado acidentalmente
-- 4. RLS (Row Level Security) está bloqueando a criação
--
-- **INSTRUÇÕES:** Execute este script no Editor SQL do Supabase
--
-- =================================================================

-- **ETAPA 1: DIAGNÓSTICO COMPLETO**
-- Verificar se o usuário existe e seus dados

SELECT 'DIAGNÓSTICO INICIADO' as step;

-- Verificar usuário específico em auth.users
SELECT 
    'Usuário em auth.users' as verificacao,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'c18291c9-b93e-4077-ad0f-86f5ae88b85d';

-- Verificar se perfil existe
SELECT 
    'Perfil em profiles' as verificacao,
    id,
    user_type,
    display_name,
    email,
    created_at
FROM public.profiles 
WHERE id = 'c18291c9-b93e-4077-ad0f-86f5ae88b85d';

-- Verificar estrutura da tabela profiles
SELECT 
    'Estrutura da tabela profiles' as verificacao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Verificar se RLS está habilitado
SELECT 
    'Status RLS da tabela profiles' as verificacao,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Verificar policies existentes
SELECT 
    'Policies da tabela profiles' as verificacao,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Verificar se o trigger existe
SELECT 
    'Triggers em auth.users' as verificacao,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- =================================================================

-- **ETAPA 2: CRIAR PERFIL MANUALMENTE PARA O USUÁRIO PROBLEMA**
-- Criar perfil para o usuário específico que está com problema

INSERT INTO public.profiles (id, email, display_name, user_type, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) as display_name,
    NULL as user_type, -- Será definido durante o onboarding
    u.created_at,
    now() as updated_at
FROM auth.users u
WHERE u.id = 'c18291c9-b93e-4077-ad0f-86f5ae88b85d'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    updated_at = now();

-- =================================================================

-- **ETAPA 3: RECRIAR TRIGGER DE CRIAÇÃO AUTOMÁTICA (SE NECESSÁRIO)**
-- Garantir que novos usuários tenham perfis criados automaticamente

-- Primeiro, remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      NEW.email
    ),
    NULL, -- user_type será definido no onboarding
    NEW.created_at,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================

-- **ETAPA 4: SINCRONIZAR TODOS OS USUÁRIOS EXISTENTES**
-- Garantir que todos os usuários em auth.users tenham perfil

INSERT INTO public.profiles (id, email, display_name, user_type, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) as display_name,
    NULL as user_type,
    u.created_at,
    now() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =================================================================

-- **ETAPA 5: VERIFICAR SE O PROBLEMA FOI RESOLVIDO**

SELECT 'VERIFICAÇÃO FINAL' as step;

-- Verificar se o perfil foi criado para o usuário específico
SELECT 
    'Perfil criado para usuário específico' as resultado,
    id,
    email,
    display_name,
    user_type,
    created_at
FROM public.profiles 
WHERE id = 'c18291c9-b93e-4077-ad0f-86f5ae88b85d';

-- Contar total de usuários vs perfis
SELECT 
    'Contagem final' as resultado,
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM public.profiles) as total_perfis,
    (SELECT COUNT(*) FROM auth.users u 
     LEFT JOIN public.profiles p ON u.id = p.id 
     WHERE p.id IS NULL) as usuarios_sem_perfil;

-- Verificar se o trigger está funcionando
SELECT 
    'Status do trigger' as resultado,
    trigger_name,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- =================================================================

SELECT 'SCRIPT DE CORREÇÃO CONCLUÍDO!' as status;
SELECT 'Se o problema persistir, verifique as permissões RLS e policies.' as observacao;
SELECT 'O usuário deve conseguir fazer login normalmente agora.' as resultado_esperado;