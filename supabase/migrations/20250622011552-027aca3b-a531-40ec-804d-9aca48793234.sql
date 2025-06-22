
-- Corrigir a tabela profiles para permitir user_type nulo inicialmente
-- Permitir que user_type seja NULL para novos usuários
ALTER TABLE public.profiles 
ALTER COLUMN user_type DROP NOT NULL;

-- Remover o valor padrão 'paciente'
ALTER TABLE public.profiles 
ALTER COLUMN user_type DROP DEFAULT;

-- Adicionar política RLS para INSERT na tabela profiles (estava faltando)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Adicionar política RLS para SELECT na tabela profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Adicionar política RLS para UPDATE na tabela profiles
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Habilitar RLS na tabela profiles se ainda não estiver habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
