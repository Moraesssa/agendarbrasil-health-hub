-- SQL script to create necessary ENUM types, the prescription table, and fix relationships

-- Step 1: Create all necessary ENUM types, checking for existence first
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

-- Step 2: Create the DocumentosDigitais table (as per schema.sql)
-- This step is crucial because the error indicates this table does not exist.
CREATE TABLE IF NOT EXISTS "DocumentosDigitais" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID NOT NULL REFERENCES Consultas(id), -- Chave Estrangeira
    tipo tipo_documento NOT NULL,
    conteudo_hash VARCHAR(255) NOT NULL, -- Para verificar integridade do documento
    url_documento_assinado VARCHAR(255) NOT NULL, -- Link para o PDF seguro
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Add doctor_id and patient_id columns to DocumentosDigitais
-- These are added to match the frontend's expectation of 'medical_prescriptions'
ALTER TABLE "DocumentosDigitais" ADD COLUMN IF NOT EXISTS "doctor_id" UUID;
ALTER TABLE "DocumentosDigitais" ADD COLUMN IF NOT EXISTS "patient_id" UUID;

-- Step 4: Add foreign key constraints for doctor_id and patient_id
-- Note: These FKs are added to DocumentosDigitais to align with frontend expectations.
-- In a real scenario, the relationship might be better managed via Consultas.
ALTER TABLE "DocumentosDigitais" ADD CONSTRAINT "fk_documentos_medico" FOREIGN KEY ("doctor_id") REFERENCES "Medicos" ("id");
ALTER TABLE "DocumentosDigitais" ADD CONSTRAINT "fk_documentos_paciente" FOREIGN KEY ("patient_id") REFERENCES "Pacientes" ("id");

-- Step 5: Rename the table to 'medical_prescriptions' to match frontend expectations
ALTER TABLE "DocumentosDigitais" RENAME TO "medical_prescriptions";

-- Step 6: Add the 'is_active' column (as seen in frontend error logs)
ALTER TABLE "medical_prescriptions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE;

-- Step 7: Add the 'prescribed_date' column (as seen in frontend error logs)
ALTER TABLE "medical_prescriptions" ADD COLUMN IF NOT EXISTS "prescribed_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Note: The frontend code might still need adjustments to correctly query
-- relationships via the 'consulta_id' if direct doctor/patient IDs are not populated.
