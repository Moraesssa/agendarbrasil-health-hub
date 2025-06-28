
-- Criar tabela para tipos de serviços médicos
CREATE TABLE public.medical_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'consultation', 'exam', 'vaccine', 'triage', 'telemedicine'
  description TEXT,
  requires_preparation BOOLEAN DEFAULT false,
  preparation_instructions TEXT,
  typical_duration INTEGER DEFAULT 30, -- em minutos
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para triagem médica
CREATE TABLE public.medical_triage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  recommended_specialties TEXT[],
  initial_guidance TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'scheduled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para controle de vacinas
CREATE TABLE public.vaccination_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT NOT NULL, -- 'routine', 'travel', 'special'
  dose_number INTEGER,
  total_doses INTEGER,
  administered_date DATE,
  next_dose_date DATE,
  healthcare_provider TEXT,
  batch_number TEXT,
  adverse_reactions TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'administered', 'overdue', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para exames médicos
CREATE TABLE public.medical_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL, -- 'laboratory', 'imaging', 'cardio', 'other'
  exam_name TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  healthcare_provider TEXT,
  preparation_required BOOLEAN DEFAULT false,
  preparation_instructions TEXT,
  results_available BOOLEAN DEFAULT false,
  results_summary TEXT,
  urgent BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'pending_results')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para notificações familiares
CREATE TABLE public.family_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'appointment_reminder', 'vaccine_due', 'exam_result', 'emergency'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar tabela de consultas para incluir novos tipos
ALTER TABLE public.consultas 
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'consultation',
ADD COLUMN IF NOT EXISTS triage_id UUID REFERENCES public.medical_triage(id),
ADD COLUMN IF NOT EXISTS preparation_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para medical_services (público para leitura)
CREATE POLICY "Anyone can view medical services" 
ON public.medical_services 
FOR SELECT 
USING (is_active = true);

-- Políticas RLS para medical_triage
CREATE POLICY "Users can view family triage records" 
ON public.medical_triage 
FOR SELECT 
USING (
  auth.uid() = patient_id OR 
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = patient_id 
    AND fm.can_view_history = true 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Users can create triage records" 
ON public.medical_triage 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.family_member_id = patient_id 
      AND fm.can_schedule = true 
      AND fm.status = 'active'
    )
  )
);

-- Políticas RLS para vaccination_records
CREATE POLICY "Users can view family vaccination records" 
ON public.vaccination_records 
FOR SELECT 
USING (
  auth.uid() = patient_id OR 
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = patient_id 
    AND fm.can_view_history = true 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Users can create vaccination records" 
ON public.vaccination_records 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.family_member_id = patient_id 
      AND fm.can_schedule = true 
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Users can update vaccination records" 
ON public.vaccination_records 
FOR UPDATE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = patient_id 
    AND fm.can_schedule = true 
    AND fm.status = 'active'
  )
);

-- Políticas similares para medical_exams
CREATE POLICY "Users can view family exam records" 
ON public.medical_exams 
FOR SELECT 
USING (
  auth.uid() = patient_id OR 
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = patient_id 
    AND fm.can_view_history = true 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Users can create exam records" 
ON public.medical_exams 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.family_member_id = patient_id 
      AND fm.can_schedule = true 
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Users can update exam records" 
ON public.medical_exams 
FOR UPDATE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = patient_id 
    AND fm.can_schedule = true 
    AND fm.status = 'active'
  )
);

-- Políticas RLS para family_notifications
CREATE POLICY "Users can view their notifications" 
ON public.family_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" 
ON public.family_notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" 
ON public.family_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Inserir dados iniciais de serviços médicos
INSERT INTO public.medical_services (name, category, description, typical_duration) VALUES
('Consulta Clínica Geral', 'consultation', 'Consulta médica básica para avaliação geral', 30),
('Consulta Pediátrica', 'consultation', 'Consulta especializada para crianças', 30),
('Telemedicina', 'telemedicine', 'Consulta médica online por videoconferência', 20),
('Triagem Médica', 'triage', 'Avaliação inicial de sintomas e urgência', 15),
('Exame de Sangue', 'exam', 'Coleta e análise laboratorial de sangue', 15),
('Raio-X', 'exam', 'Exame de imagem por radiografia', 20),
('Ultrassonografia', 'exam', 'Exame de imagem por ultrassom', 30),
('Eletrocardiograma', 'exam', 'Exame do coração por eletrocardiografia', 15),
('Vacinação Rotina', 'vaccine', 'Aplicação de vacinas do calendário básico', 10),
('Vacinação Viagem', 'vaccine', 'Vacinas especiais para viagens internacionais', 15);

-- Função auxiliar para obter próximas atividades familiares
CREATE OR REPLACE FUNCTION public.get_family_upcoming_activities(user_uuid UUID)
RETURNS TABLE(
  activity_type TEXT,
  patient_name TEXT,
  patient_id UUID,
  title TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  urgency TEXT,
  status TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- Consultas agendadas
  SELECT 
    'consultation' as activity_type,
    p.display_name as patient_name,
    c.paciente_id as patient_id,
    COALESCE(c.tipo_consulta, 'Consulta Médica') as title,
    c.data_consulta as scheduled_date,
    'normal' as urgency,
    c.status::TEXT as status
  FROM public.consultas c
  JOIN public.profiles p ON p.id = c.paciente_id
  WHERE (
    c.paciente_id = user_uuid OR 
    c.agendado_por = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = user_uuid 
      AND fm.family_member_id = c.paciente_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
  AND c.data_consulta >= NOW()
  AND c.status IN ('agendada', 'confirmada')
  
  UNION ALL
  
  -- Vacinas agendadas
  SELECT 
    'vaccine' as activity_type,
    p.display_name as patient_name,
    v.patient_id as patient_id,
    v.vaccine_name as title,
    v.next_dose_date::TIMESTAMP WITH TIME ZONE as scheduled_date,
    CASE 
      WHEN v.next_dose_date < CURRENT_DATE THEN 'high'
      WHEN v.next_dose_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'medium'
      ELSE 'normal'
    END as urgency,
    v.status as status
  FROM public.vaccination_records v
  JOIN public.profiles p ON p.id = v.patient_id
  WHERE (
    v.patient_id = user_uuid OR 
    v.created_by = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = user_uuid 
      AND fm.family_member_id = v.patient_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
  AND v.next_dose_date IS NOT NULL
  AND v.status IN ('scheduled', 'overdue')
  
  UNION ALL
  
  -- Exames agendados
  SELECT 
    'exam' as activity_type,
    p.display_name as patient_name,
    e.patient_id as patient_id,
    e.exam_name as title,
    e.scheduled_date as scheduled_date,
    CASE 
      WHEN e.urgent = true THEN 'high'
      ELSE 'normal'
    END as urgency,
    e.status as status
  FROM public.medical_exams e
  JOIN public.profiles p ON p.id = e.patient_id
  WHERE (
    e.patient_id = user_uuid OR 
    e.created_by = user_uuid OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.user_id = user_uuid 
      AND fm.family_member_id = e.patient_id 
      AND fm.can_view_history = true 
      AND fm.status = 'active'
    )
  )
  AND e.scheduled_date IS NOT NULL
  AND e.scheduled_date >= NOW()
  AND e.status IN ('scheduled', 'pending_results')
  
  ORDER BY scheduled_date ASC, urgency DESC
  LIMIT 10;
$$;
