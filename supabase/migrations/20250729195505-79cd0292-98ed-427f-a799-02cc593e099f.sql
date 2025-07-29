-- Update doctor configurations to have better working hours for testing
UPDATE medicos 
SET configuracoes = jsonb_set(
  jsonb_set(
    configuracoes,
    '{horarioAtendimento,segunda}',
    '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00", "local_id": ' || 
    CASE 
      WHEN configuracoes->'horarioAtendimento'->'segunda'->0->>'local_id' IS NOT NULL 
      THEN '"' || (configuracoes->'horarioAtendimento'->'segunda'->0->>'local_id') || '"'
      ELSE 'null'
    END || '}]'::jsonb
  ),
  '{horarioAtendimento,terca}',
  '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00", "local_id": ' || 
  CASE 
    WHEN configuracoes->'horarioAtendimento'->'terca'->0->>'local_id' IS NOT NULL 
    THEN '"' || (configuracoes->'horarioAtendimento'->'terca'->0->>'local_id') || '"'
    ELSE 'null'
  END || '}]'::jsonb
)
WHERE id IN (
  SELECT id FROM medicos LIMIT 3
);

-- Also update Wednesday, Thursday, Friday
UPDATE medicos 
SET configuracoes = jsonb_set(
  jsonb_set(
    jsonb_set(
      configuracoes,
      '{horarioAtendimento,quarta}',
      '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00", "local_id": ' || 
      CASE 
        WHEN configuracoes->'horarioAtendimento'->'quarta'->0->>'local_id' IS NOT NULL 
        THEN '"' || (configuracoes->'horarioAtendimento'->'quarta'->0->>'local_id') || '"'
        ELSE 'null'
      END || '}]'::jsonb
    ),
    '{horarioAtendimento,quinta}',
    '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00", "local_id": ' || 
    CASE 
      WHEN configuracoes->'horarioAtendimento'->'quinta'->0->>'local_id' IS NOT NULL 
      THEN '"' || (configuracoes->'horarioAtendimento'->'quinta'->0->>'local_id') || '"'
      ELSE 'null'
    END || '}]'::jsonb
  ),
  '{horarioAtendimento,sexta}',
  '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00", "local_id": ' || 
  CASE 
    WHEN configuracoes->'horarioAtendimento'->'sexta'->0->>'local_id' IS NOT NULL 
    THEN '"' || (configuracoes->'horarioAtendimento'->'sexta'->0->>'local_id') || '"'
    ELSE 'null'
  END || '}]'::jsonb
)
WHERE id IN (
  SELECT id FROM medicos LIMIT 3
);