-- Allow patients to update their own consultation status (e.g., confirm)
CREATE POLICY "Consultas: paciente atualiza própria consulta"
ON public.consultas
FOR UPDATE
TO authenticated
USING (auth.uid() = paciente_id)
WITH CHECK (auth.uid() = paciente_id);