-- =================================================================
-- SCRIPT DE CORREÇÃO E RESET: SINCRONIZAÇÃO DA TABELA `profiles`
-- =================================================================
--
-- **MOTIVO:** O erro 'trigger "on_auth_user_created" already exists' indica
-- que uma versão antiga ou corrompida do gatilho de sincronização já existe.
--
-- **SOLUÇÃO:** Este script é uma versão segura (idempotente) que primeiro
-- remove o gatilho antigo, se ele existir, e depois o recria com a lógica
-- correta e atualizada. Isso garante que o estado final do banco de dados
-- seja o correto, independentemente do estado anterior.
--
-- **INSTRUÇÕES:** Execute este código no Editor SQL do seu painel Supabase.
--
-- =================================================================

-- **Passo 1: Remover o gatilho antigo, se existir.**
-- `IF EXISTS` garante que o comando não falhará se o gatilho não existir.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =================================================================

-- **Passo 2: Recriar a função que será executada pelo gatilho.**
-- `CREATE OR REPLACE` garante que a função será atualizada para esta versão.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria um perfil para um novo usuário em auth.users.';

-- =================================================================

-- **Passo 3: Recriar o gatilho (trigger) que chama a função.**
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================================

-- **Passo 4 (Opcional, mas recomendado): Sincronização de usuários órfãos**
-- Garante que qualquer usuário que já existia antes da correção do gatilho
-- também tenha um perfil. É seguro executá-lo novamente.
INSERT INTO public.profiles (id, email, display_name, avatar_url)
SELECT id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- =================================================================

SELECT 'Gatilho de sincronização de perfis resetado com sucesso!' as status;
