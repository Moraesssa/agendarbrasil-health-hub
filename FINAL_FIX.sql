-- =================================================================
-- SCRIPT DE CORREÇÃO FINAL E DEFINITIVO
-- =================================================================
--
-- **MOTIVO:** O usuário está preso em um "loop de onboarding" porque
-- seu perfil de usuário está incompleto e a tabela `profiles` não
-- possui a coluna `onboarding_completed`.
--
-- **SOLUÇÃO:** Este script executa duas ações cruciais:
--   1. Adiciona a coluna `onboarding_completed` que está faltando.
--   2. Atualiza o perfil do usuário atual para marcá-lo como
--      um paciente que já completou o onboarding.
--
-- =================================================================

-- **Passo 1: Adicionar a coluna `onboarding_completed` à tabela `profiles` se ela não existir.**
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica se o usuário completou o fluxo de cadastro de perfil.';

-- **Passo 2: Atualizar o perfil do usuário atual para corrigir o estado.**
-- Este comando assume que o usuário logado (auth.uid()) é um paciente
-- e marca seu onboarding como completo para evitar o loop.
UPDATE public.profiles
SET
    user_type = 'paciente',
    onboarding_completed = true
WHERE
    id = auth.uid();

-- =================================================================

SELECT 'Script de correção final executado. O perfil do usuário foi atualizado.' as status;
