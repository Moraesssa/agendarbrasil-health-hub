
-- Create FHIR resources table
CREATE TABLE public.fhir_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('Patient', 'Observation', 'DocumentReference', 'MedicationStatement', 'Appointment', 'Encounter')),
  resource_content JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_system TEXT DEFAULT 'internal',
  version_id TEXT DEFAULT '1',
  CONSTRAINT valid_fhir_resource CHECK (
    resource_content ? 'resourceType' AND 
    (resource_content ->> 'resourceType') = resource_type
  )
);

-- Add indexes for performance
CREATE INDEX idx_fhir_resources_patient_id ON public.fhir_resources(patient_id);
CREATE INDEX idx_fhir_resources_type ON public.fhir_resources(resource_type);
CREATE INDEX idx_fhir_resources_last_updated ON public.fhir_resources(last_updated);
CREATE INDEX idx_fhir_resources_content_gin ON public.fhir_resources USING gin(resource_content);

-- Enable Row Level Security
ALTER TABLE public.fhir_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for FHIR resources
CREATE POLICY "Users can view their own FHIR resources" 
ON public.fhir_resources 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can create their own FHIR resources" 
ON public.fhir_resources 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own FHIR resources" 
ON public.fhir_resources 
FOR UPDATE 
USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete their own FHIR resources" 
ON public.fhir_resources 
FOR DELETE 
USING (auth.uid() = patient_id);

-- Service role can access all FHIR resources (for webhooks)
CREATE POLICY "Service role can access all FHIR resources" 
ON public.fhir_resources 
FOR ALL 
TO service_role
USING (true);

