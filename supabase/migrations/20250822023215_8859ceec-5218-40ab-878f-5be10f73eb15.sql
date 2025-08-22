-- PHASE 1.2: Create temporary_reservations table with proper structure
CREATE TABLE IF NOT EXISTS public.temporary_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  family_member_id uuid NULL,
  appointment_datetime timestamptz NOT NULL,
  specialty text NULL,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notes text NULL
);

-- Enable RLS
ALTER TABLE public.temporary_reservations ENABLE ROW LEVEL SECURITY;

-- Create basic service role policy first
CREATE POLICY "Service role manage reservations"
ON public.temporary_reservations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add foreign keys (NOT VALID to avoid issues with existing data)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_doctor_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_patient_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_family_member_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_family_member_id_fkey FOREIGN KEY (family_member_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- Add triggers
DROP TRIGGER IF EXISTS trg_tr_updated_at ON public.temporary_reservations;
CREATE TRIGGER trg_tr_updated_at
BEFORE UPDATE ON public.temporary_reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tr_cleanup_expired ON public.temporary_reservations;
CREATE TRIGGER trg_tr_cleanup_expired
AFTER INSERT OR UPDATE OR DELETE ON public.temporary_reservations
FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_expired_reservations();

-- Function to extend temporary reservations
CREATE OR REPLACE FUNCTION public.extend_temporary_reservation(p_session_id text, p_minutes integer DEFAULT 10)
RETURNS TABLE(success boolean, expires_at timestamptz, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_expires timestamptz;
BEGIN
  UPDATE public.temporary_reservations
  SET expires_at = now() + make_interval(mins => GREATEST(1, p_minutes)),
      updated_at = now()
  WHERE session_id = p_session_id
    AND status = 'active'
    AND expires_at > now()
  RETURNING expires_at INTO v_new_expires;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_new_expires, 'Reservation extended';
  ELSE
    RETURN QUERY SELECT FALSE, NULL::timestamptz, 'Reservation not found or expired';
  END IF;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.extend_temporary_reservation(text, integer) TO authenticated, service_role;

-- Documentation
COMMENT ON TABLE public.temporary_reservations IS 'Temporary holds for appointment slots with expiration and RLS per user/doctor.';