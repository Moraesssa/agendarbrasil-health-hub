

-- Corrigir a função get_all_specialties para retornar array de strings
DROP FUNCTION IF EXISTS public.get_all_specialties();

CREATE OR REPLACE FUNCTION public.get_all_specialties()
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  custom_specs text[];
  standard_specs text[];
  all_specs text[];
BEGIN
  -- Buscar especialidades customizadas dos médicos
  SELECT ARRAY(
    SELECT DISTINCT unnest(especialidades)
    FROM medicos
    WHERE array_length(especialidades, 1) > 0
  ) INTO custom_specs;
  
  -- Buscar especialidades padronizadas ativas
  SELECT ARRAY(
    SELECT nome
    FROM especialidades_medicas
    WHERE ativa = true
    ORDER BY nome
  ) INTO standard_specs;
  
  -- Combinar e remover duplicatas
  SELECT ARRAY(
    SELECT DISTINCT spec
    FROM (
      SELECT unnest(COALESCE(custom_specs, '{}')) as spec
      UNION
      SELECT unnest(COALESCE(standard_specs, '{}')) as spec
    ) combined
    WHERE spec IS NOT NULL AND spec != ''
    ORDER BY spec
  ) INTO all_specs;
  
  RETURN COALESCE(all_specs, '{}');
END;
$function$;

