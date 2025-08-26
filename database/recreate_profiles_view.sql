-- SQL script to recreate the 'profiles' view

-- Step 1: Drop the existing 'profiles' table
DROP TABLE IF EXISTS "profiles" CASCADE;

-- Step 2: Create a new 'profiles' view
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
