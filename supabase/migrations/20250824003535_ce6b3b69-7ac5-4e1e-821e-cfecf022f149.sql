
-- Step 2: Payments hardening + essential RPCs
-- Safe, additive migration relying on existing 'consultas' and RPCs

BEGIN;

-- 1) Create payment_method enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('credit', 'pix');
  END IF;
END;
$$;

-- 2) Harden public.payments table

-- Add payment_method column (enum) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.payments 
      ADD COLUMN payment_method public.payment_method;
  END IF;
END;
$$;

-- Ensure consultation_id has a foreign key to consultas (keep existing naming)
DO $$
BEGIN
  -- add constraint if not exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_consultation_fk'
  ) THEN
    -- Add as NOT VALID first to avoid failing on legacy rows; then validate
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_consultation_fk
      FOREIGN KEY (consultation_id)
      REFERENCES public.consultas(id)
      ON DELETE SET NULL
      NOT VALID;

    ALTER TABLE public.payments
      VALIDATE CONSTRAINT payments_consultation_fk;
  END IF;
END;
$$;

-- Indexes for performance and integrity
CREATE INDEX IF NOT EXISTS idx_payments_consultation_id ON public.payments (consultation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_session_id_unique ON public.payments (stripe_session_id);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Remove overly-permissive legacy policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'Allow all operations on payments'
  ) THEN
    DROP POLICY "Allow all operations on payments" ON public.payments;
  END IF;
END;
$$;

-- Service role: full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'payments_service_role_all'
  ) THEN
    CREATE POLICY payments_service_role_all
      ON public.payments
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- Patients and doctors: SELECT own payments via consultas linkage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'payments_select_patient_doctor'
  ) THEN
    CREATE POLICY payments_select_patient_doctor
      ON public.payments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 
          FROM public.consultas c
          WHERE c.id = public.payments.consultation_id
            AND (
              c.paciente_id = auth.uid()
              OR c.paciente_familiar_id = auth.uid()
              OR c.medico_id = auth.uid()
            )
        )
      );
  END IF;
END;
$$;

-- Patients: INSERT payments tied to their own consulta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'payments_insert_patient'
  ) THEN
    CREATE POLICY payments_insert_patient
      ON public.payments
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 
          FROM public.consultas c
          WHERE c.id = consultation_id
            AND (
              c.paciente_id = auth.uid()
              OR c.paciente_familiar_id = auth.uid()
            )
        )
      );
  END IF;
END;
$$;

-- Updates: by service role; optional patient update can be added later if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'payments_update_service_role'
  ) THEN
    CREATE POLICY payments_update_service_role
      ON public.payments
      FOR UPDATE
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;

-- Deletes: by service role only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payments' 
      AND policyname = 'payments_delete_service_role'
  ) THEN
    CREATE POLICY payments_delete_service_role
      ON public.payments
      FOR DELETE
      USING (auth.role() = 'service_role');
  END IF;
END;
$$;

-- 3) Minimal RPCs aligned with existing robust functions

-- 3.1 Reserve appointment (wrapper to existing reserve_appointment_slot)
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

-- 3.2 Confirm appointment (wrapper to existing confirm_appointment_payment)
CREATE OR REPLACE FUNCTION public.confirm_appointment_v2(
  p_appointment_id uuid,
  p_payment_intent_id text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Authentication required'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.success, c.message
  FROM public.confirm_appointment_payment(
    p_appointment_id,
    COALESCE(p_payment_intent_id, '')
  ) AS c(success boolean, message text);
END;
$$;

-- 3.3 Doctor schedule data (wrapper to existing get_doctor_schedule_data)
CREATE OR REPLACE FUNCTION public.get_doctor_schedule_v2(
  p_doctor_id uuid
)
RETURNS TABLE(doctor_config jsonb, locations jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM public.get_doctor_schedule_data(p_doctor_id);
$function$;

COMMIT;
