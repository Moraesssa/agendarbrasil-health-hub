-- ========================================
-- SCRIPT PARA APLICAR O SCHEMA OTIMIZADO
-- Execute este script no Supabase SQL Editor
-- ========================================

-- ATENÇÃO: Este script irá recriar as tabelas
-- Faça backup dos dados importantes antes de executar

-- 1. Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultas DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "usuarios_policy" ON usuarios;
DROP POLICY IF EXISTS "medicos_policy" ON medicos;
DROP POLICY IF EXISTS "pacientes_policy" ON pacientes;
DROP POLICY IF EXISTS "consultas_policy" ON consultas;

-- 3. Aplicar o novo schema
-- (O conteúdo do enhanced_scheduling_schema.sql será aplicado aqui)

-- Primeiro, vamos fazer backup das tabelas existentes se elas existirem
DO $$
BEGIN
    -- Backup da tabela usuarios se existir
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;
    END IF;
    
    -- Backup da tabela consultas se existir  
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultas') THEN
        CREATE TABLE consultas_backup AS SELECT * FROM consultas;
    END IF;
END $$;

-- 4. Executar o schema otimizado
-- (Incluir aqui o conteúdo do enhanced_scheduling_schema.sql)

-- ========= TIPOS ENUMERADOS =========

DO $$ BEGIN
    CREATE TYPE tipo_usuario AS ENUM ('paciente', 'medico', 'admin', 'familiar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_consulta AS ENUM ('presencial', 'teleconsulta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_consulta AS ENUM ('agendada', 'confirmada', 'em_andamento', 'realizada', 'cancelada', 'nao_compareceu', 'reagendada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prioridade_consulta AS ENUM ('baixa', 'normal', 'alta', 'emergencia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_documento AS ENUM ('prescricao', 'atestado', 'pedido_exame', 'relatorio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_agenda AS ENUM ('disponivel', 'ocupado', 'pausa', 'indisponivel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_notificacao AS ENUM ('lembrete', 'confirmacao', 'cancelamento', 'emergencia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========= RECRIAR TABELAS PRINCIPAIS =========

-- Usuários base (manter compatibilidade com auth.users do Supabase)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    tipo tipo_usuario NOT NULL DEFAULT 'paciente',
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    foto_perfil_url VARCHAR(500)
);

-- Médicos com configurações de agenda
CREATE TABLE IF NOT EXISTS medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    crm VARCHAR(20) NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    bio_perfil TEXT,
    valor_consulta_presencial NUMERIC(10, 2),
    valor_consulta_teleconsulta NUMERIC(10, 2),
    duracao_consulta_padrao INTEGER DEFAULT 30,
    duracao_consulta_inicial INTEGER DEFAULT 45,
    duracao_teleconsulta INTEGER DEFAULT 25,
    aceita_teleconsulta BOOLEAN DEFAULT true,
    aceita_consulta_presencial BOOLEAN DEFAULT true,
    chave_assinatura_digital TEXT,
    rating NUMERIC(3, 2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    UNIQUE(crm, uf_crm)
);

-- Locais de atendimento
CREATE TABLE IF NOT EXISTS locais_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    coordenadas_lat NUMERIC(10, 8),
    coordenadas_lng NUMERIC(11, 8)
);

-- Horários de funcionamento
CREATE TABLE IF NOT EXISTS horarios_funcionamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    local_id UUID REFERENCES locais_atendimento(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT true,
    tipo_consulta tipo_consulta,
    UNIQUE(medico_id, local_id, dia_semana, hora_inicio, tipo_consulta)
);

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_nascimento DATE NOT NULL,
    genero VARCHAR(50),
    endereco TEXT,
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    responsavel_id UUID REFERENCES usuarios(id),
    plano_saude VARCHAR(100),
    numero_carteirinha VARCHAR(50),
    alergias TEXT,
    medicamentos_uso TEXT,
    condicoes_medicas TEXT
);

-- Consultas com sistema inteligente
CREATE TABLE IF NOT EXISTS consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    local_id UUID REFERENCES locais_atendimento(id),
    
    -- Agendamento
    data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_inicio_real TIMESTAMP WITH TIME ZONE,
    data_hora_fim_real TIMESTAMP WITH TIME ZONE,
    duracao_estimada INTEGER NOT NULL,
    duracao_real INTEGER,
    
    -- Configurações
    tipo tipo_consulta NOT NULL,
    prioridade prioridade_consulta DEFAULT 'normal',
    status status_consulta NOT NULL DEFAULT 'agendada',
    
    -- Teleconsulta
    link_sala_virtual VARCHAR(500),
    senha_sala VARCHAR(50),
    
    -- Financeiro
    valor_consulta NUMERIC(10, 2),
    pagamento_id VARCHAR(255),
    pagamento_status VARCHAR(50),
    
    -- Observações
    motivo_consulta TEXT,
    observacoes_paciente TEXT,
    observacoes_medico TEXT,
    
    -- Agendamento inteligente
    buffer_antes INTEGER DEFAULT 5,
    buffer_depois INTEGER DEFAULT 5,
    permite_reagendamento BOOLEAN DEFAULT true,
    
    -- Auditoria
    agendado_por UUID REFERENCES usuarios(id),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========= ÍNDICES PARA PERFORMANCE =========

-- Usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- Médicos
CREATE INDEX IF NOT EXISTS idx_medicos_usuario_id ON medicos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_medicos_especialidade ON medicos(especialidade);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON medicos(crm, uf_crm);

-- Consultas (crítico para performance)
CREATE INDEX IF NOT EXISTS idx_consultas_medico_id ON consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_hora ON consultas(data_hora_agendada);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_tipo ON consultas(tipo);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_data ON consultas(medico_id, data_hora_agendada);

-- ========= DADOS DE EXEMPLO PARA DESENVOLVIMENTO =========

-- Inserir usuários de exemplo
INSERT INTO usuarios (id, nome, email, cpf, tipo) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dr. Carlos Silva', 'carlos.silva@email.com', '123.456.789-01', 'medico'),
('550e8400-e29b-41d4-a716-446655440002', 'Dra. Ana Santos', 'ana.santos@email.com', '123.456.789-02', 'medico'),
('550e8400-e29b-41d4-a716-446655440003', 'Dr. Roberto Lima', 'roberto.lima@email.com', '123.456.789-03', 'medico'),
('550e8400-e29b-41d4-a716-446655440004', 'Maria Santos', 'maria.santos@email.com', '123.456.789-04', 'paciente'),
('550e8400-e29b-41d4-a716-446655440005', 'João Santos', 'joao.santos@email.com', '123.456.789-05', 'paciente')
ON CONFLICT (id) DO NOTHING;

-- Inserir médicos de exemplo
INSERT INTO medicos (id, usuario_id, crm, uf_crm, especialidade, valor_consulta_presencial, valor_consulta_teleconsulta) VALUES
('dr1', '550e8400-e29b-41d4-a716-446655440001', '12345', 'SP', 'Cardiologia', 200.00, 150.00),
('dr2', '550e8400-e29b-41d4-a716-446655440002', '67890', 'RJ', 'Pediatria', 180.00, 130.00),
('dr3', '550e8400-e29b-41d4-a716-446655440003', '11111', 'MG', 'Clínica Geral', 150.00, 100.00)
ON CONFLICT (id) DO NOTHING;

-- Inserir pacientes de exemplo
INSERT INTO pacientes (id, usuario_id, data_nascimento) VALUES
('p1', '550e8400-e29b-41d4-a716-446655440004', '1985-05-15'),
('p2', '550e8400-e29b-41d4-a716-446655440005', '1990-08-22')
ON CONFLICT (id) DO NOTHING;

-- Inserir locais de atendimento
INSERT INTO locais_atendimento (id, medico_id, nome, endereco, cidade, estado, cep) VALUES
('loc1', 'dr1', 'Clínica Coração', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567'),
('loc2', 'dr2', 'Centro Pediátrico', 'Av. Crianças, 456', 'Rio de Janeiro', 'RJ', '20000-000'),
('loc3', 'dr3', 'Consultório Saúde', 'Rua Bem-Estar, 789', 'Belo Horizonte', 'MG', '30000-000')
ON CONFLICT (id) DO NOTHING;

-- Inserir horários de funcionamento
INSERT INTO horarios_funcionamento (medico_id, local_id, dia_semana, hora_inicio, hora_fim) VALUES
('dr1', 'loc1', 1, '08:00', '17:00'), -- Segunda
('dr1', 'loc1', 2, '08:00', '17:00'), -- Terça
('dr1', 'loc1', 3, '08:00', '17:00'), -- Quarta
('dr1', 'loc1', 4, '08:00', '17:00'), -- Quinta
('dr1', 'loc1', 5, '08:00', '12:00'), -- Sexta
('dr2', 'loc2', 1, '09:00', '18:00'),
('dr2', 'loc2', 2, '09:00', '18:00'),
('dr2', 'loc2', 3, '09:00', '18:00'),
('dr2', 'loc2', 4, '09:00', '18:00'),
('dr3', 'loc3', 1, '07:00', '16:00'),
('dr3', 'loc3', 2, '07:00', '16:00'),
('dr3', 'loc3', 3, '07:00', '16:00'),
('dr3', 'loc3', 4, '07:00', '16:00'),
('dr3', 'loc3', 5, '07:00', '16:00')
ON CONFLICT DO NOTHING;

-- ========= CONFIGURAÇÕES FINAIS =========

-- Comentário para indicar que o schema foi aplicado
COMMENT ON SCHEMA public IS 'Schema otimizado para agendamento inteligente - Versão 2.0';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Schema otimizado aplicado com sucesso!';
    RAISE NOTICE 'RLS desabilitado para desenvolvimento.';
    RAISE NOTICE 'Dados de exemplo inseridos.';
END $$;