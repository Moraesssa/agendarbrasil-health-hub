 -- Migration to fix the medical prescriptions table and relationships

-- Step 1: Rename the table 'DocumentosDigitais' to 'medical_prescriptions'
ALTER TABLE "DocumentosDigitais" RENAME TO "medical_prescriptions";

-- Step 2: Add the 'doctor_id' column to the 'medical_prescriptions' table
ALTER TABLE "medical_prescriptions" ADD COLUMN "doctor_id" UUID;

-- Step 3: Add the 'patient_id' column to the 'medical_prescriptions' table
ALTER TABLE "medical_prescriptions" ADD COLUMN "patient_id" UUID;

-- Step 4: Add the foreign key constraint for 'doctor_id'
ALTER TABLE "medical_prescriptions" ADD CONSTRAINT "medical_prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Medicos" ("id");

-- Step 5: Add the foreign key constraint for 'patient_id'
ALTER TABLE "medical_prescriptions" ADD CONSTRAINT "medical_prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Pacientes" ("id");

-- Step 6: Add the 'is_active' column to the 'medical_prescriptions' table
ALTER TABLE "medical_prescriptions" ADD COLUMN "is_active" BOOLEAN DEFAULT TRUE;

-- Step 7: Add the 'prescribed_date' column to the 'medical_prescriptions' table
ALTER TABLE "medical_prescriptions" ADD COLUMN "prescribed_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
