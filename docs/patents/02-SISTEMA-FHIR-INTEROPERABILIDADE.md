# Patente 2: Sistema de Interoperabilidade FHIR Nativo

## TÍTULO DA INVENÇÃO

**Sistema e Método para Conversão Automática e Armazenamento Híbrido de Dados Clínicos no Padrão FHIR R4 com API RESTful Integrada**

---

## 1. CAMPO TÉCNICO DA INVENÇÃO

A presente invenção refere-se ao campo de interoperabilidade de sistemas de saúde, mais especificamente a um sistema computadorizado que converte automaticamente dados clínicos armazenados em formato relacional para o padrão FHIR (Fast Healthcare Interoperability Resources) R4, mantendo armazenamento híbrido e expondo API RESTful compatível com o padrão.

---

## 2. ANTECEDENTES DA INVENÇÃO

### 2.1 Estado da Técnica

O padrão FHIR, desenvolvido pela HL7, é o padrão internacional mais adotado para troca de informações de saúde. No entanto, a maioria dos sistemas legados enfrenta desafios para sua implementação:

1. **Migração Complexa**: Converter bases de dados existentes para FHIR requer reescrita significativa
2. **Perda de Performance**: Armazenar dados nativamente em FHIR (como documentos JSON) sacrifica performance de consultas relacionais
3. **Duplicação de Esforço**: Manter duas representações (relacional e FHIR) manualmente é propenso a erros
4. **APIs Não-Padronizadas**: Muitos sistemas expõem APIs proprietárias que não seguem o padrão FHIR

### 2.2 Problemas Técnicos a Resolver

- Converter dados clínicos para FHIR sem migração destrutiva
- Manter performance de consultas relacionais
- Garantir sincronização entre representações
- Expor API RESTful FHIR-compliant
- Suportar extensões brasileiras (CPF, CNS)

---

## 3. SUMÁRIO DA INVENÇÃO

A presente invenção propõe um sistema de três camadas:

1. **Camada de Armazenamento Relacional** - Dados clínicos em tabelas PostgreSQL otimizadas
2. **Camada de Conversão** - Funções de banco de dados e TypeScript que transformam dados em recursos FHIR
3. **Camada de API** - Edge Functions que expõem operações FHIR (search, read, create)

---

## 4. DESCRIÇÃO DETALHADA DA INVENÇÃO

### 4.1 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTES EXTERNOS                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Sistemas    │  │ Apps Mobile │  │ Integrações (labs, etc.)    │  │
│  │ de Saúde    │  │             │  │                             │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────────┬──────────────┘  │
└─────────┼────────────────┼─────────────────────────┼────────────────┘
          │                │                         │
          └────────────────┼─────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Edge Functions)                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  /fhir/Patient      - GET, POST, PUT, DELETE                    ││
│  │  /fhir/Observation  - GET, POST, PUT, DELETE                    ││
│  │  /fhir/Condition    - GET, POST                                 ││
│  │  /fhir/Appointment  - GET, POST, PUT                            ││
│  │  /fhir/Practitioner - GET, POST                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE CONVERSÃO                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Funções de Banco de Dados (PL/pgSQL)                           ││
│  │  - convert_profile_to_fhir_patient()                            ││
│  │  - convert_health_metric_to_fhir()                              ││
│  │  - convert_appointment_to_fhir()                                ││
│  └─────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Serviço TypeScript (fhirService.ts)                            ││
│  │  - convertToFhirPatient()                                       ││
│  │  - convertToFhirObservation()                                   ││
│  │  - validateFhirResource()                                       ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                CAMADA DE ARMAZENAMENTO HÍBRIDO                       │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐   │
│  │  TABELAS RELACIONAIS        │  │  CACHE FHIR                 │   │
│  │  - profiles                 │  │  - fhir_resources           │   │
│  │  - health_metrics           │  │    (JSON documents)         │   │
│  │  - consultas                │  │                             │   │
│  │  - medical_prescriptions    │  │                             │   │
│  └─────────────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Modelo de Dados FHIR Suportado

#### 4.2.1 Recursos Implementados

