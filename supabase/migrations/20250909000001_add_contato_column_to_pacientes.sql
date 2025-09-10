-- Add missing contato column to pacientes table
-- This fixes the error when saving patient data during onboarding

ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS contato jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.pacientes.contato IS 'Contact information including phone, whatsapp, emergency contacts, etc.';