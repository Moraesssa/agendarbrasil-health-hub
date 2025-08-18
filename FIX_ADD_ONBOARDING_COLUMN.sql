-- =================================================================
-- SCRIPT DE CORREÇÃO: ADICIONAR A COLUNA `onboarding_completed`
-- =================================================================
--
-- **MOTIVO:** A aplicação está apresentando o erro 'Could not find the 'onboarding_completed' column'.
-- Isso ocorre porque o código tenta definir o status do onboarding para `false`
-- quando um tipo de usuário é escolhido, mas a coluna não existe na tabela `profiles`.
--
-- **INSTRUÇÕES:** Execute este código no Editor SQL do seu painel Supabase.
--
-- =================================================================

-- **Passo Único: Adicionar a coluna `onboarding_completed` à tabela `profiles`**
-- A coluna será do tipo `boolean`, não permitirá valores nulos (`NOT NULL`),
-- e terá um valor padrão de `false`.

ALTER TABLE public.profiles
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Adicionar comentário para documentação no banco
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica se o usuário completou o fluxo de cadastro de perfil.';

-- =================================================================

SELECT 'Coluna `onboarding_completed` adicionada com sucesso à tabela `profiles`!' as status;