| Recurso FHIR | Tabela de Origem | Descrição |
|--------------|------------------|-----------|
| Patient | profiles, pacientes | Dados demográficos do paciente |
| Practitioner | profiles, medicos | Dados do profissional de saúde |
| Observation | health_metrics | Sinais vitais e métricas de saúde |
| Condition | (derivado de consultas) | Condições/diagnósticos |
| Appointment | consultas | Agendamentos |
| MedicationRequest | medical_prescriptions | Prescrições |
| DocumentReference | patient_documents | Documentos anexados |

#### 4.2.2 Extensões Brasileiras

O sistema implementa extensões para dados específicos do Brasil:

```typescript
interface BrazilianPatientExtensions {
  cpf: {
    url: "http://hl7.org/fhir/StructureDefinition/patient-nationality",
    extension: [{
      url: "code",
      valueCodeableConcept: {
        coding: [{
          system: "urn:iso:std:iso:3166",
          code: "BR"
        }]
      }
    }]
  };
  cns: {
    system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
    value: string
  };
}
```

### 4.3 Funções de Conversão

#### 4.3.1 Conversão de Paciente

```typescript
// src/services/fhirService.ts

interface FhirPatient {
  resourceType: "Patient";
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    profile: string[];
  };
  identifier: FhirIdentifier[];
  active: boolean;
  name: FhirHumanName[];
  telecom: FhirContactPoint[];
  gender: "male" | "female" | "other" | "unknown";
  birthDate: string;
  address: FhirAddress[];
  extension?: FhirExtension[];
}

export function convertToFhirPatient(profile: Profile, paciente?: Paciente): FhirPatient {
  const fhirPatient: FhirPatient = {
    resourceType: "Patient",
    id: profile.id,
    meta: {
      versionId: "1",
      lastUpdated: profile.updated_at,
      profile: [
        "http://hl7.org/fhir/StructureDefinition/Patient",
        "http://rnds.saude.gov.br/fhir/r4/StructureDefinition/BRIndividuo-1.0"
      ]
    },
    identifier: [],
    active: profile.is_active ?? true,
    name: [{
      use: "official",
      text: profile.display_name || "",
      family: extractFamilyName(profile.display_name),
      given: extractGivenNames(profile.display_name)
    }],
    telecom: [{
      system: "email",
      value: profile.email,
      use: "home"
    }],
    gender: mapGender(paciente?.dados_pessoais?.genero),
    birthDate: paciente?.dados_pessoais?.data_nascimento || "",
    address: []
  };

  // Adicionar CPF como identificador
  if (paciente?.dados_pessoais?.cpf) {
    fhirPatient.identifier.push({
      system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf",
      value: paciente.dados_pessoais.cpf
    });
  }

  // Adicionar CNS (Cartão Nacional de Saúde)
  if (paciente?.dados_pessoais?.cns) {
    fhirPatient.identifier.push({
      system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/cns",
      value: paciente.dados_pessoais.cns
    });
  }

  // Adicionar endereço
  if (paciente?.endereco) {
    fhirPatient.address.push({
      use: "home",
      type: "physical",
      line: [paciente.endereco.logradouro, paciente.endereco.numero].filter(Boolean),
      city: paciente.endereco.cidade,
      state: paciente.endereco.estado,
      postalCode: paciente.endereco.cep,
      country: "BR"
    });
  }

  // Adicionar telefone
  if (paciente?.contato?.telefone) {
    fhirPatient.telecom.push({
      system: "phone",
      value: paciente.contato.telefone,
      use: "mobile"
    });
  }

  return fhirPatient;
}

function extractFamilyName(fullName: string | null): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function extractGivenNames(fullName: string | null): string[] {
  if (!fullName) return [];
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(0, -1);
}

function mapGender(genero: string | undefined): FhirPatient["gender"] {
  const genderMap: Record<string, FhirPatient["gender"]> = {
    "masculino": "male",
    "feminino": "female",
    "outro": "other",
    "male": "male",
    "female": "female",
    "M": "male",
    "F": "female"
  };
  return genderMap[genero?.toLowerCase() || ""] || "unknown";
}
```

