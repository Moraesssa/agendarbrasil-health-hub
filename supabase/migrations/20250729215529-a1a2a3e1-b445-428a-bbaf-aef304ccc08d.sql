-- Normalize horarioAtendimento data structure to consistent array format
UPDATE medicos 
SET configuracoes = jsonb_set(
  configuracoes,
  '{horarioAtendimento}',
  (
    SELECT jsonb_object_agg(
      day_key,
      CASE 
        WHEN jsonb_typeof(day_value) = 'object' AND day_value ? 'inicio' THEN 
          jsonb_build_array(day_value)
        WHEN jsonb_typeof(day_value) = 'array' THEN 
          day_value
        ELSE 
          '[]'::jsonb
      END
    )
    FROM jsonb_each(configuracoes->'horarioAtendimento') AS t(day_key, day_value)
  )
)
WHERE configuracoes ? 'horarioAtendimento' 
AND configuracoes->'horarioAtendimento' IS NOT NULL;