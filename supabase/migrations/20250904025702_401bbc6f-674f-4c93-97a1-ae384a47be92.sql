
-- DEV-ONLY: desabilitar RLS e abrir permissões necessárias para o fluxo de agendamento

-- Garantir uso do schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 1) Desabilitar RLS nas tabelas relevantes
ALTER TABLE public.profiles             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais_atendimento   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_off      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_services     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades_medicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos           DISABLE ROW LEVEL SECURITY;

-- 2) Leitura pública (navegação e descoberta)
GRANT SELECT ON
  public.profiles,
  public.medicos,
  public.locais_atendimento,
  public.doctor_availability,
  public.doctor_time_off,
  public.medical_services,
  public.especialidades_medicas
TO anon, authenticated;

-- 3) Escrita para usuários autenticados nas entidades usadas no desenvolvimento
GRANT SELECT, INSERT, UPDATE ON public.consultas          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicos     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locais_atendimento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_time_off TO authenticated;

-- 4) Acesso às sequências (para evitar erros de nextval)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Observação:
-- Mantemos as políticas existentes (se houver), mas elas não terão efeito enquanto o RLS estiver desabilitado.
