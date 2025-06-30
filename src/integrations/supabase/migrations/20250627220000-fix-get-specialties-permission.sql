-- Corrige a permissão da função para que ela possa ler de todas as tabelas necessárias,
-- mesmo com o RLS ativo. O "SECURITY DEFINER" faz com que a função execute com
-- os privilégios do seu criador, que tem acesso a tudo.
CREATE OR REPLACE FUNCTION public.get_all_specialties()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
DECLARE
  all_specs text[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT spec
    FROM (
      -- Busca as especialidades customizadas dos médicos
      SELECT unnest(especialidades) as spec
      FROM public.medicos
      WHERE array_length(especialidades, 1) > 0
      
      UNION
      
      -- Busca as especialidades padronizadas da tabela
      SELECT nome as spec
      FROM public.especialidades_medicas
      WHERE ativa = true
    ) combined
    WHERE spec IS NOT NULL AND spec <> ''
    ORDER BY spec
  ) INTO all_specs;
  
  RETURN COALESCE(all_specs, '{}');
END;
$function$;

-- Recria a função get_specialties para chamar a função corrigida
DROP FUNCTION IF EXISTS public.get_specialties();
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.get_all_specialties();
END;
$function$;