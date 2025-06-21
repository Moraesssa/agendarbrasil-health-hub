
-- Create profiles table (equivalent to Firebase users collection)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  user_type TEXT CHECK (user_type IN ('paciente', 'medico')) NOT NULL DEFAULT 'paciente',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  preferences JSONB DEFAULT '{"notifications": true, "theme": "light", "language": "pt-BR"}'::jsonb
);

-- Create medicos table
CREATE TABLE public.medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  crm TEXT NOT NULL,
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  registro_especialista TEXT,
  telefone TEXT NOT NULL,
  whatsapp TEXT,
  endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  dados_profissionais JSONB NOT NULL DEFAULT '{}'::jsonb,
  configuracoes JSONB NOT NULL DEFAULT '{}'::jsonb,
  verificacao JSONB NOT NULL DEFAULT '{"crm_verificado": false, "documentos_enviados": false, "aprovado": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pacientes table
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dados_pessoais JSONB NOT NULL DEFAULT '{}'::jsonb,
  contato JSONB NOT NULL DEFAULT '{}'::jsonb,
  endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  dados_medicos JSONB NOT NULL DEFAULT '{}'::jsonb,
  convenio JSONB NOT NULL DEFAULT '{"tem_convenio": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for medicos
CREATE POLICY "Medicos can view own data" ON public.medicos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Medicos can insert own data" ON public.medicos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Medicos can update own data" ON public.medicos
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pacientes
CREATE POLICY "Pacientes can view own data" ON public.pacientes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pacientes can insert own data" ON public.pacientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pacientes can update own data" ON public.pacientes
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'photo_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_medicos_updated_at
  BEFORE UPDATE ON public.medicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
