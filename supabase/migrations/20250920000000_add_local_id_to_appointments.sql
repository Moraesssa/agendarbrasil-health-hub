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

COMMIT;
