
-- Criar tabela para certificados médicos (atestados)
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
  certificate_number TEXT NOT NULL UNIQUE,
  validation_hash TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para certificados médicos
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para certificados médicos
CREATE POLICY "Doctors can create certificates" 
  ON public.medical_certificates 
  FOR INSERT 
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can view their certificates" 
  ON public.medical_certificates 
  FOR SELECT 
  USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their certificates" 
  ON public.medical_certificates 
  FOR SELECT 
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update their certificates" 
  ON public.medical_certificates 
  FOR UPDATE 
  USING (auth.uid() = doctor_id);

-- Criar tabela para validação de documentos
CREATE TABLE public.document_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('prescription', 'certificate')),
  validation_code TEXT NOT NULL UNIQUE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para validações de documentos
ALTER TABLE public.document_validations ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de validações (público)
CREATE POLICY "Anyone can create validations" 
  ON public.document_validations 
  FOR INSERT 
  WITH CHECK (true);

-- Política para permitir visualização de validações (apenas autenticados)
CREATE POLICY "Authenticated users can view validations" 
  ON public.document_validations 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Adicionar campos para PDF e validação nas prescrições existentes
ALTER TABLE public.medical_prescriptions 
ADD COLUMN IF NOT EXISTS prescription_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS validation_hash TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Atualizar prescrições existentes com números únicos
UPDATE public.medical_prescriptions 
SET prescription_number = 'RX-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0'),
    validation_hash = encode(digest(id::text || created_at::text, 'sha256'), 'hex')
WHERE prescription_number IS NULL OR validation_hash IS NULL;

-- Função para gerar número de certificado
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 10) AS INTEGER)), 0) + 1 
     FROM public.medical_certificates 
     WHERE certificate_number LIKE 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-%'
    )::TEXT, 6, '0'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar hash de validação
CREATE OR REPLACE FUNCTION public.generate_validation_hash(doc_id UUID, doc_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(doc_id::text || doc_type || NOW()::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para gerar número e hash automaticamente
CREATE OR REPLACE FUNCTION public.set_certificate_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := public.generate_certificate_number();
  END IF;
  
  IF NEW.validation_hash IS NULL THEN
    NEW.validation_hash := public.generate_validation_hash(NEW.id, 'certificate');
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_certificate_metadata_trigger
  BEFORE INSERT OR UPDATE ON public.medical_certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_certificate_metadata();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_medical_certificates_updated_at
  BEFORE UPDATE ON public.medical_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
