
-- Adicionar colunas para valor e status do pagamento na tabela de consultas
ALTER TABLE public.consultas
ADD COLUMN IF NOT EXISTS valor NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS status_pagamento TEXT CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado', 'reembolsado')) DEFAULT 'pendente';

COMMENT ON COLUMN public.consultas.valor IS 'Valor cobrado pela consulta.';
COMMENT ON COLUMN public.consultas.status_pagamento IS 'Status do pagamento da consulta.';

-- Criar a tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID REFERENCES public.consultas(id) ON DELETE SET NULL,
  paciente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medico_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  valor NUMERIC(10, 2) NOT NULL,
  metodo_pagamento TEXT NOT NULL, -- ex: 'credit_card', 'pix', 'convenio', 'manual'
  gateway_id TEXT, -- ID da transação no gateway de pagamento (ex: Stripe Charge ID)
  status TEXT NOT NULL, -- ex: 'succeeded', 'pending', 'failed'
  dados_gateway JSONB, -- Armazena a resposta completa do gateway
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.pagamentos IS 'Registra transações financeiras para consultas e outros serviços.';
COMMENT ON COLUMN public.pagamentos.gateway_id IS 'ID da transação no gateway de pagamento para reconciliação.';

-- Habilitar RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para Pagamentos
CREATE POLICY "Pacientes podem ver seus próprios pagamentos"
ON public.pagamentos FOR SELECT
USING (auth.uid() = paciente_id);

CREATE POLICY "Médicos podem ver os pagamentos de suas consultas"
ON public.pagamentos FOR SELECT
USING (auth.uid() = medico_id);

CREATE POLICY "Usuários autenticados podem criar pagamentos"
ON public.pagamentos FOR INSERT
WITH CHECK (auth.uid() = paciente_id);
