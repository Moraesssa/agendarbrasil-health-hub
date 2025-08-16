-- Script para corrigir políticas RLS e dados dos médicos
-- Execute este script no Supabase SQL Editor

-- 1. PRIMEIRO: Verificar dados existentes
SELECT 'Verificando dados existentes...' as status;

SELECT 
    'medicos' as tabela, 
    COUNT(*) as total,
    COUNT(CASE WHEN especialidades IS NOT NULL THEN 1 END) as com_especialidades
FROM public.medicos;

SELECT 
    'locais_atendimento' as tabela, 
    COUNT(*) as total,
    COUNT(CASE WHEN cidade IS NOT NULL THEN 1 END) as com_cidade
FROM public.locais_atendimento;

-- 2. VERIFICAR POLÍTICAS RLS ATUAIS
SELECT 'Políticas RLS atuais...' as status;

SELECT 
    tablename,
    policyname,
    cmd as operacao,
    roles,
    qual as condicao
FROM pg_policies 
WHERE tablename IN ('medicos', 'locais_atendimento')
ORDER BY tablename, policyname;

-- 3. REMOVER POLÍTICAS RESTRITIVAS E CRIAR POLÍTICAS PÚBLICAS
SELECT 'Corrigindo políticas RLS...' as status;

-- Remover políticas existentes para médicos
DROP POLICY IF EXISTS "medicos_select_policy" ON public.medicos;
DROP POLICY IF EXISTS "medicos_public_read" ON public.medicos;
DROP POLICY IF EXISTS "medicos_authenticated_read" ON public.medicos;

-- Remover políticas existentes para locais_atendimento
DROP POLICY IF EXISTS "locais_select_policy" ON public.locais_atendimento;
DROP POLICY IF EXISTS "locais_public_read" ON public.locais_atendimento;
DROP POLICY IF EXISTS "locais_authenticated_read" ON public.locais_atendimento;

-- Criar política pública para leitura de médicos (dados básicos)
CREATE POLICY "medicos_public_select" ON public.medicos
    FOR SELECT
    TO public
    USING (true);

-- Criar política pública para leitura de locais de atendimento
CREATE POLICY "locais_public_select" ON public.locais_atendimento
    FOR SELECT
    TO public
    USING (true);

-- 4. INSERIR DADOS DE TESTE SE NÃO EXISTIREM
SELECT 'Inserindo dados de teste...' as status;

-- Inserir médicos de teste se a tabela estiver vazia
INSERT INTO public.medicos (
    user_id,
    crm,
    especialidades,
    configuracoes,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    '12345-' || estado,
    ARRAY[especialidade],
    jsonb_build_object(
        'aceita_consultas_online', true,
        'valor_consulta', 150.00,
        'tempo_consulta', 30
    ),
    now(),
    now()
FROM (
    VALUES 
        ('Cardiologia', 'DF'),
        ('Dermatologia', 'DF'),
        ('Pediatria', 'DF'),
        ('Ginecologia', 'SP'),
        ('Ortopedia', 'MG'),
        ('Neurologia', 'DF'),
        ('Psiquiatria', 'SP'),
        ('Anestesiologia', 'DF')
) AS dados(especialidade, estado)
WHERE NOT EXISTS (SELECT 1 FROM public.medicos LIMIT 1);

-- Inserir locais de atendimento para os médicos
INSERT INTO public.locais_atendimento (
    medico_id,
    nome_local,
    endereco,
    cidade,
    estado,
    cep,
    telefone,
    created_at,
    updated_at
)
SELECT 
    m.user_id,
    'Clínica ' || m.especialidades[1],
    'Rua das Flores, 123',
    CASE 
        WHEN m.crm LIKE '%-DF' THEN 'Brasília'
        WHEN m.crm LIKE '%-SP' THEN 'São Paulo'
        WHEN m.crm LIKE '%-MG' THEN 'Belo Horizonte'
        ELSE 'Brasília'
    END,
    CASE 
        WHEN m.crm LIKE '%-DF' THEN 'DF'
        WHEN m.crm LIKE '%-SP' THEN 'SP'
        WHEN m.crm LIKE '%-MG' THEN 'MG'
        ELSE 'DF'
    END,
    '70000-000',
    '(61) 99999-9999',
    now(),
    now()
FROM public.medicos m
WHERE NOT EXISTS (
    SELECT 1 FROM public.locais_atendimento la 
    WHERE la.medico_id = m.user_id
);

-- Inserir profiles para os médicos se não existirem
INSERT INTO public.profiles (
    id,
    display_name,
    user_type,
    created_at,
    updated_at
)
SELECT 
    m.user_id,
    'Dr. ' || 
    CASE m.especialidades[1]
        WHEN 'Cardiologia' THEN 'João Silva'
        WHEN 'Dermatologia' THEN 'Maria Santos'
        WHEN 'Pediatria' THEN 'Ana Costa'
        WHEN 'Ginecologia' THEN 'Carla Lima'
        WHEN 'Ortopedia' THEN 'Pedro Oliveira'
        WHEN 'Neurologia' THEN 'Lucas Ferreira'
        WHEN 'Psiquiatria' THEN 'Sofia Rodrigues'
        WHEN 'Anestesiologia' THEN 'Rafael Almeida'
        ELSE 'Médico Especialista'
    END,
    'medico',
    now(),
    now()
FROM public.medicos m
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = m.user_id
);

-- 5. VERIFICAR RESULTADO FINAL
SELECT 'Verificação final...' as status;

-- Contar registros inseridos
SELECT 
    'medicos' as tabela, 
    COUNT(*) as total,
    array_agg(DISTINCT especialidades[1]) as especialidades_disponiveis
FROM public.medicos;

SELECT 
    'locais_atendimento' as tabela, 
    COUNT(*) as total,
    array_agg(DISTINCT cidade) as cidades_disponiveis
FROM public.locais_atendimento;

-- Testar a função que está falhando
SELECT 'Testando função get_doctors_by_location_and_specialty...' as status;

SELECT * FROM get_doctors_by_location_and_specialty(
    'Cardiologia',
    'Brasília', 
    'DF'
);

-- 6. VERIFICAR SE AS POLÍTICAS ESTÃO ATIVAS
SELECT 'Políticas RLS após correção...' as status;

SELECT 
    tablename,
    policyname,
    cmd as operacao,
    roles
FROM pg_policies 
WHERE tablename IN ('medicos', 'locais_atendimento')
ORDER BY tablename, policyname;

SELECT 'Script executado com sucesso! ✅' as resultado;