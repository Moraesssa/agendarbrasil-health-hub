-- Fix consultas table structure and create missing function
-- This migration addresses column inconsistencies and creates the reserve_appointment_slot function

-- First, let's create the consultas table if it doesn't exist with consistent column names
CREATE TABLE IF NOT EXISTS public.consultas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL,
  medico_id UUID NOT NULL,
  paciente_familiar_id UUID, -- Add the missing column for family member appointments
  agendado_por UUID NOT NULL, -- Consistent with existing code
  data_consulta TIMESTAMP WITH TIME ZONE NOT NULL, -- Consistent with existing code
  tipo_consulta TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'scheduled', 'confirmed', 'cancelled', 'completed')),
  expires_at TIMESTAMP WITH TIME ZONE,
  local_id UUID,
  valor NUMERIC(10, 2),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns if they don't exist (idempotent migration)
DO $$ 
BEGIN
  -- Add paciente_familiar_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'paciente_familiar_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN paciente_familiar_id UUID;
  END IF;

  -- Add agendado_por column if it doesn't exist (consistent naming)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'agendado_por'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN agendado_por UUID NOT NULL DEFAULT gen_random_uuid();
  END IF;

  -- Add local_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'local_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN local_id UUID;
  END IF;

  -- Add expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'expires_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;-- Enab
