-- Add date parameter to get_doctor_schedule_v2
CREATE OR REPLACE FUNCTION public.get_doctor_schedule_v2(
  p_doctor_id uuid,
  p_date date
)
RETURNS TABLE(doctor_config jsonb, locations jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_config jsonb;
  v_horario jsonb;
  v_day_blocks jsonb;
  v_day_index integer;
  v_day_key text;
  v_duracao integer;
  v_buffer integer;
  v_slot_interval integer;
  v_requested_date date := COALESCE(p_date, CURRENT_DATE);
  v_locations jsonb := '[]'::jsonb;
  v_doctor_uuid uuid;
  block_record record;
  v_block jsonb;
  v_block_local text;
  v_block_active boolean;
  v_start_time time without time zone;
  v_end_time time without time zone;
  v_start_minutes integer;
  v_end_minutes integer;
  v_minutes integer;
  v_slot_time text;
  v_lunch_start time without time zone;
  v_lunch_end time without time zone;
  v_lunch_start_min integer;
  v_lunch_end_min integer;
BEGIN
  SELECT m.configuracoes
  INTO v_config
  FROM public.medicos m
  WHERE m.user_id = p_doctor_id;

  IF v_config IS NULL THEN
    RETURN QUERY SELECT NULL::jsonb, '[]'::jsonb;
    RETURN;
  END IF;

  v_duracao := COALESCE(NULLIF(btrim(v_config->>'duracaoConsulta'), '')::integer, 30);
  v_buffer := COALESCE(NULLIF(btrim(v_config->>'bufferMinutos'), '')::integer, 0);
  v_slot_interval := GREATEST(1, v_duracao + v_buffer);

  v_horario := v_config -> 'horarioAtendimento';
  IF v_horario IS NULL OR jsonb_typeof(v_horario) <> 'object' THEN
    RETURN QUERY SELECT v_config, '[]'::jsonb;
    RETURN;
  END IF;

  v_day_index := EXTRACT(ISODOW FROM v_requested_date)::integer;
  IF v_day_index IS NULL OR v_day_index < 1 OR v_day_index > 7 THEN
    v_day_index := 1;
  END IF;

  v_day_key := ARRAY['segunda','terca','quarta','quinta','sexta','sabado','domingo'][v_day_index];
  v_day_blocks := COALESCE(v_horario -> v_day_key, '[]'::jsonb);

  CREATE TEMP TABLE tmp_location_catalog (
    local_id text PRIMARY KEY,
    nome_local text
  ) ON COMMIT DROP;

  INSERT INTO tmp_location_catalog(local_id, nome_local)
  SELECT la.id::text, la.nome_local
  FROM public.locais_atendimento la
  WHERE la.medico_id = p_doctor_id
    AND la.ativo = true;

  IF NOT EXISTS (SELECT 1 FROM tmp_location_catalog) THEN
    RETURN QUERY SELECT v_config, '[]'::jsonb;
    RETURN;
  END IF;

  CREATE TEMP TABLE tmp_location_slots (
    local_id text,
    slot_time text,
    PRIMARY KEY (local_id, slot_time)
  ) ON COMMIT DROP;

  CREATE TEMP TABLE tmp_taken_slots (
    slot_time text,
    local_id text
  ) ON COMMIT DROP;

  SELECT d.id
  INTO v_doctor_uuid
  FROM public.doctors d
  WHERE d.profile_id = p_doctor_id
  LIMIT 1;

  IF v_doctor_uuid IS NOT NULL THEN
    INSERT INTO tmp_taken_slots(slot_time, local_id)
    SELECT DISTINCT
      to_char(a.start_time, 'HH24:MI'),
      COALESCE(a.local_id::text, '__ANY__')
    FROM public.appointments a
    WHERE a.doctor_id = v_doctor_uuid
      AND a.start_time::date = v_requested_date
      AND a.status IN ('pending','agendada','confirmada','scheduled','confirmed');
  END IF;

  INSERT INTO tmp_taken_slots(slot_time, local_id)
  SELECT DISTINCT
    to_char(c.consultation_date, 'HH24:MI'),
    COALESCE(c.local_id::text, '__ANY__')
  FROM public.consultas c
  WHERE c.medico_id = p_doctor_id
    AND c.consultation_date IS NOT NULL
    AND c.consultation_date::date = v_requested_date
    AND c.status IN ('agendada','confirmada','em_andamento','scheduled','confirmed');

  FOR block_record IN
    SELECT value
    FROM jsonb_array_elements(v_day_blocks) AS t(value)
  LOOP
    v_block := block_record.value;

    v_block_active := COALESCE((v_block->>'ativo')::boolean, true);
    IF NOT v_block_active THEN
      CONTINUE;
    END IF;

    v_block_local := btrim(COALESCE(v_block->>'local_id', ''));
    IF v_block_local = '' THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM tmp_location_catalog lc WHERE lc.local_id = v_block_local
    ) THEN
      CONTINUE;
    END IF;

    v_start_time := NULLIF(v_block->>'inicio', '')::time;
    v_end_time := NULLIF(v_block->>'fim', '')::time;
    IF v_start_time IS NULL OR v_end_time IS NULL THEN
      CONTINUE;
    END IF;

    v_start_minutes := (DATE_PART('hour', v_start_time) * 60 + DATE_PART('minute', v_start_time))::integer;
    v_end_minutes := (DATE_PART('hour', v_end_time) * 60 + DATE_PART('minute', v_end_time))::integer;
    IF v_end_minutes <= v_start_minutes THEN
      CONTINUE;
    END IF;

    v_lunch_start := NULLIF(v_block->>'inicioAlmoco', '')::time;
    v_lunch_end := NULLIF(v_block->>'fimAlmoco', '')::time;
    IF v_lunch_start IS NOT NULL AND v_lunch_end IS NOT NULL THEN
      v_lunch_start_min := (DATE_PART('hour', v_lunch_start) * 60 + DATE_PART('minute', v_lunch_start))::integer;
      v_lunch_end_min := (DATE_PART('hour', v_lunch_end) * 60 + DATE_PART('minute', v_lunch_end))::integer;
    ELSE
      v_lunch_start_min := NULL;
      v_lunch_end_min := NULL;
    END IF;

    v_minutes := v_start_minutes;
    WHILE v_minutes + v_duracao <= v_end_minutes LOOP
      IF v_lunch_start_min IS NOT NULL AND v_lunch_end_min IS NOT NULL THEN
        IF v_minutes < v_lunch_end_min AND (v_minutes + v_duracao) > v_lunch_start_min THEN
          v_minutes := v_minutes + v_slot_interval;
          CONTINUE;
        END IF;
      END IF;

      v_slot_time := lpad((v_minutes / 60)::text, 2, '0') || ':' || lpad((v_minutes % 60)::text, 2, '0');

      IF NOT EXISTS (
        SELECT 1 FROM tmp_taken_slots t
        WHERE t.slot_time = v_slot_time
          AND (t.local_id = v_block_local OR t.local_id = '__ANY__')
      ) THEN
        INSERT INTO tmp_location_slots(local_id, slot_time)
        VALUES (v_block_local, v_slot_time)
        ON CONFLICT DO NOTHING;
      END IF;

      v_minutes := v_minutes + v_slot_interval;
    END LOOP;
  END LOOP;

  SELECT COALESCE(jsonb_agg(loc_data ORDER BY loc_data->>'nome_local'), '[]'::jsonb)
  INTO v_locations
  FROM (
    SELECT jsonb_build_object(
      'id', lc.local_id,
      'nome_local', lc.nome_local,
      'horarios_disponiveis', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object('time', ls.slot_time, 'available', true)
            ORDER BY ls.slot_time
          )
          FROM tmp_location_slots ls
          WHERE ls.local_id = lc.local_id
        ),
        '[]'::jsonb
      )
    ) AS loc_data
    FROM tmp_location_catalog lc
    WHERE EXISTS (
      SELECT 1 FROM tmp_location_slots ls WHERE ls.local_id = lc.local_id
    )
  ) AS ordered_locations;

  RETURN QUERY SELECT v_config, v_locations;
END;
$function$;

COMMENT ON FUNCTION public.get_doctor_schedule_v2(uuid, date)
IS 'Retorna configurações e locais de um médico, filtrados por data quando suportado';

GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_v2(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_v2(uuid, date) TO anon;