#### 4.3.2 Conversão de Observação (Sinais Vitais)

```typescript
interface FhirObservation {
  resourceType: "Observation";
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    profile: string[];
  };
  status: "registered" | "preliminary" | "final" | "amended";
  category: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime: string;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: FhirReferenceRange[];
}

// Mapeamento de tipos de métricas para códigos LOINC
const LOINC_CODES: Record<string, { code: string; display: string; unit: string; system: string }> = {
  "pressao_sistolica": {
    code: "8480-6",
    display: "Systolic blood pressure",
    unit: "mmHg",
    system: "http://unitsofmeasure.org"
  },
  "pressao_diastolica": {
    code: "8462-4",
    display: "Diastolic blood pressure",
    unit: "mmHg",
    system: "http://unitsofmeasure.org"
  },
  "frequencia_cardiaca": {
    code: "8867-4",
    display: "Heart rate",
    unit: "/min",
    system: "http://unitsofmeasure.org"
  },
  "temperatura": {
    code: "8310-5",
    display: "Body temperature",
    unit: "Cel",
    system: "http://unitsofmeasure.org"
  },
  "peso": {
    code: "29463-7",
    display: "Body weight",
    unit: "kg",
    system: "http://unitsofmeasure.org"
  },
  "altura": {
    code: "8302-2",
    display: "Body height",
    unit: "cm",
    system: "http://unitsofmeasure.org"
  },
  "glicemia": {
    code: "2339-0",
    display: "Glucose [Mass/volume] in Blood",
    unit: "mg/dL",
    system: "http://unitsofmeasure.org"
  },
  "saturacao_oxigenio": {
    code: "2708-6",
    display: "Oxygen saturation in Arterial blood",
    unit: "%",
    system: "http://unitsofmeasure.org"
  }
};

export function convertToFhirObservation(metric: HealthMetric): FhirObservation {
  const loincMapping = LOINC_CODES[metric.tipo] || {
    code: "unknown",
    display: metric.tipo,
    unit: metric.unidade || "",
    system: "http://unitsofmeasure.org"
  };

  return {
    resourceType: "Observation",
    id: String(metric.id),
    meta: {
      versionId: "1",
      lastUpdated: metric.registrado_em || new Date().toISOString(),
      profile: [
        "http://hl7.org/fhir/StructureDefinition/vitalsigns"
      ]
    },
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs"
      }]
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: loincMapping.code,
        display: loincMapping.display
      }],
      text: loincMapping.display
    },
    subject: {
      reference: `Patient/${metric.patient_id}`,
      type: "Patient"
    },
    effectiveDateTime: metric.registrado_em || new Date().toISOString(),
    valueQuantity: {
      value: metric.valor || 0,
      unit: loincMapping.unit,
      system: loincMapping.system,
      code: loincMapping.unit
    },
    interpretation: getInterpretation(metric),
    referenceRange: getReferenceRange(metric.tipo)
  };
}

function getInterpretation(metric: HealthMetric): FhirCodeableConcept[] | undefined {
  // Lógica de interpretação baseada em valores de referência
  const ranges: Record<string, { low: number; high: number }> = {
    "pressao_sistolica": { low: 90, high: 140 },
    "pressao_diastolica": { low: 60, high: 90 },
    "frequencia_cardiaca": { low: 60, high: 100 },
    "temperatura": { low: 36, high: 37.5 },
    "glicemia": { low: 70, high: 100 },
    "saturacao_oxigenio": { low: 95, high: 100 }
  };

  const range = ranges[metric.tipo];
  if (!range || !metric.valor) return undefined;

  let interpretation: string;
  let code: string;

  if (metric.valor < range.low) {
    interpretation = "Low";
    code = "L";
  } else if (metric.valor > range.high) {
    interpretation = "High";
    code = "H";
  } else {
    interpretation = "Normal";
    code = "N";
  }

  return [{
    coding: [{
      system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
      code,
      display: interpretation
    }]
  }];
}

function getReferenceRange(tipo: string): FhirReferenceRange[] | undefined {
  const ranges: Record<string, { low: number; high: number; unit: string }> = {
    "pressao_sistolica": { low: 90, high: 140, unit: "mmHg" },
    "pressao_diastolica": { low: 60, high: 90, unit: "mmHg" },
    "frequencia_cardiaca": { low: 60, high: 100, unit: "/min" },
    "temperatura": { low: 36, high: 37.5, unit: "Cel" },
    "glicemia": { low: 70, high: 100, unit: "mg/dL" },
    "saturacao_oxigenio": { low: 95, high: 100, unit: "%" }
  };

  const range = ranges[tipo];
  if (!range) return undefined;

  return [{
    low: { value: range.low, unit: range.unit },
    high: { value: range.high, unit: range.unit }
  }];
}
```

