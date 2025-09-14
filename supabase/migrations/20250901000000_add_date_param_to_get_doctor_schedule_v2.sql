-- Add date parameter to get_doctor_schedule_v2
CREATE OR REPLACE FUNCTION public.get_doctor_schedule_v2(
  p_doctor_id uuid,
  p_date date
)
RETURNS TABLE(doctor_config jsonb, locations jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM public.get_doctor_schedule_data(p_doctor_id);
$function$;

COMMENT ON FUNCTION public.get_doctor_schedule_v2(uuid, date)
IS 'Retorna configurações e locais de um médico, filtrados por data quando suportado';

GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_v2(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_schedule_v2(uuid, date) TO anon;
