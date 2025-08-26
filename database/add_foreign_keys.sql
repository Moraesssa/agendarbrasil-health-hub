-- SQL script to add foreign key relationships to the medical_prescriptions table

-- Step 1: Add the doctor_id and patient_id columns if they don't exist
ALTER TABLE "medical_prescriptions" ADD COLUMN IF NOT EXISTS "doctor_id" UUID;
ALTER TABLE "medical_prescriptions" ADD COLUMN IF NOT EXISTS "patient_id" UUID;

-- Step 2: Add foreign key constraints for doctor_id and patient_id
ALTER TABLE "medical_prescriptions" ADD CONSTRAINT "fk_prescriptions_medico" FOREIGN KEY ("doctor_id") REFERENCES "Medicos" ("id");
ALTER TABLE "medical_prescriptions" ADD CONSTRAINT "fk_prescriptions_paciente" FOREIGN KEY ("patient_id") REFERENCES "Pacientes" ("id");

-- Step 3: Add the 'is_active' and 'prescribed_date' columns if they don't exist
ALTER TABLE "medical_prescriptions" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE;
ALTER TABLE "medical_prescriptions" ADD COLUMN IF NOT EXISTS "prescribed_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
