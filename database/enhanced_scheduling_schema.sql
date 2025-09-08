-- ========================================
-- SCHEMA OTIMIZADO PARA AGENDAMENTO INTELIGENTE
-- Versão: 2.0 - Sem RLS (Desenvolvimento)
-- ========================================

-- Limpar schema existente (CUIDADO: só usar em desenvolvimento)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ========= TIPOS ENUMERADOS =========

CREATE TYPE tipo_usuario AS ENUM ('paciente', 'medico', 'admin', 'familiar');
CREATE TYPE tipo_consulta AS ENUM ('presencial', 'teleconsulta');
CREATE TYPE status_consulta AS ENUM ('agendada', 'confirmada', 'em_andamento', 'realizada', 'cancelada', 'nao_compareceu', 'reagendada');
CREATE TYPE prioridade_consulta AS ENUM ('baixa', 'normal', 'alta', 'emergencia');
CREATE TYPE tipo_documento AS ENUM ('prescricao', 'atestado', 'pedido_exame', 'relatorio');
CREATE TYPE status_agenda AS ENUM ('disponivel', 'ocupado', 'pausa', 'indisponivel');
CREATE TYPE tipo_notificacao AS ENUM ('lembrete', 'confirmacao', 'cancelamento', 'emergencia');

-- ========= TABELAS PRINCIPAIS =========

-- Usuários base
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    tipo tipo_usuario NOT NULL,
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    foto_perfil_url VARCHAR(500)
);

-- Médicos com configurações de agenda
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    crm VARCHAR(20) NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    bio_perfil TEXT,
    valor_consulta_presencial NUMERIC(10, 2),
    valor_consulta_teleconsulta NUMERIC(10, 2),
    duracao_consulta_padrao INTEGER DEFAULT 30, -- minutos
    duracao_consulta_inicial INTEGER DEFAULT 45, -- minutos
    duracao_teleconsulta INTEGER DEFAULT 25, -- minutos
    aceita_teleconsulta BOOLEAN DEFAULT true,
    aceita_consulta_presencial BOOLEAN DEFAULT true,
    chave_assinatura_digital TEXT,
    rating NUMERIC(3, 2) DEFAULT 0.00,
    total_avaliacoes INTEGER DEFAULT 0,
    UNIQUE(crm, uf_crm)
);

-- Locais de atendimento
CREATE TABLE locais_atendimento (
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
CREATE TABLE horarios_funcionamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    local_id UUID REFERENCES locais_atendimento(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 6=sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT true,
    tipo_consulta tipo_consulta, -- NULL = ambos os tipos
    UNIQUE(medico_id, local_id, dia_semana, hora_inicio, tipo_consulta)
);

-- Bloqueios de agenda (férias, folgas, etc.)
CREATE TABLE bloqueios_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(255),
    recorrente BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true
);

-- Pacientes
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_nascimento DATE NOT NULL,
    genero VARCHAR(50),
    endereco TEXT,
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    responsavel_id UUID REFERENCES usuarios(id), -- Para menores de idade
    plano_saude VARCHAR(100),
    numero_carteirinha VARCHAR(50),
    alergias TEXT,
    medicamentos_uso TEXT,
    condicoes_medicas TEXT
);

-- Relacionamentos familiares
CREATE TABLE relacionamentos_familiares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    responsavel_id UUID NOT NULL REFERENCES usuarios(id),
    dependente_id UUID NOT NULL REFERENCES pacientes(id),
    tipo_relacionamento VARCHAR(50) NOT NULL, -- pai, mãe, tutor, etc.
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(responsavel_id, dependente_id)
);

-- Consultas com sistema inteligente
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    local_id UUID REFERENCES locais_atendimento(id),
    
    -- Agendamento
    data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_inicio_real TIMESTAMP WITH TIME ZONE,
    data_hora_fim_real TIMESTAMP WITH TIME ZONE,
    duracao_estimada INTEGER NOT NULL, -- minutos
    duracao_real INTEGER, -- minutos
    
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
    buffer_antes INTEGER DEFAULT 5, -- minutos
    buffer_depois INTEGER DEFAULT 5, -- minutos
    permite_reagendamento BOOLEAN DEFAULT true,
    
    -- Auditoria
    agendado_por UUID REFERENCES usuarios(id),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de reagendamentos
CREATE TABLE historico_reagendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID NOT NULL REFERENCES consultas(id),
    data_hora_anterior TIMESTAMP WITH TIME ZONE NOT NULL,
    data_hora_nova TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(255),
    reagendado_por UUID REFERENCES usuarios(id),
    data_reagendamento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preferências de agendamento
