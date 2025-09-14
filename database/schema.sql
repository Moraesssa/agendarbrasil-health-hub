-- Esquema do Banco de Dados para a Plataforma de Telemedicina
-- Versão: 1.0
-- Data: 2025-08-19

-- ========= CRIAÇÃO DOS TIPOS ENUMERADOS (ENUMS) =========

CREATE TYPE tipo_usuario AS ENUM ('paciente', 'medico', 'admin');
CREATE TYPE tipo_consulta AS ENUM ('presencial', 'teleconsulta');
CREATE TYPE status_consulta AS ENUM ('agendada', 'confirmada', 'realizada', 'cancelada', 'nao_compareceu');
CREATE TYPE tipo_documento AS ENUM ('prescricao', 'atestado', 'pedido_exame');

-- ========= ESTRUTURA DAS TABELAS PRINCIPAIS =========

-- Tabela de Usuários: Armazena informações de login para todos os tipos de usuários.
CREATE TABLE Usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL, -- Formato XXX.XXX.XXX-XX
    telefone VARCHAR(20),
    tipo tipo_usuario NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE
);

-- Tabela de Médicos: Contém informações específicas dos profissionais de saúde.
CREATE TABLE Medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE, -- Chave Estrangeira
    crm VARCHAR(20) NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    especialidade_id UUID, -- Chave Estrangeira para uma futura tabela de Especialidades
    bio_perfil TEXT,
    foto_perfil_url VARCHAR(255),
    chave_assinatura_digital TEXT, -- Armazenamento seguro da chave ou referência
    UNIQUE(crm, uf_crm)
);

-- Tabela de Pacientes: Contém informações específicas dos pacientes.
CREATE TABLE Pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE, -- Chave Estrangeira
    data_nascimento DATE NOT NULL,
    genero VARCHAR(50),
    endereco TEXT
);

-- Tabela de consultas: agenda e gerencia os atendimentos.
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES Medicos(id), -- Chave Estrangeira
    paciente_id UUID NOT NULL REFERENCES Pacientes(id), -- Chave Estrangeira
    data_hora_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_minutos INT DEFAULT 30,
    tipo tipo_consulta NOT NULL,
    status status_consulta NOT NULL DEFAULT 'agendada',
    link_sala_virtual VARCHAR(255),
    valor_consulta NUMERIC(10, 2),
    pagamento_id VARCHAR(255) -- Chave Estrangeira para um sistema de pagamento
);

-- Tabela de Prontuários: Registros médicos de cada paciente.
CREATE TABLE Prontuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES Pacientes(id), -- Chave Estrangeira
    medico_id UUID NOT NULL REFERENCES Medicos(id), -- Chave Estrangeira
    consulta_id UUID REFERENCES consultas(id), -- Opcional, mas recomendado
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    anotacoes_clinicas TEXT, -- Criptografar em repouso
    hipotese_diagnostica TEXT -- Criptografar em repouso
);

-- Tabela de Documentos Digitais: Armazena prescrições, atestados, etc.
CREATE TABLE DocumentosDigitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID NOT NULL REFERENCES consultas(id), -- Chave Estrangeira
    tipo tipo_documento NOT NULL,
    conteudo_hash VARCHAR(255) NOT NULL, -- Para verificar integridade do documento
    url_documento_assinado VARCHAR(255) NOT NULL, -- Link para o PDF seguro
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========= TABELAS AUXILIARES E DE AUDITORIA =========

-- Tabela de Auditoria: Registra ações críticas no sistema para rastreabilidade.
CREATE TABLE AuditoriaLogs (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES Usuarios(id),
    acao VARCHAR(255) NOT NULL,
    detalhes JSONB, -- Armazena detalhes contextuais da ação
    ip_origem VARCHAR(45),
    data_ocorrencia TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========= CONSIDERAÇÕES DE PERFORMANCE (INDEXAÇÃO) =========

-- Índices em chaves estrangeiras e campos frequentemente buscados para otimizar queries.
-- Nota: Chaves primárias já possuem índices automaticamente.

-- Tabela Medicos
CREATE INDEX idx_medicos_usuario_id ON Medicos(usuario_id);

-- Tabela Pacientes
CREATE INDEX idx_pacientes_usuario_id ON Pacientes(usuario_id);

-- Tabela consultas
CREATE INDEX idx_consultas_medico_id ON consultas(medico_id);
CREATE INDEX idx_consultas_paciente_id ON consultas(paciente_id);
CREATE INDEX idx_consultas_data_hora ON consultas(data_hora_agendamento); -- Criar índice
CREATE INDEX idx_consultas_status ON consultas(status); -- Criar índice

-- Tabela Prontuarios
CREATE INDEX idx_prontuarios_paciente_id ON Prontuarios(paciente_id);
CREATE INDEX idx_prontuarios_medico_id ON Prontuarios(medico_id);
CREATE INDEX idx_prontuarios_consulta_id ON Prontuarios(consulta_id);

-- Tabela DocumentosDigitais
CREATE INDEX idx_documentos_consulta_id ON DocumentosDigitais(consulta_id);

-- Tabela AuditoriaLogs
CREATE INDEX idx_auditoria_usuario_id ON AuditoriaLogs(usuario_id);
CREATE INDEX idx_auditoria_acao ON AuditoriaLogs(acao);

-- Fim do Esquema.
