
-- 1. Remover a constraint incorreta da tabela health_metrics
-- Esta constraint estava ligando a `health_metrics` à tabela `pacientes` em vez de `profiles`.
ALTER TABLE public.health_metrics
DROP CONSTRAINT IF EXISTS health_metrics_patient_id_fkey;

-- 2. Adicionar a constraint correta, referenciando a tabela `profiles`
-- Agora, a coluna `patient_id` irá se referir corretamente ao ID do usuário principal.
ALTER TABLE public.health_metrics
ADD CONSTRAINT health_metrics_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Adicionar um comentário para documentação futura
COMMENT ON CONSTRAINT health_metrics_patient_id_fkey ON public.health_metrics
IS 'A métrica de saúde pertence a um perfil de usuário (paciente).';
