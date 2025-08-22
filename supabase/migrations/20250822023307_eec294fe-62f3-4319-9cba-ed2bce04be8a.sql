-- PHASE 1.2: Fix temporary_reservations with existing structure
-- Add missing columns to existing table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temporary_reservations' AND column_name = 'status') THEN
    ALTER TABLE public.temporary_reservations ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temporary_reservations' AND column_name = 'updated_at') THEN
    ALTER TABLE public.temporary_reservations ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temporary_reservations' AND column_name = 'specialty') THEN
    ALTER TABLE public.temporary_reservations ADD COLUMN specialty text NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temporary_reservations' AND column_name = 'notes') THEN
    ALTER TABLE public.temporary_reservations ADD COLUMN notes text NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'temporary_reservations' AND column_name = 'paciente_familiar_id') THEN
    ALTER TABLE public.temporary_reservations ADD COLUMN paciente_familiar_id uuid NULL;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.temporary_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for existing structure (medico_id, paciente_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'temporary_reservations' AND policyname = 'Users can manage their own reservations'
  ) THEN
    CREATE POLICY "Users can manage their own reservations"
    ON public.temporary_reservations
    FOR ALL TO authenticated
    USING (auth.uid() = paciente_id OR auth.uid() = COALESCE(paciente_familiar_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WITH CHECK (auth.uid() = paciente_id OR auth.uid() = COALESCE(paciente_familiar_id, '00000000-0000-0000-0000-000000000000'::uuid));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'temporary_reservations' AND policyname = 'Doctors can view reservations for them'
  ) THEN
    CREATE POLICY "Doctors can view reservations for them"
    ON public.temporary_reservations
    FOR SELECT TO authenticated
    USING (auth.uid() = medico_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'temporary_reservations' AND policyname = 'Service role manage reservations'
  ) THEN
    CREATE POLICY "Service role manage reservations"
    ON public.temporary_reservations
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add foreign keys with existing column names (NOT VALID to avoid issues)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_medico_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_paciente_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_paciente_familiar_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_paciente_familiar_id_fkey FOREIGN KEY (paciente_familiar_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'temporary_reservations_local_id_fkey') THEN
    ALTER TABLE public.temporary_reservations
    ADD CONSTRAINT temporary_reservations_local_id_fkey FOREIGN KEY (local_id) REFERENCES public.locais_atendimento(id) ON DELETE SET NULL NOT VALID;
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

-- Update extend function to use correct column names
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