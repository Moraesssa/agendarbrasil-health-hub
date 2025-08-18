-- =================================================================
-- SCRIPT DE CORREÇÃO: CRIAÇÃO DA TABELA `profiles` FALTANTE
-- =================================================================
--
-- **MOTIVO:** A aplicação está apresentando erros de 'relation "public.profiles" does not exist'.
-- Isso indica que a tabela `profiles`, que é central para o sistema, não existe no banco de dados.
-- Este script cria a tabela `profiles` com a estrutura e as políticas de segurança corretas,
-- inferidas a partir do código da aplicação e das funções do banco de dados.
--
-- **INSTRUÇÕES:** Execute este código no Editor SQL do seu painel Supabase.
--
-- =================================================================

-- **Passo 1: Criar a tabela `profiles`**
-- Esta tabela irá armazenar dados públicos dos usuários, estendendo a tabela `auth.users`.

CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    user_type text,
    display_name text,
    email text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz,
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Adicionar comentários para documentação no banco
COMMENT ON TABLE public.profiles IS 'Tabela de perfis públicos para todos os usuários do sistema.';
COMMENT ON COLUMN public.profiles.id IS 'Referencia auth.users.id';
COMMENT ON COLUMN public.profiles.user_type IS 'Tipo de usuário, ex: ''paciente'' ou ''medico''.';

-- =================================================================

-- **Passo 2: Habilitar Row-Level Security (RLS)**
-- Esta é uma medida de segurança crucial para garantir que os usuários só possam
-- acessar e modificar os dados que lhes são permitidos.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =================================================================

-- **Passo 3: Criar as Políticas de Acesso (Policies)**

-- **Política de SELECT:** Permitir que qualquer usuário autenticado possa ver os perfis.
-- Isso é necessário para funcionalidades como buscar por médicos ou pacientes.
CREATE POLICY "Public profiles are viewable by authenticated users."
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- **Política de INSERT:** Permitir que usuários criem seu próprio perfil.
-- A verificação `auth.uid() = id` garante que um usuário só pode criar um perfil para si mesmo.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- **Política de UPDATE:** Permitir que usuários atualizem seu próprio perfil.
-- A verificação `auth.uid() = id` garante que um usuário só pode modificar seu próprio perfil.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =================================================================

-- **Passo 4 (Opcional, mas recomendado): Criar uma função para manter `updated_at` atualizado**
-- Este trigger irá automaticamente atualizar o campo `updated_at` sempre que um perfil for modificado.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- =================================================================

-- **Passo 5 (Opcional, mas recomendado): Sincronização inicial de usuários existentes**
-- Se já existirem usuários na tabela `auth.users` que não estão em `profiles`,
-- este comando irá criar os perfis faltantes para eles.

INSERT INTO public.profiles (id, email, display_name, avatar_url)
SELECT id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- =================================================================

SELECT 'Script de correção para a tabela `profiles` concluído com sucesso!' as status;
