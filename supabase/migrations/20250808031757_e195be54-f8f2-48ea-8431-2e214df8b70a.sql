
-- 1) Função para notificar paciente em eventos de encaminhamento
CREATE OR REPLACE FUNCTION public.notify_referral_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  paciente_name text;
  origem_name   text;
  destino_name  text;
  notif_title   text;
  notif_message text;
  notif_type    text;
  action_url    text;
BEGIN
  -- Buscar nomes para mensagens amigáveis
  SELECT display_name INTO paciente_name FROM public.profiles WHERE id = NEW.paciente_id;
  SELECT display_name INTO origem_name   FROM public.profiles WHERE id = NEW.medico_origem_id;
  IF NEW.medico_destino_id IS NOT NULL THEN
    SELECT display_name INTO destino_name FROM public.profiles WHERE id = NEW.medico_destino_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Novo encaminhamento criado
    notif_type    := 'encaminhamento_criado';
    notif_title   := 'Novo Encaminhamento';
    notif_message := COALESCE(origem_name,'Seu médico') || ' encaminhou você para ' || NEW.especialidade ||
                     CASE WHEN destino_name IS NOT NULL THEN ' com ' || destino_name ELSE '' END || '.';
    action_url    := NULL; -- opcional: '/agendamento?especialidade=' || NEW.especialidade;

    INSERT INTO public.family_notifications
      (user_id, patient_id, notification_type, title, message, priority, action_required, action_url)
    VALUES
      (NEW.paciente_id, NEW.paciente_id, notif_type, notif_title, notif_message, 'normal', false, action_url);

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notificar quando o status mudar
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'aceito' THEN
        notif_type    := 'encaminhamento_aceito';
        notif_title   := 'Encaminhamento Aceito';
        notif_message := 'Seu encaminhamento para ' || NEW.especialidade || ' foi aceito por ' ||
                         COALESCE(destino_name,'o médico') || '. Você já pode agendar a consulta.';
        action_url    := '/agendamento?medicoId=' || COALESCE(NEW.medico_destino_id::text,'') ||
                         '&especialidade=' || NEW.especialidade;

        INSERT INTO public.family_notifications
          (user_id, patient_id, notification_type, title, message, priority, action_required, action_url)
        VALUES
          (NEW.paciente_id, NEW.paciente_id, notif_type, notif_title, notif_message, 'high', true, action_url);

      ELSIF NEW.status = 'rejeitado' THEN
        notif_type    := 'encaminhamento_rejeitado';
        notif_title   := 'Encaminhamento Não Disponível';
        notif_message := 'O encaminhamento para ' || NEW.especialidade || ' não pôde ser aceito por ' ||
                         COALESCE(destino_name,'o médico') || '. Seu médico de origem será avisado.';
        action_url    := NULL;

        INSERT INTO public.family_notifications
          (user_id, patient_id, notification_type, title, message, priority, action_required, action_url)
        VALUES
          (NEW.paciente_id, NEW.paciente_id, notif_type, notif_title, notif_message, 'normal', false, action_url);

      ELSIF NEW.status = 'realizado' THEN
        notif_type    := 'encaminhamento_realizado';
        notif_title   := 'Encaminhamento Concluído';
        notif_message := 'O encaminhamento para ' || NEW.especialidade || ' foi concluído.';
        action_url    := NULL;

        INSERT INTO public.family_notifications
          (user_id, patient_id, notification_type, title, message, priority, action_required, action_url)
        VALUES
          (NEW.paciente_id, NEW.paciente_id, notif_type, notif_title, notif_message, 'normal', false, action_url);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Triggers: inserir e atualizar
DROP TRIGGER IF EXISTS trg_notify_referral_insert ON public.encaminhamentos;
CREATE TRIGGER trg_notify_referral_insert
AFTER INSERT ON public.encaminhamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_referral_events();

DROP TRIGGER IF EXISTS trg_notify_referral_update ON public.encaminhamentos;
CREATE TRIGGER trg_notify_referral_update
AFTER UPDATE OF status, medico_destino_id ON public.encaminhamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_referral_events();

-- 3) Garantir dados completos para Realtime e assinatura
ALTER TABLE IF EXISTS public.family_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'family_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.family_notifications';
  END IF;
END $$;
