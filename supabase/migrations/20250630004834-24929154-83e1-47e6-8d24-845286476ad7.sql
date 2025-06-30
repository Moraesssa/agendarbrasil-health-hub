
-- Adicionar coluna local_id na tabela consultas para referenciar o local da consulta
ALTER TABLE public.consultas 
ADD COLUMN local_id uuid REFERENCES public.locais_atendimento(id);

-- Criar função para buscar médicos por localização e especialidade
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
  p_specialty text,
  p_city text,
  p_state text
)
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql
STABLE
AS $function$
  SELECT DISTINCT p.id, p.display_name
  FROM public.profiles p
  JOIN public.medicos m ON p.id = m.user_id
  JOIN public.locais_atendimento la ON p.id = la.medico_id
  WHERE
    m.especialidades @> ARRAY[p_specialty]
    AND (la.endereco ->> 'cidade') = p_city
    AND (la.endereco ->> 'uf') = p_state
    AND la.ativo = true;
$function$;
