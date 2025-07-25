-- Adicionar campos para melhorar sistema de agendamento
ALTER TABLE public.consultas ADD COLUMN IF NOT EXISTS 
  cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS 
  rescheduled_from UUID REFERENCES public.consultas(id),
  ADD COLUMN IF NOT EXISTS 
  waiting_list_position INTEGER,
  ADD COLUMN IF NOT EXISTS 
  video_room_id TEXT,
  ADD COLUMN IF NOT EXISTS 
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS 
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS 
  auto_confirmed BOOLEAN DEFAULT false;

-- Criar tabela de reservas temporárias para evitar double booking
CREATE TABLE IF NOT EXISTS public.temporary_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL,
  paciente_id UUID NOT NULL,
  data_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
  local_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_temp_reservations_expires ON public.temporary_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_reservations_session ON public.temporary_reservations(session_id);

-- RLS para reservas temporárias
ALTER TABLE public.temporary_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reservations" 
ON public.temporary_reservations 
FOR INSERT 
WITH CHECK (auth.uid() = paciente_id);

CREATE POLICY "Users can view their own reservations" 
ON public.temporary_reservations 
FOR SELECT 
USING (auth.uid() = paciente_id);

CREATE POLICY "Users can delete their own reservations" 
ON public.temporary_reservations 
FOR DELETE 
USING (auth.uid() = paciente_id);

-- Criar tabela de lista de espera
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  medico_id UUID NOT NULL,
  data_preferencia DATE NOT NULL,
  periodo_preferencia TEXT CHECK (periodo_preferencia IN ('manha', 'tarde', 'noite', 'qualquer')),
  especialidade TEXT NOT NULL,
  local_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'notified', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para lista de espera
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their waiting list entries" 
ON public.waiting_list 
FOR ALL 
USING (auth.uid() = paciente_id);

CREATE POLICY "Doctors can view waiting list for their services" 
ON public.waiting_list 
FOR SELECT 
USING (auth.uid() = medico_id);

-- Função para limpar reservas expiradas automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.temporary_reservations 
  WHERE expires_at < now();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpeza automática (executa antes de inserções)
CREATE OR REPLACE TRIGGER cleanup_expired_reservations_trigger
  BEFORE INSERT ON public.temporary_reservations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_reservations();

-- Função para notificar lista de espera quando horário fica disponível
CREATE OR REPLACE FUNCTION public.notify_waiting_list()
RETURNS TRIGGER AS $$
BEGIN
  -- Se uma consulta foi cancelada, notificar lista de espera
  IF OLD.status IN ('agendada', 'confirmada') AND NEW.status = 'cancelada' THEN
    -- Marcar primeira pessoa da lista de espera como notificada
    UPDATE public.waiting_list 
    SET status = 'notified', updated_at = now()
    WHERE medico_id = NEW.medico_id 
      AND data_preferencia = NEW.data_consulta::date
      AND status = 'active'
      AND id = (
        SELECT id FROM public.waiting_list
        WHERE medico_id = NEW.medico_id 
          AND data_preferencia = NEW.data_consulta::date
          AND status = 'active'
        ORDER BY created_at
        LIMIT 1
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificação da lista de espera
CREATE OR REPLACE TRIGGER notify_waiting_list_trigger
  AFTER UPDATE ON public.consultas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_waiting_list();