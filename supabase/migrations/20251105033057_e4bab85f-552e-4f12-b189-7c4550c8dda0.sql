-- Create user_preferences table for storing dashboard preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, preference_type)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Inserir consultas de teste para desenvolvimento
INSERT INTO public.consultas (medico_id, paciente_id, consultation_date, consultation_type, status, status_pagamento, patient_name, patient_email)
SELECT 
  m.user_id as medico_id,
  p.user_id as paciente_id,
  (now() + (random() * interval '7 days'))::timestamp as consultation_date,
  CASE WHEN random() > 0.5 THEN 'teleconsulta' ELSE 'presencial' END as consultation_type,
  CASE 
    WHEN random() > 0.7 THEN 'confirmed'
    WHEN random() > 0.4 THEN 'pending'
    ELSE 'agendada'
  END as status,
  CASE WHEN random() > 0.6 THEN 'pago' ELSE 'pendente' END as status_pagamento,
  'Paciente Teste ' || floor(random() * 100)::text as patient_name,
  'paciente' || floor(random() * 100)::text || '@teste.com' as patient_email
FROM 
  public.medicos m
  CROSS JOIN public.pacientes p
LIMIT 15
ON CONFLICT DO NOTHING;