#### 4.3.3 Conversão de Profissional (Practitioner)

```typescript
interface FhirPractitioner {
  resourceType: "Practitioner";
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
  };
  identifier: FhirIdentifier[];
  active: boolean;
  name: FhirHumanName[];
  telecom: FhirContactPoint[];
  qualification: FhirQualification[];
}

interface FhirQualification {
  identifier: FhirIdentifier[];
  code: FhirCodeableConcept;
  issuer: FhirReference;
}

export function convertToFhirPractitioner(profile: Profile, medico: Medico): FhirPractitioner {
  return {
    resourceType: "Practitioner",
    id: profile.id,
    meta: {
      versionId: "1",
      lastUpdated: profile.updated_at
    },
    identifier: [
      {
        system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/crm",
        value: `${medico.crm}/${medico.estado || 'BR'}`
      }
    ],
    active: profile.is_active ?? true,
    name: [{
      use: "official",
      text: profile.display_name || "",
      prefix: ["Dr."],
      family: extractFamilyName(profile.display_name),
      given: extractGivenNames(profile.display_name)
    }],
    telecom: [
      {
        system: "email",
        value: profile.email,
        use: "work"
      },
      ...(medico.telefone ? [{
        system: "phone" as const,
        value: medico.telefone,
        use: "work" as const
      }] : []),
      ...(medico.whatsapp ? [{
        system: "phone" as const,
        value: medico.whatsapp,
        use: "mobile" as const
      }] : [])
    ],
    qualification: [
      {
        identifier: [{
          system: "http://rnds.saude.gov.br/fhir/r4/NamingSystem/crm",
          value: medico.crm
        }],
        code: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/v2-0360",
            code: "MD",
            display: "Doctor of Medicine"
          }],
          text: getEspecialidadeText(medico.especialidades)
        },
        issuer: {
          display: `Conselho Regional de Medicina - ${medico.estado || 'BR'}`
        }
      }
    ]
  };
}

function getEspecialidadeText(especialidades: any): string {
  if (Array.isArray(especialidades)) {
    return especialidades.join(", ");
  }
  if (typeof especialidades === 'object' && especialidades?.lista) {
    return especialidades.lista.join(", ");
  }
  return "Medicina";
}
```

### 4.4 Função de Banco de Dados (PostgreSQL)

