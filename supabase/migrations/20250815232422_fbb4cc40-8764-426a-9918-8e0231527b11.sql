-- CORREÇÃO URGENTE: Restringir acesso à tabela payments
-- Remove políticas permissivas
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook selects" ON public.payments; 
DROP POLICY IF EXISTS "Allow webhook updates" ON public.payments;
DROP POLICY IF EXISTS "Allow webhook inserts" ON public.payments;

-- Políticas seguras para payments
CREATE POLICY "Users can view their own payments" 
ON public.payments FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  (customer_id = auth.uid()::text OR 
   EXISTS (SELECT 1 FROM consultas WHERE consultas.id = payments.consulta_id AND 
           (consultas.paciente_id = auth.uid() OR consultas.medico_id = auth.uid())))
);

CREATE POLICY "Service role can manage payments" 
ON public.payments FOR ALL 
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
);