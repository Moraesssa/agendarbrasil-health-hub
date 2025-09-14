-- SQL script to reset the schema, create all tables, and fix prescription relationships

-- Step 1: Drop all existing tables to ensure a clean state
DROP TABLE IF EXISTS "medical_prescriptions" CASCADE;
DROP TABLE IF EXISTS "DocumentosDigitais" CASCADE;
DROP TABLE IF EXISTS consultas CASCADE;
DROP TABLE IF EXISTS "Pacientes" CASCADE;
DROP TABLE IF EXISTS "Medicos" CASCADE;
DROP TABLE IF EXISTS "Usuarios" CASCADE;
DROP TABLE IF EXISTS "Prontuarios" CASCADE;
DROP TABLE IF EXISTS "AuditoriaLogs" CASCADE;

-- Step 2: Create all necessary ENUM types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
        CREATE TYPE tipo_usuario AS ENUM ('paciente', 'medico', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_consulta') THEN
        CREATE TYPE tipo_consulta AS ENUM ('presencial', 'teleconsulta');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_consulta') THEN
        CREATE TYPE status_consulta AS ENUM ('agendada', 'confirmada', 'realizada', 'cancelada', 'nao_compareceu');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento') THEN
        CREATE TYPE tipo_documento AS ENUM ('prescricao', 'atestado', 'pedido_exame');
    END IF;
END$$;

-- Step 3: Create the Usuarios table
CREATE TABLE "Usuarios" (
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

-- Step 4: Create the Medicos table
CREATE TABLE "Medicos" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES "Usuarios"(id) ON DELETE CASCADE, -- Chave Estrangeira
    crm VARCHAR(20) NOT NULL,
    uf_crm CHAR(2) NOT NULL,
    especialidade_id UUID, -- Chave Estrangeira para uma futura tabela de Especialidades
    bio_perfil TEXT,
    foto_perfil_url VARCHAR(255),
    chave_assinatura_digital TEXT, -- Armazenamento seguro da chave ou referência
    UNIQUE(crm, uf_crm)
);

-- Step 5: Create the Pacientes table
CREATE TABLE "Pacientes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES "Usuarios"(id) ON DELETE CASCADE, -- Chave Estrangeira
    data_nascimento DATE NOT NULL,
    genero VARCHAR(50),
    endereco TEXT
);

-- Step 6: Create the consultas table
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES "Medicos"(id), -- Chave Estrangeira
    paciente_id UUID NOT NULL REFERENCES "Pacientes"(id), -- Chave Estrangeira
    data_hora_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_minutos INT DEFAULT 30,
    tipo tipo_consulta NOT NULL,
    status status_consulta NOT NULL DEFAULT 'agendada',
    link_sala_virtual VARCHAR(255),
    valor_consulta NUMERIC(10, 2),
    pagamento_id VARCHAR(255) -- Chave Estrangeira para um sistema de pagamento
);

-- Step 7: Create the DocumentosDigitais table
CREATE TABLE "DocumentosDigitais" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID NOT NULL REFERENCES consultas(id), -- Chave Estrangeira
    tipo tipo_documento NOT NULL,
    conteudo_hash VARCHAR(255) NOT NULL, -- Para verificar integridade do documento
    url_documento_assinado VARCHAR(255) NOT NULL, -- Link para o PDF seguro
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 8: Add doctor_id and patient_id columns to DocumentosDigitais
ALTER TABLE "DocumentosDigitais" ADD COLUMN "doctor_id" UUID;
ALTER TABLE "DocumentosDigitais" ADD COLUMN "patient_id" UUID;

-- Step 9: Add foreign key constraints for doctor_id and patient_id
ALTER TABLE "DocumentosDigitais" ADD CONSTRAINT "fk_documentos_medico" FOREIGN KEY ("doctor_id") REFERENCES "Medicos" ("id");
ALTER TABLE "DocumentosDigitais" ADD CONSTRAINT "fk_documentos_paciente" FOREIGN KEY ("patient_id") REFERENCES "Pacientes" ("id");

-- Step 10: Rename the table to 'medical_prescriptions'
ALTER TABLE "DocumentosDigitais" RENAME TO "medical_prescriptions";

-- Step 11: Add the 'is_active' and 'prescribed_date' columns
ALTER TABLE "medical_prescriptions" ADD COLUMN "is_active" BOOLEAN DEFAULT TRUE;
ALTER TABLE "medical_prescriptions" ADD COLUMN "prescribed_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
