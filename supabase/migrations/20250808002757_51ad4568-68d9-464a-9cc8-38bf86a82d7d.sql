-- Phase 1 — Database corrections to align statuses, improve integrity and stability

-- 1) Align confirm_appointment_payment with frontend statuses
CREATE OR REPLACE FUNCTION public.confirm_appointment_payment(p_appointment_id uuid, p_payment_intent_id text)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    UPDATE public.consultas
    SET
        status = 'agendada',
        status_pagamento = 'pago',
        expires_at = NULL
    WHERE id = p_appointment_id
      AND (status IN ('pending', 'pending_payment', 'agendada') OR status IS NULL);

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'Consulta confirmada com sucesso.'::text;
    ELSE
        RETURN QUERY SELECT FALSE, 'Consulta não encontrada ou já processada.'::text;
    END IF;
END;
$$;

-- 2) Performance and integrity indexes (safe, idempotent)
CREATE INDEX IF NOT EXISTS idx_consultas_medico_date ON public.consultas (medico_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_date ON public.consultas (paciente_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultas_status_pagamento ON public.consultas (status_pagamento);

-- Prevent double-booking on confirmed/active slots
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultas_unique_slot_confirmed
ON public.consultas (medico_id, consultation_date)
WHERE status IN ('agendada','confirmada');

-- 3) Harden functions flagged by linter: set stable search_path
CREATE OR REPLACE FUNCTION public.update_location_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    NEW.ultima_atualizacao = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_location_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'location_status_change',
            json_build_object(
                'location_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'medico_id', NEW.medico_id,
                'timestamp', NOW()
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_facility_data(facilidades_json jsonb)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    facility JSONB;
    valid_types TEXT[] := ARRAY['estacionamento', 'acessibilidade', 'farmacia', 'laboratorio', 'wifi', 'ar_condicionado', 'elevador', 'cafe', 'banheiro_adaptado', 'sala_espera_criancas'];
    valid_costs TEXT[] := ARRAY['gratuito', 'pago', 'nao_informado'];
BEGIN
    IF jsonb_typeof(facilidades_json) != 'array' THEN
        RETURN FALSE;
    END IF;

    FOR facility IN SELECT jsonb_array_elements(facilidades_json)
    LOOP
        IF NOT (facility ? 'type' AND facility ? 'available') THEN
            RETURN FALSE;
        END IF;

        IF NOT (facility->>'type' = ANY(valid_types)) THEN
            RETURN FALSE;
        END IF;

        IF jsonb_typeof(facility->'available') != 'boolean' THEN
            RETURN FALSE;
        END IF;

        IF facility ? 'cost' AND NOT (facility->>'cost' = ANY(valid_costs)) THEN
            RETURN FALSE;
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$;