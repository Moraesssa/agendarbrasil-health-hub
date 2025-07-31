-- Adicionar apenas a coluna paciente_familiar_id que está faltando
-- Esta é uma operação segura que não afeta dados existentes

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultas' 
    AND column_name = 'paciente_familiar_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.consultas ADD COLUMN paciente_familiar_id UUID;
    RAISE NOTICE 'Coluna paciente_familiar_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna paciente_familiar_id já existe';
  END IF;
END $$;

-- Adicionar foreign key constraint se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'consultas_paciente_familiar_id_fkey'
    AND table_name = 'consultas'
  ) THEN
    ALTER TABLE public.consultas 
    ADD CONSTRAINT consultas_paciente_familiar_id_fkey 
    FOREIGN KEY (paciente_familiar_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Foreign key constraint adicionada';
  ELSE
    RAISE NOTICE 'Foreign key constraint já existe';
  END IF;
END $$;

-- Criar a função reserve_appointment_slot se não existir
CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_family_member_id UUID DEFAULT NULL,
  p_scheduled_by_id UUID,
  p_appointment_datetime TIMESTAMP WITH TIME ZONE,
  p_specialty TEXT
)
RETURNS TABLE(success BOOLEAN, appointment_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if the slot is still available
  IF EXISTS (
    SELECT 1 FROM public.consultas 
    WHERE medico_id = p_doctor_id 
    AND consultation_date = p_appointment_datetime
    AND status IN ('agendada', 'confirmada')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Este horário já foi ocupado por outro paciente'::TEXT;
    RETURN;
  END IF;

  -- Set expiration time (15 minutes from now for payment)
  v_expires_at := NOW() + INTERVAL '15 minutes';
  
  -- Generate new appointment ID
  v_appointment_id := gen_random_uuid();

  -- Create the appointment reservation
  INSERT INTO public.consultas (
    id,
    patient_name,
    patient_email,
    consultation_date,
    consultation_type,
    notes,
    status,
    status_pagamento,
    expires_at,
    paciente_id,
    medico_id,
    paciente_familiar_id
  ) VALUES (
    v_appointment_id,
    COALESCE(
      (SELECT display_name FROM public.profiles WHERE id = COALESCE(p_family_member_id, p_patient_id)),
      'Paciente'
    ),
    COALESCE(
      (SELECT email FROM public.profiles WHERE id = COALESCE(p_family_member_id, p_patient_id)),
      'email@exemplo.com'
    ),
    p_appointment_datetime,
    p_specialty,
    'Consulta agendada via sistema',
    'agendada',
    'pendente',
    v_expires_at,
    p_patient_id,
    p_doctor_id,
    p_family_member_id
  );

  RETURN QUERY SELECT TRUE, v_appointment_id, 'Horário reservado com sucesso'::TEXT;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Este horário já foi ocupado por outro paciente'::TEXT;
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, ('Erro interno: ' || SQLERRM)::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.reserve_appointment_slot TO authenticated;

COMMENT ON COLUMN public.consultas.paciente_familiar_id IS 'ID do familiar para quem a consulta foi agendada (opcional)';