
-- Habilitar RLS na tabela consultas (se ainda não estiver habilitado)
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (evitar conflitos)
DROP POLICY IF EXISTS "Pacientes podem ver suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Médicos podem ver suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Pacientes podem criar consultas" ON public.consultas;
DROP POLICY IF EXISTS "Pacientes podem atualizar suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Médicos podem atualizar consultas" ON public.consultas;
DROP POLICY IF EXISTS "Usuários podem cancelar suas consultas" ON public.consultas;

-- Política para pacientes verem apenas suas consultas
CREATE POLICY "Pacientes podem ver suas consultas" 
ON public.consultas 
FOR SELECT 
USING (auth.uid() = paciente_id);

-- Política para médicos verem apenas suas consultas
CREATE POLICY "Médicos podem ver suas consultas" 
ON public.consultas 
FOR SELECT 
USING (auth.uid() = medico_id);

-- Política para pacientes criarem consultas
CREATE POLICY "Pacientes podem criar consultas" 
ON public.consultas 
FOR INSERT 
WITH CHECK (auth.uid() = paciente_id);

-- Política para pacientes atualizarem suas consultas
CREATE POLICY "Pacientes podem atualizar suas consultas" 
ON public.consultas 
FOR UPDATE 
USING (auth.uid() = paciente_id);

-- Política para médicos atualizarem consultas
CREATE POLICY "Médicos podem atualizar consultas" 
ON public.consultas 
FOR UPDATE 
USING (auth.uid() = medico_id);

-- Política para cancelamento de consultas
CREATE POLICY "Usuários podem cancelar suas consultas" 
ON public.consultas 
FOR DELETE 
USING (auth.uid() = paciente_id OR auth.uid() = medico_id);
