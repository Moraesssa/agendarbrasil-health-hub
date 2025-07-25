
-- Criar tabela para certificados médicos
CREATE TABLE public.medical_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('medical_leave', 'fitness_certificate', 'vaccination_certificate', 'medical_report')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  diagnosis TEXT,
  recommendations TEXT,
  certificate_number TEXT NOT NULL UNIQUE DEFAULT ('CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || '-' || LPAD(EXTRACT(HOUR FROM NOW())::TEXT, 2, '0') || LPAD(EXTRACT(MINUTE FROM NOW())::TEXT, 2, '0') || LPAD(EXTRACT(SECOND FROM NOW())::TEXT, 2, '0')),
  validation_hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar tabela para logs de validação de documentos
CREATE TABLE public.document_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('prescription', 'certificate')),
  validation_code TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Adicionar campos de numeração e validação às prescrições existentes
ALTER TABLE public.medical_prescriptions 
ADD COLUMN IF NOT EXISTS prescription_number TEXT UNIQUE DEFAULT ('RX-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || '-' || LPAD(EXTRACT(HOUR FROM NOW())::TEXT, 2, '0') || LPAD(EXTRACT(MINUTE FROM NOW())::TEXT, 2, '0') || LPAD(EXTRACT(SECOND FROM NOW())::TEXT, 2, '0')),
ADD COLUMN IF NOT EXISTS validation_hash TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Atualizar prescrições existentes que não têm número ou hash
UPDATE public.medical_prescriptions 
SET prescription_number = 'RX-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(EXTRACT(DOY FROM created_at)::TEXT, 3, '0') || '-' || LPAD(id::TEXT, 8, '0')
WHERE prescription_number IS NULL;

UPDATE public.medical_prescriptions 
SET validation_hash = encode(gen_random_bytes(32), 'hex')
WHERE validation_hash IS NULL;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_validations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para medical_certificates
CREATE POLICY "Users can view their own certificates" ON public.medical_certificates
FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Doctors can create certificates" ON public.medical_certificates
FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their certificates" ON public.medical_certificates
FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Users can delete their certificates" ON public.medical_certificates
FOR DELETE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Políticas RLS para document_validations
CREATE POLICY "Anyone can create validation logs" ON public.document_validations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view validation logs" ON public.document_validations
FOR SELECT USING (true);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_certificates_updated_at 
    BEFORE UPDATE ON public.medical_certificates 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medical_certificates_patient_id ON public.medical_certificates(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_doctor_id ON public.medical_certificates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_validation_hash ON public.medical_certificates(validation_hash);
CREATE INDEX IF NOT EXISTS idx_medical_prescriptions_validation_hash ON public.medical_prescriptions(validation_hash);
CREATE INDEX IF NOT EXISTS idx_document_validations_document_id ON public.document_validations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_validation_code ON public.document_validations(validation_code);
