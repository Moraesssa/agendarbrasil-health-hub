
-- Primeiro, vamos remover todas as políticas RLS existentes na tabela consultas para limpar duplicações
DROP POLICY IF EXISTS "Pacientes podem ver suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Médicos podem ver suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Pacientes podem criar consultas" ON public.consultas;
DROP POLICY IF EXISTS "Pacientes podem atualizar suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Médicos podem atualizar consultas" ON public.consultas;
DROP POLICY IF EXISTS "Usuários podem cancelar suas consultas" ON public.consultas;

-- Criar políticas RLS corretas e não duplicadas para a tabela consultas
-- Política para pacientes verem apenas suas consultas
CREATE POLICY "pacientes_select_own_consultas" 
ON public.consultas 
FOR SELECT 
TO authenticated
USING (auth.uid() = paciente_id);

-- Política para médicos verem apenas suas consultas
CREATE POLICY "medicos_select_own_consultas" 
ON public.consultas 
FOR SELECT 
TO authenticated
USING (auth.uid() = medico_id);

-- Política para pacientes criarem consultas (CORRIGIDA)
CREATE POLICY "pacientes_insert_consultas" 
ON public.consultas 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = paciente_id);

-- Política para pacientes atualizarem suas consultas
CREATE POLICY "pacientes_update_own_consultas" 
ON public.consultas 
FOR UPDATE 
TO authenticated
USING (auth.uid() = paciente_id);

-- Política para médicos atualizarem consultas
CREATE POLICY "medicos_update_own_consultas" 
ON public.consultas 
FOR UPDATE 
TO authenticated
USING (auth.uid() = medico_id);

-- Política para cancelamento de consultas
CREATE POLICY "users_delete_own_consultas" 
ON public.consultas 
FOR DELETE 
TO authenticated
USING (auth.uid() = paciente_id OR auth.uid() = medico_id);

-- Normalizar especialidades existentes para consistência (Title Case)
UPDATE public.medicos 
SET especialidades = ARRAY(
  SELECT INITCAP(LOWER(unnest(especialidades)))
) 
WHERE array_length(especialidades, 1) > 0;

-- Verificar se RLS está habilitado na tabela profiles (necessário para buscar médicos)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para todos os usuários autenticados poderem ver profiles públicos (necessário para agendamento)
DROP POLICY IF EXISTS "public_profiles_select" ON public.profiles;
CREATE POLICY "public_profiles_select" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Política para usuários atualizarem apenas seu próprio perfil
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);
