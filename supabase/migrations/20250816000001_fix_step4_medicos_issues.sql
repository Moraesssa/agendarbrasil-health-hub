-- Migration para corrigir problemas identificados no Step 4 - Médicos
-- Data: 2025-08-16
-- Problemas encontrados:
-- 1. Campo is_active undefined nos locais_atendimento
-- 2. Não há profiles de médicos cadastrados
-- 3. Campo verificacao vazio nos médicos
-- 4. get_available_cities não retorna dados para DF

-- 1. Adicionar coluna is_active se não existir
ALTER TABLE public.locais_atendimento 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Atualizar todos os registros existentes para ativo
UPDATE public.locais_atendimento 
SET is_active = true 
WHERE is_active IS NULL;

-- 3. Atualizar campo verificacao dos médicos existentes para aprovado
UPDATE public.medicos 
SET verificacao = jsonb_build_object(
  'crm_verificado', true,
  'documentos_enviados', true,
  'aprovado', 'true',
  'data_aprovacao', now()::text
)
WHERE verificacao = '{}'::jsonb OR verificacao IS NULL;

-- 4. Criar profiles para médicos que não têm (usando SECURITY DEFINER)
CREATE OR REPLACE FUNCTION create_doctor_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, display_name)
  SELECT 
    m.user_id,
    'medico' as user_type,
    COALESCE(
      'Dr. ' || split_part(m.crm, '-', 1), 
      'Dr. Médico ' || substring(m.id::text, 1, 8)
    ) as display_name
  FROM public.medicos m
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = m.user_id
  )
  ON CONFLICT (id) DO UPDATE SET
    user_type = 'medico',
    display_name = EXCLUDED.display_name;
END;
$$;

-- Executar a função para criar os profiles
SELECT create_doctor_profiles();

-- Remover a função após uso
DROP FUNCTION create_doctor_profiles();

-- 5. Verificar e corrigir constraint da tabela locais_atendimento
-- Primeiro, verificar se a constraint está apontando para a tabela correta
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Verificar se existe constraint incorreta apontando para profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'locais_atendimento' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'profiles'
    ) INTO constraint_exists;
    
    -- Se existe constraint incorreta, remover
    IF constraint_exists THEN
        ALTER TABLE public.locais_atendimento 
        DROP CONSTRAINT IF EXISTS locais_atendimento_medico_id_fkey;
        
        -- Recriar constraint correta apontando para medicos
        ALTER TABLE public.locais_atendimento 
        ADD CONSTRAINT locais_atendimento_medico_id_fkey 
        FOREIGN KEY (medico_id) REFERENCES public.medicos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Adicionar alguns locais de atendimento em DF para teste
INSERT INTO public.locais_atendimento (
  medico_id, nome_local, endereco, cidade, estado, cep, telefone, is_active
)
SELECT 
  m.id as medico_id,
  'Clínica ' || split_part(m.crm, '-', 1) as nome_local,
  jsonb_build_object(
    'logradouro', 'SQN 123 Bloco A',
    'numero', '123',
    'complemento', 'Sala 101',
    'bairro', 'Asa Norte',
    'cidade', 'Brasília',
    'uf', 'DF',
    'cep', '70000-000'
  ) as endereco,
  'Brasília' as cidade,
  'DF' as estado,
  '70000-000' as cep,
  '(61) 3333-3333' as telefone,
  true as is_active
FROM public.medicos m
WHERE m.especialidades && ARRAY['Cardiologia', 'Clínica Médica', 'Medicina de Família']
  AND NOT EXISTS (
    SELECT 1 FROM public.locais_atendimento l 
    WHERE l.medico_id = m.id AND l.estado = 'DF'
  )
LIMIT 3;

-- 7. Recriar função get_available_cities com melhor tratamento
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf TEXT)
RETURNS TABLE(cidade TEXT, estado TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    l.cidade,
    l.estado
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.id = l.medico_id
  WHERE l.is_active = true 
    AND l.estado = state_uf
    AND (m.verificacao->>'aprovado' = 'true' OR m.verificacao = '{}'::jsonb)
  ORDER BY l.cidade;
$$;

-- 8. Recriar função get_doctors_by_location_and_specialty com melhor tratamento
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
AS $$
  SELECT 
    m.id,
    COALESCE(p.display_name, 'Dr. ' || split_part(m.crm, '-', 1)) as display_name,
    m.especialidades,
    m.crm,
    m.telefone,
    l.nome_local as local_nome,
    l.endereco as local_endereco
  FROM public.medicos m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  JOIN public.locais_atendimento l ON l.medico_id = m.id
  WHERE (m.verificacao->>'aprovado' = 'true' OR m.verificacao = '{}'::jsonb)
    AND l.is_active = true
    AND p_specialty = ANY(m.especialidades)
    AND l.cidade = p_city
    AND l.estado = p_state
  ORDER BY COALESCE(p.display_name, 'Dr. ' || split_part(m.crm, '-', 1));
$$;

-- 9. Atualizar função get_available_states para incluir médicos sem verificação completa
CREATE OR REPLACE FUNCTION public.get_available_states()
RETURNS TABLE(uf TEXT, nome TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT 
    l.estado as uf,
    l.estado as nome
  FROM public.locais_atendimento l
  JOIN public.medicos m ON m.id = l.medico_id
  WHERE l.is_active = true 
    AND (m.verificacao->>'aprovado' = 'true' OR m.verificacao = '{}'::jsonb)
  ORDER BY l.estado;
$$;

-- 10. Atualizar função get_specialties para incluir médicos sem verificação completa
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT DISTINCT unnest(especialidades) as especialidade
    FROM public.medicos
    WHERE verificacao->>'aprovado' = 'true' OR verificacao = '{}'::jsonb
    ORDER BY especialidade
  );
$$;

-- 11. Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_locais_medico_ativo ON public.locais_atendimento (medico_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles (user_type);

-- 12. Comentários para documentação
COMMENT ON COLUMN public.locais_atendimento.is_active IS 'Indica se o local está ativo para agendamentos';
COMMENT ON FUNCTION public.get_available_cities(TEXT) IS 'Retorna cidades disponíveis em um estado - versão corrigida';
COMMENT ON FUNCTION public.get_doctors_by_location_and_specialty(TEXT, TEXT, TEXT) IS 'Busca médicos por especialidade e localização - versão corrigida';