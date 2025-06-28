
-- Criar tabela para membros da família
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL, -- 'spouse', 'child', 'parent', 'sibling', 'other'
  permission_level TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'manager', 'viewer'
  can_schedule BOOLEAN NOT NULL DEFAULT false,
  can_view_history BOOLEAN NOT NULL DEFAULT true,
  can_cancel BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_member_id)
);

-- Habilitar RLS na tabela family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Política para ver membros da família (usuário principal ou membro da família)
CREATE POLICY "Users can view their family members" 
ON public.family_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() = family_member_id
);

-- Política para adicionar membros da família (apenas usuário principal)
CREATE POLICY "Users can add family members" 
ON public.family_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para atualizar membros da família (apenas usuário principal)
CREATE POLICY "Users can update their family members" 
ON public.family_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para remover membros da família (usuário principal ou o próprio membro)
CREATE POLICY "Users can remove family members" 
ON public.family_members 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  auth.uid() = family_member_id
);

-- Criar função para buscar membros da família
CREATE OR REPLACE FUNCTION public.get_family_members(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  family_member_id UUID,
  display_name TEXT,
  email TEXT,
  relationship TEXT,
  permission_level TEXT,
  can_schedule BOOLEAN,
  can_view_history BOOLEAN,
  can_cancel BOOLEAN,
  status TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    fm.id,
    fm.family_member_id,
    p.display_name,
    p.email,
    fm.relationship,
    fm.permission_level,
    fm.can_schedule,
    fm.can_view_history,
    fm.can_cancel,
    fm.status
  FROM public.family_members fm
  JOIN public.profiles p ON p.id = fm.family_member_id
  WHERE fm.user_id = user_uuid AND fm.status = 'active'
  ORDER BY fm.created_at DESC;
$$;

-- Atualizar a tabela de consultas para incluir informação sobre quem agendou
ALTER TABLE public.consultas ADD COLUMN IF NOT EXISTS agendado_por UUID REFERENCES public.profiles(id);
ALTER TABLE public.consultas ADD COLUMN IF NOT EXISTS paciente_familiar_id UUID REFERENCES public.profiles(id);

-- Atualizar políticas da tabela consultas para incluir acesso familiar
DROP POLICY IF EXISTS "Pacientes podem ver suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Médicos podem ver suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Pacientes podem criar consultas" ON public.consultas;
DROP POLICY IF EXISTS "Pacientes podem atualizar suas consultas" ON public.consultas;
DROP POLICY IF EXISTS "Médicos podem atualizar consultas" ON public.consultas;

CREATE POLICY "Users can view their own appointments" 
ON public.consultas 
FOR SELECT 
USING (
  auth.uid() = paciente_id OR 
  auth.uid() = medico_id OR
  auth.uid() = agendado_por OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = paciente_id 
    AND fm.can_view_history = true 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Users can create appointments" 
ON public.consultas 
FOR INSERT 
WITH CHECK (
  auth.uid() = paciente_id OR
  auth.uid() = agendado_por OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = paciente_id 
    AND fm.can_schedule = true 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Users can update appointments" 
ON public.consultas 
FOR UPDATE 
USING (
  auth.uid() = paciente_id OR 
  auth.uid() = medico_id OR
  auth.uid() = agendado_por OR
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.family_member_id = paciente_id 
    AND (fm.can_schedule = true OR fm.can_cancel = true)
    AND fm.status = 'active'
  )
);

CREATE POLICY "Doctors can update their appointments" 
ON public.consultas 
FOR UPDATE 
USING (auth.uid() = medico_id);
