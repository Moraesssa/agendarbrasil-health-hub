BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(
    p_doctor_id uuid,
    p_patient_id uuid,
    p_family_member_id uuid,
    p_scheduled_by_id uuid,
    p_appointment_datetime timestamp with time zone,
    p_specialty text
)
RETURNS TABLE(success boolean, appointment_id bigint, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_slot_available boolean;
    v_new_appointment_id bigint;
    v_expiration_time timestamptz := now() + interval '15 minutes';
    v_patient_name text;
    v_patient_email text;
BEGIN
    IF p_doctor_id IS NULL OR p_patient_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::bigint, 'IDs de médico e paciente são obrigatórios'::text;
        RETURN;
    END IF;

    IF p_appointment_datetime IS NULL OR p_appointment_datetime <= now() THEN
        RETURN QUERY SELECT FALSE, NULL::bigint, 'Data e horário da consulta inválidos'::text;
        RETURN;
    END IF;

    SELECT NOT EXISTS (
        SELECT 1
        FROM public.consultas c
        WHERE c.medico_id = p_doctor_id
          AND c.consultation_date = p_appointment_datetime
          AND (
            c.status IN ('scheduled', 'agendada', 'confirmada') OR
            (c.status IN ('pending_payment', 'pending') AND c.expires_at > now()) OR
            (c.status_pagamento = 'pendente' AND c.expires_at > now())
          )
    )
    INTO v_slot_available;

    IF v_slot_available THEN
        SELECT display_name, email
        INTO v_patient_name, v_patient_email
        FROM public.profiles
        WHERE id = COALESCE(p_family_member_id, p_patient_id)
        LIMIT 1;

        v_patient_name := COALESCE(v_patient_name, 'Paciente');
        v_patient_email := COALESCE(v_patient_email, 'contato@agendarbrasil.com');

        INSERT INTO public.consultas (
            medico_id,
            paciente_id,
            paciente_familiar_id,
            consultation_date,
            consultation_type,
            status,
            status_pagamento,
            expires_at,
            patient_name,
            patient_email,
            notes
        )
        VALUES (
            p_doctor_id,
            p_patient_id,
            p_family_member_id,
            p_appointment_datetime,
            COALESCE(p_specialty, 'Consulta Médica'),
            'agendada',
            'pendente',
            v_expiration_time,
            v_patient_name,
            v_patient_email,
            'Consulta agendada via sistema - ' || now()::text
        )
        RETURNING id
        INTO v_new_appointment_id;

        RETURN QUERY SELECT TRUE, v_new_appointment_id, 'Horário reservado com sucesso'::text;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::bigint, 'Este horário não está mais disponível'::text;
    END IF;

EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT FALSE, NULL::bigint, 'Este horário já foi ocupado por outro paciente'::text;
    WHEN foreign_key_violation THEN
        RETURN QUERY SELECT FALSE, NULL::bigint, 'Dados de médico ou paciente inválidos'::text;
    WHEN OTHERS THEN
        INSERT INTO public.security_audit_log (table_name, operation, user_id, changed_data)
        VALUES (
            'consultas',
            'ERROR',
            auth.uid(),
            jsonb_build_object(
                'error', SQLERRM,
                'doctor_id', p_doctor_id,
                'patient_id', p_patient_id
            )
        );

        RETURN QUERY SELECT FALSE, NULL::bigint, 'Erro interno do sistema. Tente novamente.'::text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_appointment_v2(
  p_doctor_id uuid,
  p_appointment_datetime timestamptz,
  p_specialty text DEFAULT NULL,
  p_family_member_id uuid DEFAULT NULL,
  p_local_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, appointment_id bigint, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result record;
  v_consultation_date timestamptz;
  v_paciente_id uuid;
  v_paciente_familiar_id uuid;
  v_status_text text;
  v_notes text;
  v_existing_local uuid;
  v_final_local uuid;
  v_doctor_uuid uuid;
  v_location_uuid uuid;
  v_patient uuid;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_status public.appointment_status := 'pending';
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::bigint, 'Authentication required'::text;
    RETURN;
  END IF;

  SELECT r.success, r.appointment_id, r.message
  INTO v_result
  FROM public.reserve_appointment_slot(
    p_doctor_id,
    auth.uid(),
    p_family_member_id,
    auth.uid(),
    p_appointment_datetime,
    p_specialty
  ) AS r(success boolean, appointment_id bigint, message text);

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::bigint, 'Não foi possível reservar o horário'::text;
    RETURN;
  END IF;

  IF v_result.success AND v_result.appointment_id IS NOT NULL THEN
    SELECT
      c.consultation_date,
      c.paciente_id,
      c.paciente_familiar_id,
      c.status,
      c.notes,
      c.local_id
    INTO
      v_consultation_date,
      v_paciente_id,
      v_paciente_familiar_id,
      v_status_text,
      v_notes,
      v_existing_local
    FROM public.consultas c
    WHERE c.id = v_result.appointment_id;

    v_final_local := COALESCE(p_local_id, v_existing_local);

    IF v_final_local IS NOT NULL AND v_existing_local IS DISTINCT FROM v_final_local THEN
      UPDATE public.consultas
      SET local_id = v_final_local
      WHERE id = v_result.appointment_id;
    END IF;

    v_start_time := COALESCE(v_consultation_date, p_appointment_datetime);
    v_end_time := v_start_time + interval '30 minutes';
    v_patient := COALESCE(p_family_member_id, v_paciente_familiar_id, v_paciente_id, auth.uid());

    v_status := CASE
      WHEN v_status_text IN ('confirmada', 'confirmed') THEN 'confirmada'
      WHEN v_status_text IN ('cancelada', 'cancelled') THEN 'cancelada'
      WHEN v_status_text IN ('agendada', 'scheduled') THEN 'agendada'
      ELSE 'pending'
    END::public.appointment_status;

    SELECT d.id
    INTO v_doctor_uuid
    FROM public.doctors d
    WHERE d.profile_id = p_doctor_id
    LIMIT 1;

    IF v_doctor_uuid IS NOT NULL THEN
      IF v_final_local IS NOT NULL THEN
        SELECT loc.id
        INTO v_location_uuid
        FROM public.locations loc
        JOIN public.locais_atendimento la ON la.id = v_final_local
        WHERE loc.doctor_id = v_doctor_uuid
        ORDER BY CASE WHEN loc.name = la.nome_local THEN 0 ELSE 1 END
        LIMIT 1;
      ELSE
        v_location_uuid := NULL;
      END IF;

      BEGIN
        INSERT INTO public.appointments (
          id,
          patient_id,
          doctor_id,
          location_id,
          local_id,
          start_time,
          end_time,
          status,
          notes
        )
        VALUES (
          v_result.appointment_id,
          v_patient,
          v_doctor_uuid,
          v_location_uuid,
          v_final_local,
          v_start_time,
          v_end_time,
          v_status,
          v_notes
        )
        ON CONFLICT (id) DO UPDATE
        SET
          patient_id = EXCLUDED.patient_id,
          doctor_id = EXCLUDED.doctor_id,
          location_id = EXCLUDED.location_id,
          local_id = EXCLUDED.local_id,
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes;
      EXCEPTION
        WHEN OTHERS THEN
          INSERT INTO public.security_audit_log (table_name, operation, user_id, changed_data)
          VALUES (
            'appointments',
            'ERROR',
            auth.uid(),
            jsonb_build_object(
              'error', SQLERRM,
              'appointment_id', v_result.appointment_id,
              'doctor_profile_id', p_doctor_id,
              'local_id', v_final_local
            )
          );
      END;
    ELSE
      INSERT INTO public.security_audit_log (table_name, operation, user_id, changed_data)
      VALUES (
        'appointments',
        'MISSING_DOCTOR_MAPPING',
        auth.uid(),
        jsonb_build_object(
          'appointment_id', v_result.appointment_id,
          'doctor_profile_id', p_doctor_id,
          'local_id', v_final_local
        )
      );
    END IF;
  END IF;

  RETURN QUERY SELECT v_result.success, v_result.appointment_id, v_result.message;
END;
$$;

COMMIT;