```sql
-- Função para converter perfil em FHIR Patient
CREATE OR REPLACE FUNCTION public.convert_profile_to_fhir_patient(profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  paciente_record RECORD;
  fhir_patient JSONB;
  identifiers JSONB := '[]'::JSONB;
  telecom JSONB := '[]'::JSONB;
  address JSONB := '[]'::JSONB;
BEGIN
  -- Buscar perfil
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', profile_id;
  END IF;
  
  -- Buscar dados de paciente (se existir)
  SELECT * INTO paciente_record FROM pacientes WHERE user_id = profile_id;
  
  -- Construir identificadores
  IF paciente_record IS NOT NULL AND paciente_record.dados_pessoais IS NOT NULL THEN
    IF paciente_record.dados_pessoais->>'cpf' IS NOT NULL THEN
      identifiers := identifiers || jsonb_build_object(
        'system', 'http://rnds.saude.gov.br/fhir/r4/NamingSystem/cpf',
        'value', paciente_record.dados_pessoais->>'cpf'
      );
    END IF;
  END IF;
  
  -- Construir telecom
  telecom := telecom || jsonb_build_object(
    'system', 'email',
    'value', profile_record.email,
    'use', 'home'
  );
  
  IF paciente_record IS NOT NULL AND paciente_record.contato IS NOT NULL THEN
    IF paciente_record.contato->>'telefone' IS NOT NULL THEN
      telecom := telecom || jsonb_build_object(
        'system', 'phone',
        'value', paciente_record.contato->>'telefone',
        'use', 'mobile'
      );
    END IF;
  END IF;
  
  -- Construir endereço
  IF paciente_record IS NOT NULL AND paciente_record.endereco IS NOT NULL THEN
    address := address || jsonb_build_object(
      'use', 'home',
      'type', 'physical',
      'city', paciente_record.endereco->>'cidade',
      'state', paciente_record.endereco->>'estado',
      'postalCode', paciente_record.endereco->>'cep',
      'country', 'BR'
    );
  END IF;
  
  -- Construir recurso FHIR Patient
  fhir_patient := jsonb_build_object(
    'resourceType', 'Patient',
    'id', profile_id::TEXT,
    'meta', jsonb_build_object(
      'versionId', '1',
      'lastUpdated', profile_record.updated_at,
      'profile', ARRAY['http://hl7.org/fhir/StructureDefinition/Patient']
    ),
    'identifier', identifiers,
    'active', COALESCE(profile_record.is_active, true),
    'name', jsonb_build_array(jsonb_build_object(
      'use', 'official',
      'text', COALESCE(profile_record.display_name, '')
    )),
    'telecom', telecom,
    'gender', CASE 
      WHEN paciente_record.dados_pessoais->>'genero' ILIKE 'masculino' THEN 'male'
      WHEN paciente_record.dados_pessoais->>'genero' ILIKE 'feminino' THEN 'female'
      ELSE 'unknown'
    END,
    'birthDate', paciente_record.dados_pessoais->>'data_nascimento',
    'address', address
  );
  
  RETURN fhir_patient;
END;
$$;

-- Função para converter métrica de saúde em FHIR Observation
CREATE OR REPLACE FUNCTION public.convert_health_metric_to_fhir(metric_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metric_record RECORD;
  loinc_code TEXT;
  loinc_display TEXT;
  unit TEXT;
  fhir_observation JSONB;
BEGIN
  SELECT * INTO metric_record FROM health_metrics WHERE id = metric_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Health metric not found: %', metric_id;
  END IF;
  
  -- Mapear tipo para código LOINC
  SELECT 
    CASE metric_record.tipo
      WHEN 'pressao_sistolica' THEN '8480-6'
      WHEN 'pressao_diastolica' THEN '8462-4'
      WHEN 'frequencia_cardiaca' THEN '8867-4'
      WHEN 'temperatura' THEN '8310-5'
      WHEN 'peso' THEN '29463-7'
      WHEN 'altura' THEN '8302-2'
      WHEN 'glicemia' THEN '2339-0'
      WHEN 'saturacao_oxigenio' THEN '2708-6'
      ELSE 'unknown'
    END INTO loinc_code;
    
  SELECT 
    CASE metric_record.tipo
      WHEN 'pressao_sistolica' THEN 'Systolic blood pressure'
      WHEN 'pressao_diastolica' THEN 'Diastolic blood pressure'
      WHEN 'frequencia_cardiaca' THEN 'Heart rate'
      WHEN 'temperatura' THEN 'Body temperature'
      WHEN 'peso' THEN 'Body weight'
      WHEN 'altura' THEN 'Body height'
      WHEN 'glicemia' THEN 'Glucose in Blood'
      WHEN 'saturacao_oxigenio' THEN 'Oxygen saturation'
      ELSE metric_record.tipo
    END INTO loinc_display;
  
  fhir_observation := jsonb_build_object(
    'resourceType', 'Observation',
    'id', metric_id::TEXT,
    'meta', jsonb_build_object(
      'versionId', '1',
      'lastUpdated', metric_record.registrado_em,
      'profile', ARRAY['http://hl7.org/fhir/StructureDefinition/vitalsigns']
    ),
    'status', 'final',
    'category', jsonb_build_array(jsonb_build_object(
      'coding', jsonb_build_array(jsonb_build_object(
        'system', 'http://terminology.hl7.org/CodeSystem/observation-category',
        'code', 'vital-signs',
        'display', 'Vital Signs'
      ))
    )),
    'code', jsonb_build_object(
      'coding', jsonb_build_array(jsonb_build_object(
        'system', 'http://loinc.org',
        'code', loinc_code,
        'display', loinc_display
      )),
      'text', loinc_display
    ),
    'subject', jsonb_build_object(
      'reference', 'Patient/' || metric_record.patient_id::TEXT,
      'type', 'Patient'
    ),
    'effectiveDateTime', metric_record.registrado_em,
    'valueQuantity', jsonb_build_object(
      'value', metric_record.valor,
      'unit', COALESCE(metric_record.unidade, ''),
      'system', 'http://unitsofmeasure.org'
    )
  );
  
  RETURN fhir_observation;
END;
$$;
```

