-- ========================================
-- SISTEMA DE AGENDAMENTO COMPLETO - SEM RLS (PARA TESTES)
-- Integração completa entre médicos e pacientes
-- ========================================

-- 1. LIMPAR E RECRIAR ESTRUTURA
DROP TABLE IF EXISTS consultas CASCADE;
DROP TABLE IF EXISTS horarios_disponibilidade CASCADE;
DROP TABLE IF EXISTS locais_atendimento CASCADE;
DROP TABLE IF EXISTS medicos CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;

-- 2. TABELA DE MÉDICOS COMPLETA
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    crm VARCHAR(20) NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    bio_perfil TEXT,
    foto_perfil_url VARCHAR(500),
    
    -- Valores e configurações
    valor_consulta_presencial DECIMAL(10,2),
    valor_consulta_teleconsulta DECIMAL(10,2),
    duracao_consulta_padrao INTEGER DEFAULT 30, -- minutos
    duracao_consulta_inicial INTEGER DEFAULT 60, -- primeira consulta
    duracao_teleconsulta INTEGER DEFAULT 30,
    
    -- Tipos de atendimento
    aceita_teleconsulta BOOLEAN DEFAULT true,
    aceita_consulta_presencial BOOLEAN DEFAULT true,
    
    -- Avaliações
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(crm, uf_crm)
);

-- 3. TABELA DE PACIENTES COMPLETA
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE NOT NULL,
    genero VARCHAR(20),
    telefone VARCHAR(20),
    
    -- Endereço
    endereco TEXT,
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    
    -- Responsável (para menores)
    responsavel_id UUID REFERENCES pacientes(id),
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LOCAIS DE ATENDIMENTO
CREATE TABLE locais_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10),
    telefone VARCHAR(20),
    
    -- Coordenadas para busca por proximidade
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HORÁRIOS DE DISPONIBILIDADE
CREATE TABLE horarios_disponibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    local_id UUID REFERENCES locais_atendimento(id), -- NULL = teleconsulta
    
    -- Dia da semana (0=domingo, 6=sábado)
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    
    -- Horários
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    
    -- Tipo de consulta
    tipo_consulta VARCHAR(20) NOT NULL CHECK (tipo_consulta IN ('presencial', 'teleconsulta')),
    
    -- Intervalo entre consultas (minutos)
    intervalo_consultas INTEGER DEFAULT 30,
    
    -- Período de validade
    data_inicio DATE,
    data_fim DATE,
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONSULTAS/AGENDAMENTOS
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    local_id UUID REFERENCES locais_atendimento(id), -- NULL = teleconsulta
    
    -- Agendamento
    data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_inicio_real TIMESTAMP WITH TIME ZONE,
    data_hora_fim_real TIMESTAMP WITH TIME ZONE,
    
    -- Duração
    duracao_estimada INTEGER NOT NULL, -- minutos
    duracao_real INTEGER,
    
    -- Tipo e prioridade
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('presencial', 'teleconsulta')),
    prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'emergencia')),
    
    -- Status
    status VARCHAR(30) DEFAULT 'agendada' CHECK (status IN (
        'agendada', 'confirmada', 'em_andamento', 'realizada', 
        'cancelada', 'nao_compareceu', 'reagendada'
    )),
    
    -- Teleconsulta
    link_sala_virtual VARCHAR(500),
    
    -- Financeiro
    valor_consulta DECIMAL(10,2),
    pagamento_confirmado BOOLEAN DEFAULT false,
    
    -- Informações clínicas
    motivo_consulta TEXT,
    observacoes_paciente TEXT,
    observacoes_medico TEXT,
    
    -- Controle de reagendamento
    permite_reagendamento BOOLEAN DEFAULT true,
    reagendamento_limite TIMESTAMP WITH TIME ZONE,
    
    -- Quem agendou
    agendado_por UUID NOT NULL REFERENCES profiles(id),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_medicos_user_id ON medicos(user_id);
CREATE INDEX idx_medicos_especialidade ON medicos(especialidade);
CREATE INDEX idx_medicos_cidade_estado ON medicos USING gin(to_tsvector('portuguese', cidade || ' ' || estado));

CREATE INDEX idx_pacientes_user_id ON pacientes(user_id);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);

CREATE INDEX idx_locais_medico_id ON locais_atendimento(medico_id);
CREATE INDEX idx_locais_cidade_estado ON locais_atendimento(cidade, estado);
CREATE INDEX idx_locais_coordenadas ON locais_atendimento(latitude, longitude);

CREATE INDEX idx_horarios_medico_dia ON horarios_disponibilidade(medico_id, dia_semana);
CREATE INDEX idx_horarios_tipo ON horarios_disponibilidade(tipo_consulta);

CREATE INDEX idx_consultas_medico_data ON consultas(medico_id, data_hora_agendada);
CREATE INDEX idx_consultas_paciente_data ON consultas(paciente_id, data_hora_agendada);
CREATE INDEX idx_consultas_status ON consultas(status);
CREATE INDEX idx_consultas_data_hora ON consultas(data_hora_agendada);

