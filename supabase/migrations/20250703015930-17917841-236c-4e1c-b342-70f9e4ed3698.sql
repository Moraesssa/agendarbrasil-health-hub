-- Criar tabela de encaminhamentos
CREATE TABLE public.encaminhamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL,
  medico_origem_id UUID NOT NULL,
  medico_destino_id UUID,
  especialidade TEXT NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'aceito', 'rejeitado', 'realizado')),
  observacoes TEXT,
  data_encaminhamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_resposta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para encaminhamentos
CREATE POLICY "Médicos podem ver encaminhamentos que enviaram" 
ON public.encaminhamentos 
FOR SELECT 
USING (auth.uid() = medico_origem_id);

CREATE POLICY "Médicos podem ver encaminhamentos que receberam" 
ON public.encaminhamentos 
FOR SELECT 
USING (auth.uid() = medico_destino_id);

CREATE POLICY "Médicos podem criar encaminhamentos" 
ON public.encaminhamentos 
FOR INSERT 
WITH CHECK (auth.uid() = medico_origem_id);

CREATE POLICY "Médicos podem atualizar encaminhamentos que receberam" 
ON public.encaminhamentos 
FOR UPDATE 
USING (auth.uid() = medico_destino_id);

CREATE POLICY "Médicos podem atualizar encaminhamentos que enviaram" 
ON public.encaminhamentos 
FOR UPDATE 
USING (auth.uid() = medico_origem_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_encaminhamentos_updated_at
BEFORE UPDATE ON public.encaminhamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar foreign keys
ALTER TABLE public.encaminhamentos 
ADD CONSTRAINT encaminhamentos_paciente_id_fkey 
FOREIGN KEY (paciente_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.encaminhamentos 
ADD CONSTRAINT encaminhamentos_medico_origem_id_fkey 
FOREIGN KEY (medico_origem_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.encaminhamentos 
ADD CONSTRAINT encaminhamentos_medico_destino_id_fkey 
FOREIGN KEY (medico_destino_id) REFERENCES public.profiles(id) ON DELETE SET NULL;