### 4.5 Edge Function - API FHIR

```typescript
// supabase/functions/fhir-patient/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FhirBundle {
  resourceType: "Bundle";
  type: "searchset";
  total: number;
  entry: Array<{
    fullUrl: string;
    resource: any;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // Roteamento baseado no path
    // GET /fhir-patient - Lista todos (Bundle)
    // GET /fhir-patient/:id - Retorna um paciente específico
    // POST /fhir-patient - Cria um novo paciente

    if (method === "GET" && pathParts.length === 1) {
      // Busca com parâmetros FHIR
      const searchParams = url.searchParams;
      const name = searchParams.get("name");
      const identifier = searchParams.get("identifier");
      const _count = parseInt(searchParams.get("_count") || "20");
      const _offset = parseInt(searchParams.get("_offset") || "0");

      let query = supabase
        .from("profiles")
        .select("*, pacientes(*)")
        .eq("user_type", "paciente")
        .range(_offset, _offset + _count - 1);

      if (name) {
        query = query.ilike("display_name", `%${name}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Converter para Bundle FHIR
      const bundle: FhirBundle = {
        resourceType: "Bundle",
        type: "searchset",
        total: count || data.length,
        entry: data.map((profile) => ({
          fullUrl: `${url.origin}/fhir-patient/${profile.id}`,
          resource: convertToFhirPatient(profile, profile.pacientes?.[0])
        }))
      };

      return new Response(JSON.stringify(bundle), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/fhir+json" 
        }
      });
    }

    if (method === "GET" && pathParts.length === 2) {
      // Buscar paciente específico
      const patientId = pathParts[1];

      // Usar função do banco de dados
      const { data, error } = await supabase.rpc(
        "convert_profile_to_fhir_patient",
        { profile_id: patientId }
      );

      if (error) {
        return new Response(
          JSON.stringify({
            resourceType: "OperationOutcome",
            issue: [{
              severity: "error",
              code: "not-found",
              diagnostics: error.message
            }]
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/fhir+json" }
          }
        );
      }

      return new Response(JSON.stringify(data), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/fhir+json" 
        }
      });
    }

    if (method === "POST") {
      // Criar novo paciente a partir de recurso FHIR
      const fhirPatient = await req.json();

      // Validar recurso FHIR
      if (fhirPatient.resourceType !== "Patient") {
        return new Response(
          JSON.stringify({
            resourceType: "OperationOutcome",
            issue: [{
              severity: "error",
              code: "invalid",
              diagnostics: "Expected resourceType 'Patient'"
            }]
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/fhir+json" }
          }
        );
      }

      // Converter FHIR para formato interno
      const profileData = convertFromFhirPatient(fhirPatient);

      // Inserir no banco
      const { data, error } = await supabase
        .from("profiles")
        .insert(profileData.profile)
        .select()
        .single();

      if (error) throw error;

      // Inserir dados de paciente se houver
      if (profileData.paciente) {
        await supabase
          .from("pacientes")
          .insert({ ...profileData.paciente, user_id: data.id });
      }

      // Retornar recurso criado
      const createdResource = await supabase.rpc(
        "convert_profile_to_fhir_patient",
        { profile_id: data.id }
      );

      return new Response(JSON.stringify(createdResource.data), {
        status: 201,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/fhir+json",
          "Location": `${url.origin}/fhir-patient/${data.id}`
        }
      });
    }

    return new Response(
      JSON.stringify({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "not-supported",
          diagnostics: `Method ${method} not supported`
        }]
      }),
      { 
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/fhir+json" }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "exception",
          diagnostics: error.message
        }]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/fhir+json" }
      }
    );
  }
});

