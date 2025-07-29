-- Update doctors to have better working hours (simplified approach)
UPDATE medicos 
SET configuracoes = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          configuracoes,
          '{horarioAtendimento,segunda}',
          '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00"}]'::jsonb
        ),
        '{horarioAtendimento,terca}',
        '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00"}]'::jsonb
      ),
      '{horarioAtendimento,quarta}',
      '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00"}]'::jsonb
    ),
    '{horarioAtendimento,quinta}',
    '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00"}]'::jsonb
  ),
  '{horarioAtendimento,sexta}',
  '[{"inicio": "08:00", "fim": "18:00", "ativo": true, "inicioAlmoco": "12:00", "fimAlmoco": "13:00"}]'::jsonb
)
WHERE id IN (
  SELECT id FROM medicos LIMIT 3
);