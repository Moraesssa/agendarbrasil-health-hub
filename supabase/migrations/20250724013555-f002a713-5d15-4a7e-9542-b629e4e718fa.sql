-- Adicionar especialidade de Telemedicina
INSERT INTO public.especialidades_medicas (nome, codigo, descricao, ativa) 
VALUES ('Telemedicina', 'TELEMED', 'Consultas online e atendimento remoto', true)
ON CONFLICT (nome) DO NOTHING;