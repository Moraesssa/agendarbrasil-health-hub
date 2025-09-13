-- Adicionar campos faltantes na tabela consultas
ALTER TABLE public.consultas 
ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS patient_name TEXT,
ADD COLUMN IF NOT EXISTS patient_email TEXT;

-- Adicionar campos faltantes na tabela profiles  
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Adicionar campos faltantes na tabela medicos
ALTER TABLE public.medicos
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio_perfil TEXT,
ADD COLUMN IF NOT EXISTS usuario_id UUID,
ADD COLUMN IF NOT EXISTS duracao_consulta_inicial INTEGER DEFAULT 30;

-- Adicionar campos faltantes na tabela pacientes
ALTER TABLE public.pacientes
ADD COLUMN IF NOT EXISTS usuario_id UUID;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_consultas_status_pagamento ON public.consultas(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_medicos_rating ON public.medicos(rating);
CREATE INDEX IF NOT EXISTS idx_medicos_usuario_id ON public.medicos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id ON public.pacientes(usuario_id);