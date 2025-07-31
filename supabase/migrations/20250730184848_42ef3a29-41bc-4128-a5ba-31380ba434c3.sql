-- Corrigir a função reserve_appointment_slot para usar os nomes corretos das colunas
CREATE OR REPLACE FUNCTION public.reserve_appointment_slot(p_doctor_id uuid, p_patient_id uuid, p_family_member_id uuid, p_scheduled_by_id uuid, p_appointment_datetime timestamp with time zone, p_specialty text)
 RETURNS TABLE(success boolean, message text, appointment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_slot_available BOOLEAN;
    v_new_appointment_id UUID;
    v_expiration_time TIMESTAMPTZ := now() + interval '10 minutes';
BEGIN
    -- Check if a slot is already scheduled or pending for the same doctor and time
    SELECT NOT EXISTS (
        SELECT 1
        FROM public.consultas c
        WHERE c.medico_id = p_doctor_id
          AND c.consultation_date = p_appointment_datetime
          AND (
            c.status = 'scheduled' OR
            (c.status = 'pending_payment' AND c.expires_at > now())
          )
    ) INTO v_slot_available;

    IF v_slot_available THEN
        -- Insert a new appointment with 'pending_payment' status
        INSERT INTO public.consultas (
            medico_id,
            paciente_id,
            paciente_familiar_id,
            agendado_por,
            consultation_date,
            consultation_type,
            status,
            expires_at
        )
        VALUES (
            p_doctor_id,
            p_patient_id,
            p_family_member_id,
            p_scheduled_by_id,
            p_appointment_datetime,
            p_specialty,
            'pending_payment',
            v_expiration_time
        )
        RETURNING id INTO v_new_appointment_id;

        RETURN QUERY SELECT TRUE, 'Slot reserved successfully.', v_new_appointment_id;
    ELSE
        -- The slot is already taken
        RETURN QUERY SELECT FALSE, 'This time slot is no longer available.', NULL::UUID;
    END IF;
END;
$function$;