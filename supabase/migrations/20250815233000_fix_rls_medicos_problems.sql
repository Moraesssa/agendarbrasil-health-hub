-- Migration para corrigir problemas identificados no debug RLS médicos
-- Data: 2025-01-15
-- Autor: Kiro AI Assistant

-- 1. Criar tabela locais_atendimento se não existir
CREATE TABLE IF NOT EXISTS public.locais_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID REFERENCES public.medicos(id) ON DELETE CASCADE NOT NULL,
  nome_local TEXT NOT NULL,
  endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT,
  telefone TEXT,
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela locais_atendimento
ALTER TABLE public.locais_atendimento ENABLE ROW LEVEL SECURITY;

-- 2. Políticas RLS para locais_atendimento
-- Médicos podem gerenciar seus próprios locais
CREATE POLICY "Medicos can manage own locations" 
ON public.locais_atendimento 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.medicos 
    WHERE medicos.id = locais_atendimento.medico_id 
    AND medicos.user_id = auth.uid()
  )
);

-- Usuários autenticados podem ver locais ativos para agendamento
CREATE POLICY "Authenticated users can view active locations" 
ON public.locais_atendimento 
FOR SELECT 
USING (
  is_active = true 
  AND auth.role() = 'authenticated'
);

-- 3. Corrigir política RLS da tabela medicos para permitir acesso público aos dados básicos
DROP POLICY IF EXISTS "Public can view basic doctor data for scheduling" ON public.medicos;

CREATE POLICY "Public can view basic doctor data for scheduling" 
ON public.medicos 
FOR SELECT 
USING (
  -- Médicos podem ver seus próprios dados
  auth.uid() = user_id 
  OR 
  -- Usuários autenticados podem ver dados básicos para agendamento
  auth.role() = 'authenticated'
  OR
  -- Acesso anônimo limitado para dados públicos básicos (sem informações sensíveis)
  (
    auth.role() = 'anon' 
    AND verificacao->>'aprovado' = 'true'
  )
);

-- 4. Política para profiles permitir acesso público aos dados básicos de médicos
DROP POLICY IF EXISTS "Public can view basic doctor profiles" ON public.profiles;

CREATE POLICY "Public can view basic doctor profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Usuários podem ver seus próprios dados
  auth.uid() = id 
  OR 
  -- Acesso público aos profiles de médicos aprovados
  (
    user_type = 'medico' 
    AND EXISTS (
      SELECT 1 FROM public.medicos 
      WHERE medicos.user_id = profiles.id 
      AND medicos.verificacao->>'aprovado' = 'true'
    )
  )
);

-- 5. Criar função RPC para buscar especialidades
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $
  SELECT ARRAY(
    SELECT DISTINCT unnest(especialidades) as especialidade
    FROM public.medicos
    WHERE verificacao->>'aprovado' = 'true'
    ORDER BY especialidade
  );
$;

-- 6. Criar função RPC para buscar estados disponíveis
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf TEXT, nome TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $
  SELECT DISTINCT 
    l.estado as uf,
    l.estado as nome
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.id = l.medico_id
  WHERE l.is_active = true 
    AND m.verificacao->>'aprovado' = 'true'
  ORDER BY l.estado;
$;

-- 7. Criar função RPC para buscar cidades por estado
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf TEXT)
RETURNS TABLE(cidade TEXT, estado TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $
  SELECT DISTINCT 
    l.cidade,
    l.estado
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.id = l.medico_id
  WHERE l.is_active = true 
    AND l.estado = state_uf
    AND m.verificacao->>'aprovado' = 'true'
  ORDER BY l.cidade;
$;

-- 8. Criar função RPC para buscar médicos por localização e especialidade
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty TEXT,
  p_city TEXT,
  p_state TEXT
)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  especialidades TEXT[],
  crm TEXT,
  telefone TEXT,
  local_nome TEXT,
  local_endereco JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $
  SELECT 
    m.id,
    p.display_name,
    m.especialidades,
    m.crm,
    m.telefone,
    l.nome_local as local_nome,
    l.endereco as local_endereco
  FROM public.medicos m
  JOIN public.profiles p ON p.id = m.user_id
  JOIN public.locais_atendimento l ON l.medico_id = m.id
  WHERE m.verificacao->>'aprovado' = 'true'
    AND l.is_active = true
    AND p_specialty = ANY(m.especialidades)
    AND l.cidade = p_city
    AND l.estado = p_state
  ORDER BY p.display_name;
$;

-- 9. Conceder permissões para as funções RPC
GRANT EXECUTE ON FUNCTION public.get_specialties() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_states() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_cities(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 10. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medicos_especialidades ON public.medicos USING GIN (especialidades);
CREATE INDEX IF NOT EXISTS idx_medicos_aprovado ON public.medicos ((verificacao->>'aprovado'));
CREATE INDEX IF NOT EXISTS idx_locais_cidade_estado ON public.locais_atendimento (cidade, estado);
CREATE INDEX IF NOT EXISTS idx_locais_active ON public.locais_atendimento (is_active);

-- 11. Inserir dados de exemplo se as tabelas estiverem vazias
DO $
DECLARE
  medico_count INTEGER;
  exemplo_medico_id UUID;
BEGIN
  -- Verificar se já existem médicos
  SELECT COUNT(*) INTO medico_count FROM public.medicos;
  
  IF medico_count = 0 THEN
    -- Inserir um médico de exemplo para testes
    INSERT INTO public.medicos (
      id, user_id, crm, especialidades, telefone, 
      endereco, dados_profissionais, verificacao
    ) VALUES (
      gen_random_uuid(),
      gen_random_uuid(), -- Este seria um user_id real em produção
      'CRM/DF 12345',
      ARRAY['Cardiologia', 'Clínica Geral'],
      '(61) 99999-9999',
      '{"logradouro": "SQN 123", "cidade": "Brasília", "estado": "DF", "cep": "70000-000"}'::jsonb,
      '{"formacao": "Medicina - UnB", "residencia": "Cardiologia - HUB"}'::jsonb,
      '{"crm_verificado": true, "documentos_enviados": true, "aprovado": "true"}'::jsonb
    ) RETURNING id INTO exemplo_medico_id;
    
    -- Inserir local de atendimento para o médico de exemplo
    INSERT INTO public.locais_atendimento (
      medico_id, nome_local, endereco, cidade, estado, cep, telefone
    ) VALUES (
      exemplo_medico_id,
      'Clínica Exemplo',
      '{"logradouro": "SQN 123 Bloco A", "numero": "123", "complemento": "Sala 101"}'::jsonb,
      'Brasília',
      'DF',
      '70000-000',
      '(61) 3333-3333'
    );
  END IF;
END
$;

-- 12. Comentários para documentação
COMMENT ON TABLE public.locais_atendimento IS 'Tabela para armazenar os locais de atendimento dos médicos';
COMMENT ON FUNCTION public.get_specialties() IS 'Retorna lista de especialidades médicas disponíveis';
COMMENT ON FUNCTION public.get_available_states() IS 'Retorna estados onde há médicos cadastrados';
COMMENT ON FUNCTION public.get_available_cities(TEXT) IS 'Retorna cidades disponíveis em um estado específico';
COMMENT ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) IS 'Busca médicos por especialidade e localização';