-- Fix Database Function Security - Add SECURITY DEFINER SET search_path = '' to all functions
-- This prevents search_path manipulation attacks

-- Fix get_my_locations function
CREATE OR REPLACE FUNCTION public.get_my_locations()
 RETURNS SETOF locais_atendimento
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT *
  FROM public.locais_atendimento
  WHERE medico_id = auth.uid()
  ORDER BY nome_local;
$function$;

-- Fix cleanup_expired_reservations function
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.temporary_reservations 
  WHERE expires_at < now();
  RETURN NULL;
END;
$function$;

-- Fix notify_waiting_list function
CREATE OR REPLACE FUNCTION public.notify_waiting_list()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Se uma consulta foi cancelada, notificar lista de espera
  IF OLD.status IN ('agendada', 'confirmada') AND NEW.status = 'cancelada' THEN
    -- Marcar primeira pessoa da lista de espera como notificada
    UPDATE public.waiting_list 
    SET status = 'notified', updated_at = now()
    WHERE medico_id = NEW.medico_id 
      AND data_preferencia = NEW.data_consulta::date
      AND status = 'active'
      AND id = (
        SELECT id FROM public.waiting_list
        WHERE medico_id = NEW.medico_id 
          AND data_preferencia = NEW.data_consulta::date
          AND status = 'active'
        ORDER BY created_at
        LIMIT 1
      );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix convert_health_metric_to_fhir function