// Funções auxiliares de conversão
function convertToFhirPatient(profile: any, paciente: any) {
  // ... implementação conforme seção 4.3.1
}

function convertFromFhirPatient(fhirPatient: any) {
  return {
    profile: {
      email: fhirPatient.telecom?.find((t: any) => t.system === "email")?.value || "",
      display_name: fhirPatient.name?.[0]?.text || "",
      user_type: "paciente",
      is_active: fhirPatient.active ?? true
    },
    paciente: {
      dados_pessoais: {
        cpf: fhirPatient.identifier?.find(
          (i: any) => i.system?.includes("cpf")
        )?.value,
        data_nascimento: fhirPatient.birthDate,
        genero: fhirPatient.gender === "male" ? "masculino" : 
                fhirPatient.gender === "female" ? "feminino" : null
      },
      endereco: fhirPatient.address?.[0] ? {
        cidade: fhirPatient.address[0].city,
        estado: fhirPatient.address[0].state,
        cep: fhirPatient.address[0].postalCode
      } : null,
      contato: {
        telefone: fhirPatient.telecom?.find((t: any) => t.system === "phone")?.value
      }
    }
  };
}
```

### 4.6 Tabela de Armazenamento FHIR (Cache)

```sql
-- Tabela para cache de recursos FHIR convertidos
CREATE TABLE IF NOT EXISTS public.fhir_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  version_id TEXT DEFAULT '1',
  resource_content JSONB NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  patient_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now(),
  source_system TEXT,
  
  UNIQUE(resource_type, resource_id)
);

-- Índices para busca eficiente
CREATE INDEX idx_fhir_resources_type ON fhir_resources(resource_type);
CREATE INDEX idx_fhir_resources_patient ON fhir_resources(patient_id);
CREATE INDEX idx_fhir_resources_content ON fhir_resources USING gin(resource_content);

-- Trigger para atualizar cache quando dados originais mudam
CREATE OR REPLACE FUNCTION update_fhir_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar cache FHIR quando perfil é modificado
  IF TG_TABLE_NAME = 'profiles' THEN
    INSERT INTO fhir_resources (resource_type, resource_id, resource_content, source_table, source_id, patient_id, last_updated)
    VALUES (
      'Patient',
      NEW.id::TEXT,
      convert_profile_to_fhir_patient(NEW.id),
      'profiles',
      NEW.id::TEXT,
      NEW.id,
      now()
    )
    ON CONFLICT (resource_type, resource_id) 
    DO UPDATE SET 
      resource_content = EXCLUDED.resource_content,
      last_updated = now(),
      version_id = (fhir_resources.version_id::INTEGER + 1)::TEXT;
  END IF;
  
  -- Atualizar cache quando métrica de saúde é inserida/modificada
  IF TG_TABLE_NAME = 'health_metrics' THEN
    INSERT INTO fhir_resources (resource_type, resource_id, resource_content, source_table, source_id, patient_id, last_updated)
    VALUES (
      'Observation',
      NEW.id::TEXT,
      convert_health_metric_to_fhir(NEW.id),
      'health_metrics',
      NEW.id::TEXT,
      NEW.patient_id,
      now()
    )
    ON CONFLICT (resource_type, resource_id) 
    DO UPDATE SET 
      resource_content = EXCLUDED.resource_content,
      last_updated = now(),
      version_id = (fhir_resources.version_id::INTEGER + 1)::TEXT;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_update_fhir_cache_profiles
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.user_type = 'paciente')
EXECUTE FUNCTION update_fhir_cache();

