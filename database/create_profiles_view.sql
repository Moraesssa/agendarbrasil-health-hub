-- SQL script to create a unified 'profiles' view

CREATE OR REPLACE VIEW "profiles" AS
SELECT
    u.id,
    u.nome AS display_name,
    u.email,
    u.tipo AS user_type,
    m.crm,
    m.uf_crm,
    p.data_nascimento,
    p.genero
FROM
    "Usuarios" u
LEFT JOIN
    "Medicos" m ON u.id = m.usuario_id
LEFT JOIN
    "Pacientes" p ON u.id = p.usuario_id;