-- Function to convert health_metrics to FHIR Observation
CREATE OR REPLACE FUNCTION public.convert_health_metric_to_fhir(metric_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    metric_record health_metrics%ROWTYPE;
    fhir_observation JSONB;
    coding_system TEXT;
    coding_code TEXT;
    coding_display TEXT;
BEGIN
    -- Get the health metric
    SELECT * INTO metric_record FROM health_metrics WHERE id = metric_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Health metric not found: %', metric_id;
    END IF;
    
    -- Map metric types to LOINC codes
    CASE metric_record.metric_type
        WHEN 'blood_pressure' THEN
            coding_system := 'http://loinc.org';
            coding_code := '85354-9';
            coding_display := 'Blood pressure panel with all children optional';
        WHEN 'heart_rate' THEN
            coding_system := 'http://loinc.org';
            coding_code := '8867-4';
            coding_display := 'Heart rate';
        WHEN 'temperature' THEN
            coding_system := 'http://loinc.org';
            coding_code := '8310-5';
            coding_display := 'Body temperature';
        WHEN 'weight' THEN
            coding_system := 'http://loinc.org';
            coding_code := '29463-7';
            coding_display := 'Body weight';
        WHEN 'height' THEN
            coding_system := 'http://loinc.org';
            coding_code := '8302-2';
            coding_display := 'Body height';
        WHEN 'glucose' THEN
            coding_system := 'http://loinc.org';
            coding_code := '33747-0';
            coding_display := 'Glucose [Mass/volume] in Blood by Glucometer';
        WHEN 'oxygen_saturation' THEN
            coding_system := 'http://loinc.org';
            coding_code := '2708-6';
            coding_display := 'Oxygen saturation in Arterial blood';
        ELSE
            coding_system := 'http://terminology.hl7.org/CodeSystem/observation-category';
            coding_code := 'vital-signs';
            coding_display := metric_record.metric_type;
    END CASE;
    
    -- Build FHIR Observation
    fhir_observation := jsonb_build_object(
        'resourceType', 'Observation',
        'id', metric_record.id::text,
        'status', 'final',
        'category', jsonb_build_array(
            jsonb_build_object(
                'coding', jsonb_build_array(
                    jsonb_build_object(
                        'system', 'http://terminology.hl7.org/CodeSystem/observation-category',
                        'code', 'vital-signs',
                        'display', 'Vital Signs'
                    )
                )
            )
        ),
        'code', jsonb_build_object(
            'coding', jsonb_build_array(
                jsonb_build_object(
                    'system', coding_system,
                    'code', coding_code,
                    'display', coding_display
                )
            )
        ),
        'subject', jsonb_build_object(
            'reference', 'Patient/' || metric_record.patient_id::text
        ),
        'effectiveDateTime', metric_record.recorded_at,
        'meta', jsonb_build_object(
            'lastUpdated', metric_record.created_at,
            'source', '#' || metric_record.id::text
        )
    );
    
    -- Add value based on metric type
    IF metric_record.metric_type = 'blood_pressure' THEN
        fhir_observation := fhir_observation || jsonb_build_object(
            'component', jsonb_build_array(
                jsonb_build_object(
                    'code', jsonb_build_object(
                        'coding', jsonb_build_array(
                            jsonb_build_object(
                                'system', 'http://loinc.org',
                                'code', '8480-6',
                                'display', 'Systolic blood pressure'
                            )
                        )
                    ),
                    'valueQuantity', jsonb_build_object(
                        'value', (metric_record.value ->> 'systolic')::numeric,
                        'unit', metric_record.unit,
                        'system', 'http://unitsofmeasure.org',
                        'code', 'mm[Hg]'
                    )
                ),
                jsonb_build_object(
                    'code', jsonb_build_object(
                        'coding', jsonb_build_array(
                            jsonb_build_object(
                                'system', 'http://loinc.org',
                                'code', '8462-4',
                                'display', 'Diastolic blood pressure'
                            )
                        )
                    ),
                    'valueQuantity', jsonb_build_object(
                        'value', (metric_record.value ->> 'diastolic')::numeric,
                        'unit', metric_record.unit,
                        'system', 'http://unitsofmeasure.org',
                        'code', 'mm[Hg]'
                    )
                )
            )
        );
    ELSE
        fhir_observation := fhir_observation || jsonb_build_object(
            'valueQuantity', jsonb_build_object(
                'value', (metric_record.value ->> 'numeric')::numeric,
                'unit', metric_record.unit,
                'system', 'http://unitsofmeasure.org'
            )
        );
    END IF;
    
    RETURN fhir_observation;
END;
$$;

-- Function to convert profile to FHIR Patient
CREATE OR REPLACE FUNCTION public.convert_profile_to_fhir_patient(profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record profiles%ROWTYPE;
    paciente_record pacientes%ROWTYPE;
    fhir_patient JSONB;
    birth_date TEXT;
    gender_code TEXT;
BEGIN
    -- Get the profile
    SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found: %', profile_id;
    END IF;
    
    -- Try to get additional patient data
    SELECT * INTO paciente_record FROM pacientes WHERE user_id = profile_id;
    
    -- Extract birth date and gender from patient data if available
    IF FOUND THEN
        birth_date := paciente_record.dados_pessoais ->> 'data_nascimento';
        CASE paciente_record.dados_pessoais ->> 'sexo'
            WHEN 'masculino' THEN gender_code := 'male';
            WHEN 'feminino' THEN gender_code := 'female';
            ELSE gender_code := 'unknown';
        END CASE;
    END IF;
    
    -- Build FHIR Patient
    fhir_patient := jsonb_build_object(
        'resourceType', 'Patient',
        'id', profile_record.id::text,
        'active', profile_record.is_active,
        'name', jsonb_build_array(
            jsonb_build_object(
                'use', 'official',
                'text', profile_record.display_name
            )
        ),
        'telecom', jsonb_build_array(
            jsonb_build_object(
                'system', 'email',
                'value', profile_record.email,
                'use', 'home'
            )
        ),
        'meta', jsonb_build_object(
            'lastUpdated', COALESCE(paciente_record.updated_at, profile_record.created_at),
            'source', '#' || profile_record.id::text
        )
    );
    
    -- Add birth date if available
    IF birth_date IS NOT NULL THEN
        fhir_patient := fhir_patient || jsonb_build_object('birthDate', birth_date);
    END IF;
    
    -- Add gender if available
    IF gender_code IS NOT NULL THEN
        fhir_patient := fhir_patient || jsonb_build_object('gender', gender_code);
    END IF;
    
    -- Add address if available
    IF paciente_record.endereco IS NOT NULL THEN
        fhir_patient := fhir_patient || jsonb_build_object(
            'address', jsonb_build_array(
                jsonb_build_object(
                    'use', 'home',
                    'type', 'physical',
                    'text', COALESCE(paciente_record.endereco ->> 'endereco_completo', ''),
                    'city', paciente_record.endereco ->> 'cidade',
                    'state', paciente_record.endereco ->> 'uf',
                    'postalCode', paciente_record.endereco ->> 'cep',
                    'country', 'BR'
                )
            )
        );
    END IF;
    
    RETURN fhir_patient;
END;
$$;

-- Trigger to update last_updated on fhir_resources
CREATE OR REPLACE FUNCTION update_fhir_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fhir_resources_last_updated
    BEFORE UPDATE ON public.fhir_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_fhir_last_updated();