CREATE TABLE preferencias_agendamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medico_id UUID REFERENCES medicos(id),
    
    -- Preferências de horário
    preferencia_periodo VARCHAR(20), -- manha, tarde, noite
    dias_preferidos INTEGER[], -- array de dias da semana
    horario_inicio_preferido TIME,
    horario_fim_preferido TIME,
    
    -- Preferências de local/tipo
    prefere_teleconsulta BOOLEAN DEFAULT false,
    local_preferido_id UUID REFERENCES locais_atendimento(id),
    
    -- Notificações
    lembrete_24h BOOLEAN DEFAULT true,
    lembrete_2h BOOLEAN DEFAULT true,
    lembrete_30min BOOLEAN DEFAULT false,
    
    -- Configurações familiares
    agendar_consecutivo BOOLEAN DEFAULT false, -- para famílias
    intervalo_maximo_familiar INTEGER DEFAULT 60, -- minutos entre consultas da família
    
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(paciente_id, medico_id)
);

-- Avaliações e feedback
CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID NOT NULL REFERENCES consultas(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    
    -- Avaliação
    nota_geral INTEGER CHECK (nota_geral >= 1 AND nota_geral <= 5),
    nota_pontualidade INTEGER CHECK (nota_pontualidade >= 1 AND nota_pontualidade <= 5),
    nota_atendimento INTEGER CHECK (nota_atendimento >= 1 AND nota_atendimento <= 5),
    
    -- Feedback
    comentario TEXT,
    recomendaria BOOLEAN,
    
    -- Dados do agendamento
    chegou_no_horario BOOLEAN,
    tempo_espera_minutos INTEGER,
    
    data_avaliacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(consulta_id, paciente_id)
);

-- Notificações
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    consulta_id UUID REFERENCES consultas(id),
    
    tipo tipo_notificacao NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    
    enviada BOOLEAN DEFAULT false,
    lida BOOLEAN DEFAULT false,
    data_envio TIMESTAMP WITH TIME ZONE,
    data_leitura TIMESTAMP WITH TIME ZONE,
    
    -- Agendamento de envio
    enviar_em TIMESTAMP WITH TIME ZONE,
    
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Métricas do sistema (para otimização)
CREATE TABLE metricas_agendamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    data_referencia DATE NOT NULL,
    
    -- Métricas de pontualidade
    total_consultas INTEGER DEFAULT 0,
    consultas_no_horario INTEGER DEFAULT 0,
    atraso_medio_minutos NUMERIC(5, 2) DEFAULT 0,
    
    -- Métricas de utilização
    tempo_total_agendado INTEGER DEFAULT 0, -- minutos
    tempo_total_utilizado INTEGER DEFAULT 0, -- minutos
    taxa_ocupacao NUMERIC(5, 2) DEFAULT 0, -- percentual
    
    -- Métricas de qualidade
    taxa_no_show NUMERIC(5, 2) DEFAULT 0,
    nota_media_avaliacoes NUMERIC(3, 2) DEFAULT 0,
    total_reagendamentos INTEGER DEFAULT 0,
    
    data_calculo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(medico_id, data_referencia)
);

-- ========= ÍNDICES PARA PERFORMANCE =========

-- Usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- Médicos
CREATE INDEX idx_medicos_usuario_id ON medicos(usuario_id);
CREATE INDEX idx_medicos_especialidade ON medicos(especialidade);
CREATE INDEX idx_medicos_crm ON medicos(crm, uf_crm);

-- Locais
CREATE INDEX idx_locais_medico_id ON locais_atendimento(medico_id);
CREATE INDEX idx_locais_cidade_estado ON locais_atendimento(cidade, estado);

-- Horários
CREATE INDEX idx_horarios_medico_id ON horarios_funcionamento(medico_id);
CREATE INDEX idx_horarios_dia_semana ON horarios_funcionamento(dia_semana);

-- Pacientes
CREATE INDEX idx_pacientes_usuario_id ON pacientes(usuario_id);
CREATE INDEX idx_pacientes_responsavel_id ON pacientes(responsavel_id);

-- Consultas (crítico para performance)
CREATE INDEX idx_consultas_medico_id ON consultas(medico_id);
CREATE INDEX idx_consultas_paciente_id ON consultas(paciente_id);
CREATE INDEX idx_consultas_data_hora ON consultas(data_hora_agendada);
CREATE INDEX idx_consultas_status ON consultas(status);
CREATE INDEX idx_consultas_tipo ON consultas(tipo);
CREATE INDEX idx_consultas_prioridade ON consultas(prioridade);
CREATE INDEX idx_consultas_medico_data ON consultas(medico_id, data_hora_agendada);

-- Notificações
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_enviar_em ON notificacoes(enviar_em) WHERE enviada = false;

