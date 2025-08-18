-- SCRIPT DE SINCRONIZAÇÃO DE PERFIS DE MÉDICOS
-- Este script garante que cada médico na tabela `medicos` tenha um perfil correspondente na tabela `profiles`.

INSERT INTO public.profiles (id, user_type, display_name, email)
SELECT
    m.user_id,
    'medico' AS user_type,
    'Dr(a). ' || m.especialidades[1] || ' (' || m.crm || ')' AS display_name,
    'medico+' || m.crm || '@email.com' AS email
FROM
    public.medicos m
LEFT JOIN
    public.profiles p ON m.user_id = p.id
WHERE
    p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar se os perfis foram criados
SELECT
    p.id,
    p.display_name,
    p.user_type,
    m.crm
FROM public.profiles p
JOIN public.medicos m ON p.id = m.user_id
WHERE p.user_type = 'medico';