CREATE OR REPLACE FUNCTION public.convert_health_metric_to_fhir(metric_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    metric_record public.health_metrics%ROWTYPE;
    fhir_observation JSONB;
    coding_system TEXT;
    coding_code TEXT;
    coding_display TEXT;
BEGIN
    -- Get the health metric
    SELECT * INTO metric_record FROM public.health_metrics WHERE id = metric_id;
    
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
$function$;

-- Fix convert_profile_to_fhir_patient function
CREATE OR REPLACE FUNCTION public.convert_profile_to_fhir_patient(profile_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    profile_record public.profiles%ROWTYPE;
    paciente_record public.pacientes%ROWTYPE;
    fhir_patient JSONB;
    birth_date TEXT;
    gender_code TEXT;
BEGIN
    -- Get the profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = profile_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found: %', profile_id;
    END IF;
    
    -- Try to get additional patient data
    SELECT * INTO paciente_record FROM public.pacientes WHERE user_id = profile_id;
    
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
$function$;

-- Fix update_fhir_last_updated function
CREATE OR REPLACE FUNCTION public.update_fhir_last_updated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$function$;

-- Fix get_specialties function
CREATE OR REPLACE FUNCTION public.get_specialties()
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT spec
    FROM (
      -- Busca as especialidades customizadas dos médicos
      SELECT unnest(especialidades) as spec
      FROM public.medicos
      WHERE array_length(especialidades, 1) > 0
      
      UNION
      
      -- Busca as especialidades padronizadas da tabela
      SELECT nome as spec
      FROM public.especialidades_medicas
      WHERE ativa = true
    ) combined
    WHERE spec IS NOT NULL AND spec <> ''
    ORDER BY spec
  );
END;
$function$;

-- Fix reserve_appointment_slot function
CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(p_doctor_id uuid, p_patient_id uuid, p_family_member_id uuid, p_scheduled_by_id uuid, p_appointment_datetime timestamp with time zone, p_specialty text)
 RETURNS TABLE(success boolean, message text, appointment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    v_slot_available BOOLEAN;
    v_new_appointment_id UUID;
    v_expiration_time TIMESTAMPTZ := now() + interval '10 minutes';
BEGIN
    -- Check if a slot is already scheduled or pending for the same doctor and time
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.consultas c
        WHERE c.medico_id = p_doctor_id
          AND c.data_consulta = p_appointment_datetime
          AND (
            c.status = 'scheduled' OR
            (c.status = 'pending_payment' AND c.expires_at > now())
          )
    ) INTO v_slot_available;

    IF v_slot_available THEN
        -- Insert a new appointment with 'pending_payment' status
        INSERT INTO public.consultas (
            medico_id,
            paciente_id,
            paciente_familiar_id,
            agendado_por,
            data_consulta,
            tipo_consulta,
            status,
            expires_at
        )
        VALUES (
            p_doctor_id,
            p_patient_id,
            p_family_member_id,
            p_scheduled_by_id,
            p_appointment_datetime,
            p_specialty,
            'pending_payment',
            v_expiration_time
        )
        RETURNING id INTO v_new_appointment_id;

        RETURN QUERY SELECT TRUE, 'Slot reserved successfully.', v_new_appointment_id;
    ELSE
        -- The slot is already taken
        RETURN QUERY SELECT FALSE, 'This time slot is no longer available.', NULL::UUID;
    END IF;
END;
$function$;

-- Fix confirm_appointment_payment function
CREATE OR REPLACE FUNCTION public.confirm_appointment_payment(p_appointment_id uuid, p_payment_intent_id text)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    -- Update the appointment status to 'scheduled' and clear the expiration
    UPDATE public.consultas
    SET
        status = 'scheduled',
        expires_at = NULL
    WHERE id = p_appointment_id AND status = 'pending_payment';

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'Appointment confirmed successfully.';
    ELSE
        RETURN QUERY SELECT FALSE, 'Appointment not found or already processed.';
    END IF;
END;
$function$;

-- Fix get_family_members function
CREATE OR REPLACE FUNCTION public.get_family_members(user_uuid uuid)
 RETURNS TABLE(id uuid, family_member_id uuid, display_name text, email text, relationship text, permission_level text, can_schedule boolean, can_view_history boolean, can_cancel boolean, status text)
 LANGUAGE sql
 SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT 
    fm.id,
    fm.family_member_id,
    p.display_name,
    p.email,
    fm.relationship,
    fm.permission_level,
    fm.can_schedule,
    fm.can_view_history,
    fm.can_cancel,
    fm.status
  FROM public.family_members fm
  JOIN public.profiles p ON p.id = fm.family_member_id
  WHERE fm.user_id = user_uuid AND fm.status = 'active'
  ORDER BY fm.created_at DESC;
$function$;

-- Fix get_family_upcoming_activities function
CREATE OR REPLACE FUNCTION public.get_family_upcoming_activities(user_uuid uuid)
 RETURNS TABLE(activity_type text, patient_name text, patient_id uuid, title text, scheduled_date timestamp with time zone, urgency text, status text)
 LANGUAGE sql
 SECURITY DEFINER SET search_path = ''
AS $function$
  -- Consultas agendadas
  SELECT 
    'consultation' as activity_type,
    p.display_name as patient_name,
    c.paciente_id as patient_id,
    COALESCE(c.tipo_consulta, 'Consulta Médica') as title,
    c.data_consulta as scheduled_date,
    'normal' as urgency,
    c.status::TEXT as status
  FROM public.consultas c
  JOIN public.profiles p ON p.id = c.paciente_id
  WHERE (
    c.paciente_id = user_uuid OR 
    c.agendado_por = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = user_uuid 
      AND fm.family_member_id = c.paciente_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
  AND c.data_consulta >= NOW()
  AND c.status IN ('agendada', 'confirmada')
  
  UNION ALL
  
  -- Vacinas agendadas
  SELECT 
    'vaccine' as activity_type,
    p.display_name as patient_name,
    v.patient_id as patient_id,
    v.vaccine_name as title,
    v.next_dose_date::TIMESTAMP WITH TIME ZONE as scheduled_date,
    CASE 
      WHEN v.next_dose_date < CURRENT_DATE THEN 'high'
      WHEN v.next_dose_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'medium'
      ELSE 'normal'
    END as urgency,
    v.status as status
  FROM public.vaccination_records v
  JOIN public.profiles p ON p.id = v.patient_id
  WHERE (
    v.patient_id = user_uuid OR 
    v.created_by = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = user_uuid 
      AND fm.family_member_id = v.patient_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
  AND v.next_dose_date IS NOT NULL
  AND v.status IN ('scheduled', 'overdue')
  
  UNION ALL
  
  -- Exames agendados
  SELECT 
    'exam' as activity_type,
    p.display_name as patient_name,
    e.patient_id as patient_id,
    e.exam_name as title,
    e.scheduled_date as scheduled_date,
    CASE 
      WHEN e.urgent = true THEN 'high'
      ELSE 'normal'
    END as urgency,
    e.status as status
  FROM public.medical_exams e
  JOIN public.profiles p ON p.id = e.patient_id
  WHERE (
    e.patient_id = user_uuid OR 
    e.created_by = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = user_uuid 
      AND fm.family_member_id = e.patient_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
  AND e.scheduled_date IS NOT NULL
  AND e.scheduled_date >= NOW()
  AND e.status IN ('scheduled', 'pending_results')
  
  ORDER BY scheduled_date ASC, urgency DESC
  LIMIT 10;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Tenta inserir o novo perfil na tabela `public.profiles`
  INSERT INTO public.profiles (
    id, email, display_name, photo_url, user_type, onboarding_completed, last_login, is_active, preferences
  ) VALUES (
    NEW.id,
    NEW.email,
    -- Tenta obter o nome de várias fontes, ou usa o início do email como fallback
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL),
    NULL, -- Começa como nulo para o usuário escolher o tipo no onboarding
    false,
    NOW(),
    true,
    '{"notifications": true, "theme": "light", "language": "pt-BR"}'::jsonb
  );
  RETURN NEW;
EXCEPTION
  -- Se o perfil já existir (por uma tentativa anterior), simplesmente ignore o erro e continue.
  WHEN unique_violation THEN
    RAISE WARNING 'O perfil para o usuário % já existe. Ignorando a inserção duplicada.', NEW.id;
    RETURN NEW;
  -- Para qualquer outro erro, registre um aviso mas não impeça o login do usuário.
  WHEN OTHERS THEN
    RAISE WARNING 'Erro não tratado ao criar perfil para o usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix get_doctors_by_location_and_specialty function
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(p_specialty text, p_city text, p_state text)
 RETURNS TABLE(id uuid, display_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT DISTINCT p.id, p.display_name
  FROM public.profiles p
  JOIN public.medicos m ON p.id = m.user_id
  JOIN public.locais_atendimento la ON p.id = la.medico_id
  WHERE
    m.especialidades @> ARRAY[p_specialty]
    AND (la.endereco ->> 'cidade') = p_city
    AND (la.endereco ->> 'uf') = p_state
    AND la.ativo = true;
$function$;

-- Fix get_available_states function
CREATE OR REPLACE FUNCTION public.get_available_states()
 RETURNS TABLE(uf text)
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT DISTINCT (la.endereco ->> 'uf') AS uf
  FROM public.locais_atendimento la
  WHERE la.ativo = true
  ORDER BY uf;
$function$;

-- Fix get_available_cities function
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
 RETURNS TABLE(cidade text)
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
SELECT DISTINCT(endereco ->> 'cidade') as cidade
FROM public.locais_atendimento
WHERE ativo = true AND (endereco ->> 'uf') = state_uf
ORDER BY cidade;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix user deletion constraint issues by adding CASCADE DELETE
-- First, add CASCADE to medication_reminders foreign key
ALTER TABLE public.medication_reminders 
DROP CONSTRAINT IF EXISTS medication_reminders_user_id_fkey;

ALTER TABLE public.medication_reminders 
ADD CONSTRAINT medication_reminders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;