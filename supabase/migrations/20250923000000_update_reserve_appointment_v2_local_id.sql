BEGIN;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS local_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'locais_atendimento'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND constraint_name = 'appointments_local_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_local_id_fkey
      FOREIGN KEY (local_id)
      REFERENCES public.locais_atendimento(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

UPDATE public.appointments a
SET local_id = c.local_id
FROM public.consultas c
JOIN public.doctors d ON d.id = a.doctor_id
WHERE c.medico_id = d.profile_id
  AND c.consultation_date IS NOT NULL
  AND c.consultation_date = a.start_time
  AND c.local_id IS NOT NULL
  AND (a.local_id IS DISTINCT FROM c.local_id)
  AND (a.patient_id = c.paciente_id OR a.patient_id = c.paciente_familiar_id);

CREATE OR REPLACE FUNCTION public.reserve_appointment_v2(
  p_doctor_id uuid,
  p_appointment_datetime timestamptz,
  p_specialty text DEFAULT NULL,
  p_family_member_id uuid DEFAULT NULL,
  p_local_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, appointment_id uuid, message text)
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
    RETURN QUERY SELECT FALSE, NULL::uuid, 'Authentication required'::text;
    RETURN;
  END IF;

  SELECT r.success, r.appointment_id, r.message
  INTO v_result
  FROM public.reserve_appointment_slot(
    p_doctor_id,
    auth.uid(),                -- p_patient_id
    p_family_member_id,        -- p_family_member_id
    auth.uid(),                -- p_scheduled_by_id
    p_appointment_datetime,    -- p_appointment_datetime
    p_specialty                -- p_specialty
  ) AS r(success boolean, appointment_id uuid, message text);

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::uuid, 'Não foi possível reservar o horário'::text;
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
