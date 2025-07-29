-- Create default locations for existing doctors (simpler approach)
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
WHERE user_id NOT IN (SELECT DISTINCT medico_id FROM locais_atendimento WHERE medico_id IS NOT NULL);