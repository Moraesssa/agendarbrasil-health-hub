
-- 1) Função de notificação para eventos de encaminhamento
create or replace function public.notify_referral_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_title text;
  v_message text;
  v_action_url text;
  v_type text;
  v_action_required boolean := false;
  v_priority text := 'normal';
  v_doctor_name text;
  v_origin_name text;
begin
  v_user_id := coalesce(NEW.paciente_id, OLD.paciente_id);

  -- Tentar obter nomes (se existirem perfis)
  if coalesce(NEW.medico_origem_id, OLD.medico_origem_id) is not null then
    select p.display_name into v_origin_name
    from public.profiles p
    where p.id = coalesce(NEW.medico_origem_id, OLD.medico_origem_id)
    limit 1;
  end if;

  if coalesce(NEW.medico_destino_id, OLD.medico_destino_id) is not null then
    select p.display_name into v_doctor_name
    from public.profiles p
    where p.id = coalesce(NEW.medico_destino_id, OLD.medico_destino_id)
    limit 1;
  end if;

  if TG_OP = 'INSERT' then
    v_title := 'Novo encaminhamento';
    v_type := 'referral_created';
    v_message := format(
      'Você foi encaminhado para %s por %s. Aguardando confirmação do médico de destino.',
      coalesce(NEW.especialidade, 'especialidade'),
      coalesce(v_origin_name, 'seu médico')
    );
    v_action_required := false;
    v_action_url := '/perfil';

  elsif TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    if NEW.status = 'aceito' then
      v_title := 'Encaminhamento aceito';
      v_type := 'referral_accepted';
      v_priority := 'high';
      v_action_required := true;
      v_message := format(
        'Dr(a). %s aceitou seu encaminhamento para %s. Escolha um horário para consulta.',
        coalesce(v_doctor_name, 'o médico'),
        coalesce(NEW.especialidade, 'especialidade')
      );
      v_action_url := '/agendamento?doctorId='||coalesce(NEW.medico_destino_id::text,'')||
                      '&specialty='||coalesce(NEW.especialidade,'')||
                      '&ref='||coalesce(NEW.id::text,'');

    elsif NEW.status = 'rejeitado' then
      v_title := 'Encaminhamento rejeitado';
      v_type := 'referral_rejected';
      v_message := 'O encaminhamento foi rejeitado. Entre em contato com seu médico para alternativas.';
      v_action_required := false;
      v_action_url := '/perfil';

    elsif NEW.status = 'realizado' then
      v_title := 'Encaminhamento concluído';
      v_type := 'referral_completed';
      v_message := 'Encaminhamento concluído. Consulte seu histórico para detalhes.';
      v_action_required := false;
      v_action_url := '/historico';

    else
      -- Outros status não geram notificação
      return NEW;
    end if;
  else
    return NEW;
  end if;

  insert into public.family_notifications (
    id, user_id, patient_id, title, message, notification_type,
    priority, action_required, action_url, read, created_at, scheduled_for
  ) values (
    gen_random_uuid(),
    v_user_id,
    v_user_id,
    v_title,
    v_message,
    v_type,
    v_priority,
    v_action_required,
    v_action_url,
    false,
    now(),
    now()
  );

  return NEW;
end;
$$;

-- 2) Trigger em encaminhamentos
drop trigger if exists trg_notify_encaminhamentos on public.encaminhamentos;
create trigger trg_notify_encaminhamentos
after insert or update of status on public.encaminhamentos
for each row
execute function public.notify_referral_event();

-- 3) Realtime + performance
alter table public.family_notifications replica identity full;
-- Adiciona a tabela à publicação de realtime (idempotente: erro se já existir, ignore se necessário via console)
do $$
begin
  perform 1
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'family_notifications';
  if not found then
    execute 'alter publication supabase_realtime add table public.family_notifications';
  end if;
end $$;

-- 4) Índices úteis
create index if not exists idx_family_notifications_user_created_at
  on public.family_notifications (user_id, created_at desc);

create index if not exists idx_family_notifications_read
  on public.family_notifications (read);
