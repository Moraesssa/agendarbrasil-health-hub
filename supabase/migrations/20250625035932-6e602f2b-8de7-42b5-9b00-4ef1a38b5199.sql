
-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS public.get_specialties();

-- Recriar a função get_specialties para sempre retornar um array
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT unnest(especialidades)
    FROM medicos
    WHERE array_length(especialidades, 1) > 0
  );
END;
$function$;

-- Criar tabela de especialidades médicas padronizadas
CREATE TABLE IF NOT EXISTS public.especialidades_medicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  codigo TEXT UNIQUE,
  descricao TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir especialidades médicas comuns
INSERT INTO public.especialidades_medicas (nome, codigo, descricao) VALUES
('Cardiologia', 'CARDIO', 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças que acometem o coração'),
('Neurologia', 'NEURO', 'Especialidade médica que trata dos distúrbios estruturais do sistema nervoso'),
('Dermatologia', 'DERMATO', 'Especialidade médica que se ocupa do diagnóstico, prevenção e tratamento de doenças e afecções relacionadas à pele'),
('Ortopedia', 'ORTO', 'Especialidade médica que cuida da saúde relacionada aos ossos, músculos, ligamentos e articulações'),
('Ginecologia', 'GINECO', 'Especialidade médica que trata de doenças do sistema reprodutor feminino'),
('Obstetrícia', 'OBSTETR', 'Especialidade médica que se ocupa da assistência às mulheres durante a gravidez, parto e puerpério'),
('Pediatria', 'PEDIATR', 'Especialidade médica dedicada à assistência à criança e ao adolescente'),
('Oftalmologia', 'OFTALMO', 'Especialidade médica que investiga e trata as doenças relacionadas aos olhos'),
('Otorrinolaringologia', 'OTORRINO', 'Especialidade médica que cuida dos ouvidos, nariz, seios paranasais, faringe e laringe'),
('Urologia', 'URO', 'Especialidade médica que trata do trato urinário de homens e mulheres e do sistema reprodutor masculino'),
('Psiquiatria', 'PSIQ', 'Especialidade médica que lida com a prevenção, atendimento, diagnóstico, tratamento e reabilitação das diferentes formas de sofrimentos mentais'),
('Endocrinologia', 'ENDOCRINO', 'Especialidade médica que cuida dos transtornos das glândulas endócrinas'),
('Pneumologia', 'PNEUMO', 'Especialidade médica que se ocupa das doenças relacionadas aos pulmões'),
('Gastroenterologia', 'GASTRO', 'Especialidade médica que se ocupa do estudo, diagnóstico e tratamento clínico das doenças do aparelho digestivo'),
('Reumatologia', 'REUMATO', 'Especialidade médica que se dedica às doenças do tecido conjuntivo, articulações e doenças auto-imunes'),
('Oncologia', 'ONCO', 'Especialidade médica que se dedica ao estudo dos tumores e do câncer'),
('Anestesiologia', 'ANEST', 'Especialidade médica que envolve o cuidado médico antes, durante e após a cirurgia'),
('Radiologia', 'RADIO', 'Especialidade médica que utiliza tecnologias de imagem para diagnosticar e tratar doenças'),
('Cirurgia Geral', 'CIR_GERAL', 'Especialidade médica que aborda principalmente cirurgias do aparelho digestivo'),
('Medicina Interna', 'MED_INTERNA', 'Especialidade médica que se dedica ao estudo, diagnóstico e tratamento clínico das doenças de adultos'),
('Medicina de Família', 'MED_FAMILIA', 'Especialidade médica que fornece cuidados de saúde abrangentes para pessoas de todas as idades'),
('Geriatria', 'GERIATR', 'Especialidade médica que foca na saúde do idoso'),
('Hematologia', 'HEMATO', 'Especialidade médica que estuda os distúrbios do sangue'),
('Nefrologia', 'NEFRO', 'Especialidade médica que se dedica ao diagnóstico e tratamento clínico das doenças do sistema urinário'),
('Infectologia', 'INFECTO', 'Especialidade médica que se dedica ao estudo das doenças causadas por agentes infecciosos'),
('Medicina do Trabalho', 'MED_TRABALHO', 'Especialidade médica que lida com as relações entre saúde dos trabalhadores e seu trabalho'),
('Medicina Legal', 'MED_LEGAL', 'Especialidade médica que aplica conhecimentos médicos a questões legais'),
('Patologia', 'PATOL', 'Especialidade médica dedicada ao estudo das alterações estruturais, bioquímicas e funcionais que estão na base da doença'),
('Cirurgia Plástica', 'CIR_PLASTIC', 'Especialidade médica que se dedica à cirurgia de reconstrução e/ou correção de uma parte do corpo'),
('Medicina Nuclear', 'MED_NUCLEAR', 'Especialidade médica que emprega materiais radioativos para diagnóstico e tratamento')
ON CONFLICT (nome) DO NOTHING;

-- Habilitar RLS na tabela de especialidades
ALTER TABLE public.especialidades_medicas ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura das especialidades para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver especialidades" 
ON public.especialidades_medicas 
FOR SELECT 
TO authenticated
USING (ativa = true);

-- Política para permitir que admins gerenciem especialidades (futuro)
CREATE POLICY "Admins podem gerenciar especialidades" 
ON public.especialidades_medicas 
FOR ALL 
TO authenticated
USING (false); -- Por enquanto, ninguém pode modificar

-- Criar função para incluir também as especialidades padronizadas
CREATE OR REPLACE FUNCTION public.get_all_specialties()
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  custom_specs text[];
  standard_specs text[];
  all_specs text[];
BEGIN
  -- Buscar especialidades customizadas dos médicos
  SELECT ARRAY(
    SELECT DISTINCT unnest(especialidades)
    FROM medicos
    WHERE array_length(especialidades, 1) > 0
  ) INTO custom_specs;
  
  -- Buscar especialidades padronizadas ativas
  SELECT ARRAY(
    SELECT nome
    FROM especialidades_medicas
    WHERE ativa = true
    ORDER BY nome
  ) INTO standard_specs;
  
  -- Combinar e remover duplicatas
  SELECT ARRAY(
    SELECT DISTINCT spec
    FROM (
      SELECT unnest(COALESCE(custom_specs, '{}')) as spec
      UNION
      SELECT unnest(COALESCE(standard_specs, '{}')) as spec
    ) combined
    WHERE spec IS NOT NULL AND spec != ''
    ORDER BY spec
  ) INTO all_specs;
  
  RETURN COALESCE(all_specs, '{}');
END;
$function$;

-- Atualizar a função original para usar a nova função
DROP FUNCTION IF EXISTS public.get_specialties();
CREATE OR REPLACE FUNCTION public.get_specialties()
RETURNS text[]
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN public.get_all_specialties();
END;
$function$;