le RLS
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints with proper error handling
DO $$
BEGIN
  -- Add foreign key for paciente_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'consultas_paciente_id_fkey'
    AND table_name = 'consultas'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas 
    ADD CONSTRAINT consultas_paciente_id_fkey 
    FOREIGN KEY (paciente_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for medico_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'consultas_medico_id_fkey'
    AND table_name = 'consultas'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas 
    ADD CONSTRAINT consultas_medico_id_fkey 
    FOREIGN KEY (medico_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for paciente_familiar_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'consultas_paciente_familiar_id_fkey'
    AND table_name = 'consultas'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas 
    ADD CONSTRAINT consultas_paciente_familiar_id_fkey 
    FOREIGN KEY (paciente_familiar_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for agendado_por
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'consultas_agendado_por_fkey'
    AND table_name = 'consultas'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas 
    ADD CONSTRAINT consultas_agendado_por_fkey 
    FOREIGN KEY (agendado_por) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;-- Cr
eate unique constraint to prevent double booking (using correct column name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultas_unique_slot 
ON public.consultas (medico_id, data_consulta) 
WHERE status IN ('scheduled', 'confirmed', 'pending_payment');

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico_id ON public.consultas (medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data_consulta ON public.consultas (data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas (status);
CREATE INDEX IF NOT EXISTS idx_consultas_expires_at ON public.consultas (expires_at) WHERE expires_at IS NOT NULL;

-- Create the reserve_appointment_slot function with correct column names and return type
CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_family_member_id UUID DEFAULT NULL,
  p_scheduled_by_id UUID,
  p_appointment_datetime TIMESTAMP WITH TIME ZONE,
  p_specialty TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, appointment_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_appointment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_slot_available BOOLEAN;
BEGIN
  -- Check if the slot is still available using correct column names
  SELECT NOT EXISTS (
    SELECT 1 FROM public.consultas 
    WHERE medico_id = p_doctor_id 
    AND data_consulta = p_appointment_datetime
    AND (
      status = 'scheduled' OR 
      status = 'confirmed' OR
      (status = 'pending_payment' AND expires_at > NOW())
    )
  ) INTO v_slot_available;

  IF NOT v_slot_available THEN
    RETURN QUERY SELECT FALSE, 'This time slot is no longer available.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Set expiration time (10 minutes from now for payment)
  v_expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Generate new appointment ID
  v_appointment_id := gen_random_uuid();

  -- Create the appointment reservation using correct column names
  INSERT INTO public.consultas (
    id,
    paciente_id,
    medico_id,
    paciente_familiar_id,
    agendado_por,
    data_consulta,
    tipo_consulta,
    status,
    expires_at
  ) VALUES (
    v_appointment_id,
    p_patient_id,
    p_doctor_id,
    p_family_member_id,
    p_scheduled_by_id,
    p_appointment_datetime,
    p_specialty,
    'pending_payment',
    v_expires_at
  );

  RETURN QUERY SELECT TRUE, 'Slot reserved successfully.'::TEXT, v_appointment_id;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT FALSE, 'This time slot is no longer available.'::TEXT, NULL::UUID;
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, ('Internal error: ' || SQLERRM)::TEXT, NULL::UUID;
END;
$$;-- Gra
nt execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reserve_appointment_slot TO authenticated;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "pacientes_select_own_consultas" ON public.consultas;
DROP POLICY IF EXISTS "medicos_select_own_consultas" ON public.consultas;
DROP POLICY IF EXISTS "pacientes_insert_consultas" ON public.consultas;
DROP POLICY IF EXISTS "authenticated_users_insert_consultas" ON public.consultas;
DROP POLICY IF EXISTS "pacientes_update_own_consultas" ON public.consultas;
DROP POLICY IF EXISTS "medicos_update_own_consultas" ON public.consultas;
DROP POLICY IF EXISTS "users_delete_own_consultas" ON public.consultas;

-- Create comprehensive RLS policies with better security
CREATE POLICY "pacientes_select_own_consultas" 
ON public.consultas 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = paciente_id OR 
  auth.uid() = paciente_familiar_id OR 
  auth.uid() = agendado_por
);

CREATE POLICY "medicos_select_own_consultas" 
ON public.consultas 
FOR SELECT 
TO authenticated
USING (auth.uid() = medico_id);

CREATE POLICY "authenticated_users_insert_consultas" 
ON public.consultas 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = agendado_por AND
  (auth.uid() = paciente_id OR paciente_familiar_id IS NULL OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'paciente'))
);

CREATE POLICY "pacientes_update_own_consultas" 
ON public.consultas 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = paciente_id OR 
  auth.uid() = agendado_por
)
WITH CHECK (
  auth.uid() = paciente_id OR 
  auth.uid() = agendado_por
);

CREATE POLICY "medicos_update_own_consultas" 
ON public.consultas 
FOR UPDATE 
TO authenticated
USING (auth.uid() = medico_id)
WITH CHECK (auth.uid() = medico_id);

CREATE POLICY "users_delete_own_consultas" 
ON public.consultas 
FOR DELETE 
TO authenticated
USING (
  auth.uid() = paciente_id OR 
  auth.uid() = medico_id OR 
  auth.uid() = agendado_por
);-- Add 
trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_consultas_updated_at'
    AND event_object_table = 'consultas'
    AND event_object_schema = 'public'
  ) THEN
    CREATE TRIGGER update_consultas_updated_at
    BEFORE UPDATE ON public.consultas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Add helpful comments for documentation
COMMENT ON TABLE public.consultas IS 'Medical appointments table with support for family member scheduling';
COMMENT ON COLUMN public.consultas.paciente_familiar_id IS 'Optional family member ID for whom the appointment is scheduled';
COMMENT ON COLUMN public.consultas.agendado_por IS 'User ID who scheduled the appointment';
COMMENT ON COLUMN public.consultas.expires_at IS 'Expiration time for payment reservation';
COMMENT ON COLUMN public.consultas.data_consulta IS 'Appointment date and time';
COMMENT ON COLUMN public.consultas.status IS 'Appointment status: pending_payment, scheduled, confirmed, cancelled, completed';

-- Create function to clean up expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.consultas 
  WHERE status = 'pending_payment' 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations TO authenticated;

COMMENT ON FUNCTION public.cleanup_expired_reservations IS 'Removes expired appointment reservations that were not paid for';
COMMENT ON FUNCTION public.reserve_appointment_slot IS 'Reserves an appointment slot with payment expiration time';