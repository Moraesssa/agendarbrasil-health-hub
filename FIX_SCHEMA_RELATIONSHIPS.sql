-- =================================================================
-- SCRIPT DE CORREÇÃO: CRIAÇÃO DOS RELACIONAMENTOS (FOREIGN KEYS)
-- =================================================================
--
-- **MOTIVO:** A aplicação está retornando erros (400 Bad Request) ao tentar
-- consultar dados que envolvem junções entre tabelas. Isso ocorre porque
-- os relacionamentos (chaves estrangeiras) entre a tabela `profiles` e as
-- outras tabelas (`medicos`, `pacientes`, `consultas`) não existem.
--
-- **INSTRUÇÕES:** Execute este código no Editor SQL do seu painel Supabase.
-- Este script assume que as tabelas `profiles`, `medicos`, `pacientes` e `consultas` já existem.
--
-- =================================================================

-- **Passo 1: Criar a relação entre `medicos` e `profiles`**
-- Garante que todo médico é um perfil existente.
ALTER TABLE public.medicos
ADD CONSTRAINT medicos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- **Passo 2: Criar a relação entre `pacientes` e `profiles`**
-- Garante que todo paciente é um perfil existente.
ALTER TABLE public.pacientes
ADD CONSTRAINT pacientes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- **Passo 3: Criar a relação entre `consultas` e o médico (`profiles`)**
-- Garante que toda consulta aponta para um médico válido.
ALTER TABLE public.consultas
ADD CONSTRAINT consultas_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- **Passo 4: Criar a relação entre `consultas` e o paciente (`profiles`)**
-- Garante que toda consulta aponta para um paciente válido.
ALTER TABLE public.consultas
ADD CONSTRAINT consultas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


-- =================================================================

SELECT 'Relacionamentos (Foreign Keys) criados com sucesso!' as status;
