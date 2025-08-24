-- CORREÇÃO CRÍTICA DO SISTEMA DE AGENDAMENTO - ETAPA 2
-- Correção segura dos dados

-- Primeiro, vamos garantir que temos dados médicos básicos
-- Inserir médicos de exemplo se necessário
DO $$
DECLARE
    medico_id uuid;
    profile_id uuid;
BEGIN
    -- Verificar se precisamos de médicos
    IF (SELECT COUNT(*) FROM public.medicos) < 3 THEN
        -- Inserir perfil de cardiologista
        INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
        VALUES (gen_random_uuid(), 'dr.joao.cardiologia@agendarbrasil.com', 'Dr. João Silva - Cardiologista', 'medico', true)
        RETURNING id INTO profile_id;
        
        INSERT INTO public.medicos (user_id, crm, telefone, especialidades, dados_profissionais, configuracoes)
        VALUES (profile_id, 'CRM-12345', '(11) 99999-1234', '["Cardiologia"]'::jsonb, 
                '{"formacao": "Medicina", "instituicao": "USP"}'::jsonb,
                '{"aceita_convenio": true, "valor_consulta": 250}'::jsonb);
        
        -- Inserir local para este médico
        INSERT INTO public.locais_atendimento (
            medico_id, nome_local, endereco, cidade, estado, cep, telefone, ativo, status
        ) VALUES (
            profile_id, 
            'Clínica Cardiológica Dr. João',
            '{"logradouro": "Av. Paulista, 1000", "numero": "1000", "bairro": "Bela Vista", "cidade": "São Paulo", "uf": "SP", "cep": "01310-100"}'::jsonb,
            'São Paulo', 'SP', '01310-100', '(11) 3000-1234', true, 'ativo'
        );
        
        -- Inserir perfil de pediatra
        INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
        VALUES (gen_random_uuid(), 'dra.maria.pediatria@agendarbrasil.com', 'Dra. Maria Santos - Pediatra', 'medico', true)
        RETURNING id INTO profile_id;
        
        INSERT INTO public.medicos (user_id, crm, telefone, especialidades, dados_profissionais, configuracoes)
        VALUES (profile_id, 'CRM-67890', '(11) 99999-5678', '["Pediatria"]'::jsonb,
                '{"formacao": "Medicina", "instituicao": "UNIFESP"}'::jsonb,
                '{"aceita_convenio": true, "valor_consulta": 200}'::jsonb);
        
        -- Inserir local para este médico
        INSERT INTO public.locais_atendimento (
            medico_id, nome_local, endereco, cidade, estado, cep, telefone, ativo, status
        ) VALUES (
            profile_id,
            'Clínica Pediátrica Dra. Maria',
            '{"logradouro": "Rua Augusta, 500", "numero": "500", "bairro": "Consolação", "cidade": "São Paulo", "uf": "SP", "cep": "01305-000"}'::jsonb,
            'São Paulo', 'SP', '01305-000', '(11) 3000-5678', true, 'ativo'
        );
        
        -- Inserir perfil de clínico geral em BH
        INSERT INTO public.profiles (id, email, display_name, user_type, is_active)
        VALUES (gen_random_uuid(), 'dr.carlos.clinica@agendarbrasil.com', 'Dr. Carlos Oliveira - Clínico Geral', 'medico', true)
        RETURNING id INTO profile_id;
        
        INSERT INTO public.medicos (user_id, crm, telefone, especialidades, dados_profissionais, configuracoes)
        VALUES (profile_id, 'CRM-11111', '(31) 99999-1111', '["Clínica Geral"]'::jsonb,
                '{"formacao": "Medicina", "instituicao": "UFMG"}'::jsonb,
                '{"aceita_convenio": true, "valor_consulta": 180}'::jsonb);
        
        -- Inserir local para este médico em BH
        INSERT INTO public.locais_atendimento (
            medico_id, nome_local, endereco, cidade, estado, cep, telefone, ativo, status
        ) VALUES (
            profile_id,
            'Consultório Dr. Carlos - Centro',
            '{"logradouro": "Av. Afonso Pena, 1000", "numero": "1000", "bairro": "Centro", "cidade": "Belo Horizonte", "uf": "MG", "cep": "30130-002"}'::jsonb,
            'Belo Horizonte', 'MG', '30130-002', '(31) 3200-1111', true, 'ativo'
        );
    END IF;
END $$;

-- Atualizar médicos existentes que não têm especialidades
UPDATE public.medicos 
SET especialidades = '["Clínica Geral"]'::jsonb
WHERE especialidades = '[]'::jsonb OR especialidades IS NULL;

-- Verificar se as especialidades existem na tabela
INSERT INTO public.especialidades_medicas (nome, ativa) 
VALUES 
    ('Cardiologia', true),
    ('Pediatria', true),
    ('Clínica Geral', true),
    ('Dermatologia', true),
    ('Neurologia', true),
    ('Ortopedia', true),
    ('Ginecologia', true),
    ('Psiquiatria', true),
    ('Oftalmologia', true)
ON CONFLICT (nome) DO NOTHING;