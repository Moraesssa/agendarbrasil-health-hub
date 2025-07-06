
-- Script definitivo para corrigir a tabela health_metrics
-- Este script pode ser executado múltiplas vezes sem problemas

-- 1. Remover constraint antiga se existir (referenciando pacientes)
ALTER TABLE public.health_metrics 
DROP CONSTRAINT IF EXISTS health_metrics_patient_id_fkey;

-- 2. Criar a constraint correta referenciando profiles
ALTER TABLE public.health_metrics
ADD CONSTRAINT health_metrics_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Verificar se existem constraints de unicidade problemáticas e removê-las
-- (permite múltiplas métricas do mesmo tipo para histórico)
DROP INDEX IF EXISTS health_metrics_patient_metric_unique;
ALTER TABLE public.health_metrics 
DROP CONSTRAINT IF EXISTS health_metrics_patient_metric_type_key;

-- 4. Garantir que o perfil do usuário atual existe na tabela profiles
-- (usando INSERT ... ON CONFLICT para segurança)
INSERT INTO public.profiles (id, email, display_name, user_type, onboarding_completed, is_active)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  'paciente',
  true,
  true
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Comentário para documentação
COMMENT ON CONSTRAINT health_metrics_patient_id_fkey ON public.health_metrics
IS 'Métrica de saúde vinculada diretamente ao perfil do usuário (profiles.id = auth.uid())';
