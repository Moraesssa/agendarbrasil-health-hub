
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
  p_family_member_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, appointment_id uuid, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::uuid, 'Authentication required'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.success, r.appointment_id, r.message
  FROM public.reserve_appointment_slot(
    p_doctor_id,
    auth.uid(),                -- p_patient_id
    p_family_member_id,        -- p_family_member_id
    auth.uid(),                -- p_scheduled_by_id
    p_appointment_datetime,    -- p_appointment_datetime
    p_specialty                -- p_specialty
  ) AS r(success boolean, appointment_id uuid, message text);
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
