-- Estender tabela de pagamentos para suportar reembolsos
ALTER TABLE public.pagamentos 
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_payment_id UUID REFERENCES public.pagamentos(id);

COMMENT ON COLUMN public.pagamentos.refund_id IS 'ID do reembolso no gateway de pagamento (ex: Stripe refund ID)';
COMMENT ON COLUMN public.pagamentos.refund_reason IS 'Motivo do reembolso fornecido pelo médico';
COMMENT ON COLUMN public.pagamentos.refunded_amount IS 'Valor efetivamente reembolsado';
COMMENT ON COLUMN public.pagamentos.refunded_at IS 'Data e hora do processamento do reembolso';
COMMENT ON COLUMN public.pagamentos.original_payment_id IS 'Referência ao pagamento original (para registros de reembolso)';

-- Adicionar política RLS para médicos poderem ver reembolsos relacionados às suas consultas
CREATE POLICY "Médicos podem ver reembolsos de suas consultas refund"
ON public.pagamentos FOR SELECT
USING (
  auth.uid() = medico_id OR 
  EXISTS (
    SELECT 1 FROM public.pagamentos p2 
    WHERE p2.id = pagamentos.original_payment_id 
    AND p2.medico_id = auth.uid()
  )
);

-- Adicionar política para permitir inserção de registros de reembolso
CREATE POLICY "Médicos podem criar registros de reembolso"
ON public.pagamentos FOR INSERT
WITH CHECK (
  status = 'refund' AND 
  auth.uid() = medico_id AND
  EXISTS (
    SELECT 1 FROM public.pagamentos p2 
    WHERE p2.id = pagamentos.original_payment_id 
    AND p2.medico_id = auth.uid()
    AND p2.status = 'succeeded'
  )
);