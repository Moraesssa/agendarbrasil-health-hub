-- Criar tabela de notificações para médicos
CREATE TABLE IF NOT EXISTS public.medico_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('appointment', 'system', 'message', 'info', 'warning', 'success')),
  title text NOT NULL,
  description text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medico_notifications_medico_id ON public.medico_notifications(medico_id);
CREATE INDEX IF NOT EXISTS idx_medico_notifications_read ON public.medico_notifications(read);
CREATE INDEX IF NOT EXISTS idx_medico_notifications_created_at ON public.medico_notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.medico_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Médicos só podem ver suas próprias notificações
CREATE POLICY "Médicos podem ver suas notificações"
  ON public.medico_notifications
  FOR SELECT
  USING (auth.uid() = medico_id);

CREATE POLICY "Médicos podem atualizar suas notificações"
  ON public.medico_notifications
  FOR UPDATE
  USING (auth.uid() = medico_id);

-- Sistema pode criar notificações
CREATE POLICY "Sistema pode criar notificações"
  ON public.medico_notifications
  FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_medico_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_medico_notification_timestamp
  BEFORE UPDATE ON public.medico_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_medico_notification_timestamp();

-- Comentários
COMMENT ON TABLE public.medico_notifications IS 'Notificações para médicos - consultas, alertas e mensagens do sistema';
COMMENT ON COLUMN public.medico_notifications.type IS 'Tipo: appointment, system, message, info, warning, success';
COMMENT ON COLUMN public.medico_notifications.read IS 'Flag indicando se notificação foi lida';