-- 8. FUNÇÕES AUXILIARES
CREATE OR REPLACE FUNCTION get_available_slots(
    p_medico_id UUID,
    p_data_inicio DATE,
    p_data_fim DATE,
    p_tipo_consulta VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    data_hora TIMESTAMP WITH TIME ZONE,
    duracao_disponivel INTEGER,
    local_id UUID,
    tipo VARCHAR,
    valor DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH horarios_expandidos AS (
        SELECT 
            h.medico_id,
            h.local_id,
            h.tipo_consulta,
            h.hora_inicio,
            h.hora_fim,
            h.intervalo_consultas,
            d.data_completa::DATE as data_consulta
        FROM horarios_disponibilidade h
        CROSS JOIN generate_series(p_data_inicio, p_data_fim, '1 day'::interval) d(data_completa)
        WHERE h.medico_id = p_medico_id
        AND h.ativo = true
        AND EXTRACT(DOW FROM d.data_completa) = h.dia_semana
        AND (p_tipo_consulta IS NULL OR h.tipo_consulta = p_tipo_consulta)
        AND (h.data_inicio IS NULL OR d.data_completa >= h.data_inicio)
        AND (h.data_fim IS NULL OR d.data_completa <= h.data_fim)
    ),
    slots_possiveis AS (
        SELECT 
            he.*,
            (he.data_consulta + he.hora_inicio)::TIMESTAMP WITH TIME ZONE as slot_inicio,
            he.intervalo_consultas as duracao
        FROM horarios_expandidos he
    )
    SELECT 
        sp.slot_inicio,
        sp.duracao,
        sp.local_id,
        sp.tipo_consulta::VARCHAR,
        CASE 
            WHEN sp.tipo_consulta = 'presencial' THEN m.valor_consulta_presencial
            ELSE m.valor_consulta_teleconsulta
        END
    FROM slots_possiveis sp
    JOIN medicos m ON m.id = sp.medico_id
    WHERE NOT EXISTS (
        SELECT 1 FROM consultas c
        WHERE c.medico_id = sp.medico_id
        AND c.status NOT IN ('cancelada', 'nao_compareceu')
        AND c.data_hora_agendada = sp.slot_inicio
    )
    AND sp.slot_inicio > NOW()
    ORDER BY sp.slot_inicio;
END;
$$ LANGUAGE plpgsql;

-- 9. DADOS DE EXEMPLO PARA TESTE
INSERT INTO medicos (user_id, crm, uf_crm, especialidade, nome, email, telefone, valor_consulta_presencial, valor_consulta_teleconsulta) VALUES
('11111111-1111-1111-1111-111111111111', 'CRM12345', 'SP', 'Cardiologia', 'Dr. João Silva', 'joao@teste.com', '(11) 99999-1111', 200.00, 150.00),
('22222222-2222-2222-2222-222222222222', 'CRM67890', 'RJ', 'Dermatologia', 'Dra. Maria Santos', 'maria@teste.com', '(21) 99999-2222', 180.00, 130.00),
('33333333-3333-3333-3333-333333333333', 'CRM11111', 'SP', 'Pediatria', 'Dr. Carlos Lima', 'carlos@teste.com', '(11) 99999-3333', 160.00, 120.00);

INSERT INTO pacientes (user_id, nome, email, cpf, data_nascimento, telefone, cidade, estado) VALUES
('44444444-4444-4444-4444-444444444444', 'Ana Costa', 'ana@teste.com', '123.456.789-01', '1990-05-15', '(11) 99999-4444', 'São Paulo', 'SP'),
('55555555-5555-5555-5555-555555555555', 'Pedro Oliveira', 'pedro@teste.com', '987.654.321-09', '1985-08-22', '(21) 99999-5555', 'Rio de Janeiro', 'RJ');

INSERT INTO locais_atendimento (medico_id, nome, endereco, cidade, estado, cep) VALUES
((SELECT id FROM medicos WHERE crm = 'CRM12345'), 'Clínica Cardio SP', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567'),
((SELECT id FROM medicos WHERE crm = 'CRM67890'), 'Consultório Derma RJ', 'Av. Copacabana, 456', 'Rio de Janeiro', 'RJ', '22070-001');

-- Horários de disponibilidade (Segunda a Sexta, 8h às 17h)
INSERT INTO horarios_disponibilidade (medico_id, local_id, dia_semana, hora_inicio, hora_fim, tipo_consulta, intervalo_consultas)
SELECT 
    m.id,
    l.id,
    dia,
    '08:00'::TIME,
    '17:00'::TIME,
    'presencial',
    30
FROM medicos m
JOIN locais_atendimento l ON l.medico_id = m.id
CROSS JOIN generate_series(1, 5) dia; -- Segunda a Sexta

-- Teleconsultas (Segunda a Sábado, 7h às 20h)
INSERT INTO horarios_disponibilidade (medico_id, local_id, dia_semana, hora_inicio, hora_fim, tipo_consulta, intervalo_consultas)
SELECT 
    m.id,
    NULL, -- teleconsulta
    dia,
    '07:00'::TIME,
    '20:00'::TIME,
    'teleconsulta',
    30
FROM medicos m
CROSS JOIN generate_series(1, 6) dia; -- Segunda a Sábado

-- ✅ BANCO CONFIGURADO SEM RLS PARA TESTES
SELECT 'Banco de dados configurado com sucesso!' as status;