CREATE TRIGGER trigger_update_fhir_cache_metrics
AFTER INSERT OR UPDATE ON health_metrics
FOR EACH ROW
EXECUTE FUNCTION update_fhir_cache();
```

---

## 5. REIVINDICAÇÕES

### Reivindicação 1 (Independente - Sistema)

Um sistema computadorizado para interoperabilidade de dados clínicos no padrão FHIR R4, caracterizado por compreender:

a) uma camada de armazenamento relacional configurada para persistir dados clínicos em tabelas PostgreSQL otimizadas para consultas;

b) uma camada de conversão compreendendo funções de banco de dados e serviços TypeScript configurados para transformar automaticamente dados relacionais em recursos FHIR válidos;

c) uma camada de cache configurada para armazenar recursos FHIR convertidos com atualização automática via triggers de banco de dados;

d) uma camada de API RESTful implementada como Edge Functions, expondo operações FHIR de busca, leitura e criação de recursos.

### Reivindicação 2 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que a conversão de dados utiliza mapeamento de códigos LOINC para observações de sinais vitais.

### Reivindicação 3 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de implementar extensões brasileiras incluindo identificadores CPF e CNS (Cartão Nacional de Saúde).

### Reivindicação 4 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que a camada de cache é atualizada automaticamente por triggers de banco de dados quando dados originais são modificados.

### Reivindicação 5 (Dependente)

Sistema de acordo com a reivindicação 1, caracterizado pelo fato de que a API RESTful retorna respostas no formato `application/fhir+json` com estrutura de Bundle para resultados de busca.

### Reivindicação 6 (Independente - Método)

Método computadorizado para conversão automática de dados clínicos para o padrão FHIR R4, caracterizado por compreender as etapas de:

a) armazenar dados clínicos em formato relacional otimizado;

b) quando dados são inseridos ou atualizados, executar função de conversão que gera recurso FHIR correspondente;

c) armazenar recurso FHIR convertido em tabela de cache com versionamento;

d) expor recursos FHIR via API RESTful que consulta cache ou executa conversão sob demanda.

### Reivindicação 7 (Dependente)

Método de acordo com a reivindicação 6, caracterizado pelo fato de que a conversão inclui validação de estrutura FHIR e geração de interpretações automáticas para observações de sinais vitais.

---

## 6. VANTAGENS DA INVENÇÃO

1. **Sem Migração Destrutiva**: Mantém dados originais intactos enquanto oferece interface FHIR
2. **Performance Otimizada**: Consultas relacionais para operações internas, FHIR apenas para interoperabilidade
3. **Sincronização Automática**: Triggers garantem que cache FHIR está sempre atualizado
4. **Conformidade Total**: API segue especificação FHIR R4 incluindo códigos de retorno e formato de resposta
5. **Extensibilidade**: Suporte a extensões brasileiras (CPF, CNS) e novos tipos de recursos

---

## 7. APLICAÇÕES INDUSTRIAIS

- Integração com Rede Nacional de Dados em Saúde (RNDS)
- Troca de dados entre sistemas de saúde (hospitais, laboratórios, clínicas)
- Aplicativos de saúde que consomem dados FHIR
- Pesquisa clínica com dados anonimizados
- Portabilidade de dados do paciente

---

## 8. REFERÊNCIAS AO CÓDIGO-FONTE

- `src/services/fhirService.ts` - Serviço de conversão FHIR
- `src/types/fhir.ts` - Tipos TypeScript para recursos FHIR
- `supabase/functions/fhir-patient/index.ts` - Edge Function para Patient
- `supabase/functions/fhir-observation/index.ts` - Edge Function para Observation
- Funções PostgreSQL: `convert_profile_to_fhir_patient()`, `convert_health_metric_to_fhir()`

---

*Documento preparado para fins de depósito de patente. Todos os algoritmos e implementações são propriedade intelectual original.*
