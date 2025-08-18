-- =================================================================
-- SCRIPT DE AUTOMAÇÃO: SINCRONIZAÇÃO DA TABELA `profiles`
-- =================================================================
--
-- **MOTIVO:** O sistema está apresentando o erro 'violates foreign key constraint'
-- porque um registro está sendo inserido em `medicos` ou `pacientes` antes que
-- o perfil do usuário correspondente exista em `public.profiles`.
--
-- **SOLUÇÃO:** Este script cria uma automação (uma função e um gatilho/trigger)
-- que garante que, para cada novo usuário criado em `auth.users`, um perfil
-- correspondente seja criado *automaticamente* em `public.profiles`.
-- Isso resolve a causa raiz do problema de inconsistência de dados.
--
-- **INSTRUÇÕES:** Execute este código no Editor SQL do seu painel Supabase.
--
-- =================================================================

-- **Passo 1: Criar a função que será executada pelo gatilho.**
-- Esta função pega os dados do novo usuário e cria um registro em `public.profiles`.

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

-- **Passo 2: Criar o gatilho (trigger) que chama a função.**
-- Este gatilho será acionado `AFTER` (depois) que um `INSERT` ocorrer na tabela `auth.users`.

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================================

-- **Passo 3 (Opcional, mas recomendado): Executar a sincronização para usuários já existentes**
-- Este comando, que já forneci antes, garante que qualquer usuário que já existia
-- antes da criação do gatilho também tenha um perfil. É seguro executá-lo novamente.

INSERT INTO public.profiles (id, email, display_name, avatar_url)
SELECT id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- =================================================================

SELECT 'Automação de sincronização de perfis criada com sucesso!' as status;
