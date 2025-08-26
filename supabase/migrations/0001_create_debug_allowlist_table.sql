-- Tabela para gerenciar a permissão de acesso ao logging avançado.
-- Usuários listados aqui podem ter seus logs detalhados capturados e enviados.

CREATE TABLE IF NOT EXISTS debug_allowlist (
    user_id UUID PRIMARY KEY, -- ID do usuário do Supabase Auth
    is_active BOOLEAN NOT NULL DEFAULT false, -- Indica se o acesso está ativo
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria um índice na coluna user_id para otimizar buscas.
CREATE INDEX IF NOT EXISTS idx_debug_allowlist_user_id ON debug_allowlist(user_id);

-- Opcional: Adicionar uma trigger para atualizar 'updated_at' automaticamente.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_debug_allowlist_updated_at
BEFORE UPDATE ON debug_allowlist
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentário: Para aplicar esta migração, você precisaria usar o Supabase CLI:
-- 1. Instale o Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
-- 2. Configure o CLI com seu projeto Supabase: supabase login, supabase link --project-ref <your-project-ref>
-- 3. Execute a migração: supabase migration up
-- O 'project_id' do seu projeto Supabase é 'ulebotjrsgheybhpdnxd'.
