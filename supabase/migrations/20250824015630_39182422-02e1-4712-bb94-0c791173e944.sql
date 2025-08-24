-- CORREÇÃO CRÍTICA DO SISTEMA DE AGENDAMENTO
-- Etapa 1: Corrigir dados dos médicos existentes

-- Adicionar especialidades aos médicos que não têm
UPDATE public.medicos 
SET especialidades = CASE 
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%cardio%' OR display_name ILIKE '%coração%'
  ) THEN '["Cardiologia"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%neuro%' OR display_name ILIKE '%cérebro%'
  ) THEN '["Neurologia"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%dermato%' OR display_name ILIKE '%pele%'
  ) THEN '["Dermatologia"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%ortop%' OR display_name ILIKE '%osso%'
  ) THEN '["Ortopedia"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%gineco%' OR display_name ILIKE '%obstetr%'
  ) THEN '["Ginecologia"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%pediatr%' OR display_name ILIKE '%criança%'
  ) THEN '["Pediatria"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%psiq%' OR display_name ILIKE '%mental%'
  ) THEN '["Psiquiatria"]'::jsonb
  WHEN user_id IN (
    SELECT id FROM public.profiles 
    WHERE display_name ILIKE '%oftalmo%' OR display_name ILIKE '%olho%'
  ) THEN '["Oftalmologia"]'::jsonb
  ELSE '["Clínica Geral"]'::jsonb
END
WHERE especialidades = '[]'::jsonb OR especialidades IS NULL;

-- Inserir médicos de exemplo se não existirem
INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
SELECT 
  gen_random_uuid(),
  'dr.cardiologia@agendarbrasil.com',
  'Dr. João Silva - Cardiologista',
  'medico',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_type = 'medico' 
  AND display_name ILIKE '%cardiol%'
);

INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
SELECT 
  gen_random_uuid(),
  'dra.pediatria@agendarbrasil.com',
  'Dra. Maria Santos - Pediatra',
  'medico',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_type = 'medico' 
  AND display_name ILIKE '%pediatr%'
);

-- Inserir dados médicos correspondentes
INSERT INTO public.medicos (user_id, crm, telefone, especialidades, dados_profissionais, configuracoes)
SELECT 
  p.id,
  'CRM-' || LPAD((RANDOM() * 99999)::integer::text, 5, '0'),
  '(11) 9' || LPAD((RANDOM() * 99999999)::integer::text, 8, '0'),
  CASE 
    WHEN p.display_name ILIKE '%cardiol%' THEN '["Cardiologia"]'::jsonb
    WHEN p.display_name ILIKE '%pediatr%' THEN '["Pediatria"]'::jsonb
    ELSE '["Clínica Geral"]'::jsonb
  END,
  jsonb_build_object(
    'formacao', 'Medicina',
    'instituicao', 'Universidade Federal',
    'ano_formacao', 2015,
    'residencia', 'Hospital das Clínicas'
  ),
  jsonb_build_object(
    'aceita_convenio', true,
    'valor_consulta', 200,
    'tempo_consulta', 30,
    'antecedencia_agendamento', 24
  )
FROM public.profiles p
WHERE p.user_type = 'medico' 
AND p.id NOT IN (SELECT user_id FROM public.medicos)
LIMIT 10;

-- Inserir locais de atendimento para médicos
INSERT INTO public.locais_atendimento (
  medico_id, 
  nome_local, 
  endereco, 
  cidade, 
  estado, 
  cep,
  telefone,
  ativo,
  status
)
SELECT 
  m.user_id,
  'Clínica ' || SPLIT_PART(p.display_name, ' ', 2) || ' ' || SPLIT_PART(p.display_name, ' ', 3),
  jsonb_build_object(
    'logradouro', 'Rua das Flores, 123',
    'numero', '123',
    'bairro', 'Centro',
    'cidade', 'São Paulo',
    'uf', 'SP',
    'cep', '01310-100'
  ),
  'São Paulo',
  'SP',
  '01310-100',
  '(11) 3000-' || LPAD((RANDOM() * 9999)::integer::text, 4, '0'),
  true,
  'ativo'
FROM public.medicos m
JOIN public.profiles p ON p.id = m.user_id
WHERE m.user_id NOT IN (
  SELECT DISTINCT medico_id FROM public.locais_atendimento WHERE medico_id IS NOT NULL
)
LIMIT 5;

-- Inserir mais locais em Belo Horizonte para ter diversidade
INSERT INTO public.locais_atendimento (
  medico_id, 
  nome_local, 
  endereco, 
  cidade, 
  estado, 
  cep,
  telefone,
  ativo,
  status
)
SELECT 
  m.user_id,
  'Consultório ' || SPLIT_PART(p.display_name, ' ', 2) || ' - BH',
  jsonb_build_object(
    'logradouro', 'Av. Afonso Pena, 567',
    'numero', '567',
    'bairro', 'Centro',
    'cidade', 'Belo Horizonte',
    'uf', 'MG',
    'cep', '30130-002'
  ),
  'Belo Horizonte',
  'MG',
  '30130-002',
  '(31) 3200-' || LPAD((RANDOM() * 9999)::integer::text, 4, '0'),
  true,
  'ativo'
FROM public.medicos m
JOIN public.profiles p ON p.id = m.user_id
WHERE m.user_id IN (
  SELECT user_id FROM public.medicos 
  WHERE especialidades @> '["Cardiologia"]'::jsonb 
  OR especialidades @> '["Pediatria"]'::jsonb
  OR especialidades @> '["Clínica Geral"]'::jsonb
)
AND m.user_id NOT IN (
  SELECT medico_id FROM public.locais_atendimento 
  WHERE cidade = 'Belo Horizonte' AND medico_id IS NOT NULL
)
LIMIT 3;