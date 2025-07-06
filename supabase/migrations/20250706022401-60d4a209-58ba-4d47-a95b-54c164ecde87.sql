
-- Remover as políticas RLS existentes da tabela health_metrics
DROP POLICY IF EXISTS "Allow patients to insert their own metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Allow patients to view their own metrics" ON public.health_metrics;

-- Criar novas políticas RLS mais simples que usam auth.uid() diretamente
CREATE POLICY "Users can insert their own health metrics" 
ON public.health_metrics 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can view their own health metrics" 
ON public.health_metrics 
FOR SELECT 
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "Users can update their own health metrics" 
ON public.health_metrics 
FOR UPDATE 
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete their own health metrics" 
ON public.health_metrics 
FOR DELETE 
TO authenticated
USING (auth.uid() = patient_id);
