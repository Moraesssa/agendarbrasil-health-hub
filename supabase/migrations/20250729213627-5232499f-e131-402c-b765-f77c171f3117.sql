-- Create default locations for existing doctors
INSERT INTO locais_atendimento (medico_id, nome_local, endereco, ativo)
SELECT 
    user_id,
    'Consultório Principal',
    jsonb_build_object(
        'endereco', 'Rua das Flores, 123',
        'cidade', 'São Paulo',
        'uf', 'SP',
        'cep', '01234-567',
        'bairro', 'Centro'
    ),
    true
FROM medicos
WHERE user_id NOT IN (SELECT DISTINCT medico_id FROM locais_atendimento);

-- Also ensure all working hours have proper local_id reference
UPDATE medicos 
SET configuracoes = jsonb_set(
    configuracoes,
    '{horarioAtendimento,segunda}',
    (
        SELECT jsonb_agg(
            jsonb_set(elem, '{local_id}', to_jsonb(la.id))
        )
        FROM jsonb_array_elements(configuracoes->'horarioAtendimento'->'segunda') elem,
             locais_atendimento la
        WHERE la.medico_id = medicos.user_id
        LIMIT 1
    )
)
WHERE configuracoes->'horarioAtendimento'->'segunda' IS NOT NULL
AND jsonb_array_length(configuracoes->'horarioAtendimento'->'segunda') > 0;