-- Métricas
CREATE INDEX idx_metricas_medico_data ON metricas_agendamento(medico_id, data_referencia);

-- ========= FUNÇÕES AUXILIARES =========

-- Função para calcular disponibilidade
CREATE OR REPLACE FUNCTION calcular_disponibilidade_medico(
    p_medico_id UUID,
    p_data_inicio TIMESTAMP WITH TIME ZONE,
    p_data_fim TIMESTAMP WITH TIME ZONE,
    p_tipo_consulta tipo_consulta DEFAULT NULL
)
RETURNS TABLE (
    data_hora TIMESTAMP WITH TIME ZONE,
    duracao_disponivel INTEGER,
    local_id UUID
) AS $$
BEGIN
    -- Implementação simplificada - será expandida
    RETURN QUERY
    SELECT 
        generate_series(
            p_data_inicio,
            p_data_fim,
            interval '30 minutes'
        ) as data_hora,
        30 as duracao_disponivel,
        NULL::UUID as local_id
    WHERE NOT EXISTS (
        SELECT 1 FROM consultas c
        WHERE c.medico_id = p_medico_id
        AND c.status NOT IN ('cancelada', 'nao_compareceu')
        AND c.data_hora_agendada <= generate_series + interval '30 minutes'
        AND c.data_hora_agendada + (c.duracao_estimada || ' minutes')::interval > generate_series
    );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar métricas
CREATE OR REPLACE FUNCTION atualizar_metricas_medico(p_medico_id UUID, p_data DATE)
RETURNS VOID AS $$
DECLARE
    v_total_consultas INTEGER;
    v_consultas_no_horario INTEGER;
    v_atraso_medio NUMERIC;
BEGIN
    -- Calcular métricas do dia
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE 
            data_hora_inicio_real IS NOT NULL AND 
            data_hora_inicio_real <= data_hora_agendada + interval '5 minutes'
        ),
        AVG(
            EXTRACT(EPOCH FROM (data_hora_inicio_real - data_hora_agendada)) / 60
        ) FILTER (WHERE data_hora_inicio_real > data_hora_agendada)
    INTO v_total_consultas, v_consultas_no_horario, v_atraso_medio
    FROM consultas
    WHERE medico_id = p_medico_id
    AND DATE(data_hora_agendada) = p_data
    AND status IN ('realizada', 'em_andamento');
    
    -- Inserir ou atualizar métricas
    INSERT INTO metricas_agendamento (
        medico_id, data_referencia, total_consultas, 
        consultas_no_horario, atraso_medio_minutos
    )
    VALUES (
        p_medico_id, p_data, COALESCE(v_total_consultas, 0),
        COALESCE(v_consultas_no_horario, 0), COALESCE(v_atraso_medio, 0)
    )
    ON CONFLICT (medico_id, data_referencia)
    DO UPDATE SET
        total_consultas = EXCLUDED.total_consultas,
        consultas_no_horario = EXCLUDED.consultas_no_horario,
        atraso_medio_minutos = EXCLUDED.atraso_medio_minutos,
        data_calculo = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ========= TRIGGERS =========

-- Trigger para atualizar data de modificação
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_consultas_update_time
    BEFORE UPDATE ON consultas
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_time();

-- Trigger para atualizar rating do médico
CREATE OR REPLACE FUNCTION atualizar_rating_medico()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE medicos SET
        rating = (
            SELECT AVG(nota_geral)
            FROM avaliacoes
            WHERE medico_id = NEW.medico_id
        ),
        total_avaliacoes = (
            SELECT COUNT(*)
            FROM avaliacoes
            WHERE medico_id = NEW.medico_id
        )
    WHERE id = NEW.medico_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_rating
    AFTER INSERT OR UPDATE ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_rating_medico();

-- ========= DADOS DE EXEMPLO (OPCIONAL) =========

-- Inserir alguns dados de teste
INSERT INTO usuarios (nome, email, senha_hash, cpf, tipo) VALUES
('Dr. Carlos Silva', 'carlos.silva@email.com', '$2b$10$hash1', '123.456.789-01', 'medico'),
('Dra. Ana Santos', 'ana.santos@email.com', '$2b$10$hash2', '123.456.789-02', 'medico'),
('Dr. Roberto Lima', 'roberto.lima@email.com', '$2b$10$hash3', '123.456.789-03', 'medico'),
('Maria Santos', 'maria.santos@email.com', '$2b$10$hash4', '123.456.789-04', 'paciente'),
('João Santos', 'joao.santos@email.com', '$2b$10$hash5', '123.456.789-05', 'paciente');

-- Schema criado com sucesso!
-- Próximo passo: Configurar o backend para usar este schema