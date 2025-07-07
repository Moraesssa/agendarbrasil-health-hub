-- Create external_data_sources table
CREATE TABLE public.external_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  description TEXT,
  endpoint_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  data_types TEXT[] NOT NULL DEFAULT '{}', -- Types of data this source provides (e.g., 'lab_results', 'imaging', 'vaccines')
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_consents table
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked')),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  consent_version TEXT NOT NULL DEFAULT '1.0', -- Track consent version for compliance
  ip_address INET, -- Track IP for audit purposes
  user_agent TEXT, -- Track user agent for audit purposes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, source_id)
);

-- Create integration_logs table for audit trail
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.external_data_sources(id),
  patient_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'data_received', 'consent_granted', 'consent_revoked', 'error'
  status TEXT NOT NULL, -- 'success', 'failed', 'rejected'
  payload JSONB, -- Store request/response data for debugging
  error_message TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_data_sources (read-only for authenticated users)
CREATE POLICY "Users can view active data sources" 
ON public.external_data_sources 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- RLS Policies for user_consents
CREATE POLICY "Users can view their own consents" 
ON public.user_consents 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own consents" 
ON public.user_consents 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own consents" 
ON public.user_consents 
FOR UPDATE 
USING (auth.uid() = patient_id);

-- RLS Policies for integration_logs (users can only see their own logs)
CREATE POLICY "Users can view their own integration logs" 
ON public.integration_logs 
FOR SELECT 
USING (auth.uid() = patient_id);

-- Admins can see all logs (for future admin interface)
CREATE POLICY "Service role can access all logs" 
ON public.integration_logs 
FOR ALL 
TO service_role
USING (true);

-- Insert sample data sources
INSERT INTO public.external_data_sources (name, api_key, description, data_types) VALUES
('Laboratório Exemplo', 'lab_example_api_key_123', 'Laboratório de análises clínicas com resultados automatizados', ARRAY['lab_results', 'blood_tests']),
('Clínica de Imagem Digital', 'imaging_clinic_api_456', 'Centro de diagnóstico por imagem com laudos digitais', ARRAY['imaging', 'radiology']),
('Rede de Farmácias Saúde+', 'pharmacy_network_789', 'Rede de farmácias para histórico de medicamentos', ARRAY['medications', 'prescriptions']);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_external_data_sources_updated_at
    BEFORE UPDATE ON public.external_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at
    BEFORE UPDATE ON public.user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();