import { ProfileV2, PatientProfile, DoctorProfile, FamilyMemberProfile } from '@/types/profiles';
import { Tables } from '@/integrations/supabase/types';

// ============= Legacy User Types (for backward compatibility) =============
export type UserType = 'paciente' | 'medico';

export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: 'pt-BR';
}

export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  userType: UserType;
  onboardingCompleted: boolean;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  preferences: UserPreferences;
  // Doctor specific fields
  especialidades?: string[];
  crm?: string;
}

// ============= Enhanced User Types for v2 Schema =============

export interface UserAuth {
  id: string;
  email: string;
  phone?: string;
  role?: 'patient' | 'doctor' | 'admin' | 'family_member';
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: UserAuth;
}

export interface UserProfile extends ProfileV2 {
  // Enhanced user profile that extends the base ProfileV2
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'pt-BR' | 'en-US';
    timezone?: string;
  };
  last_login?: string;
  is_active: boolean;
}

// Union types for transition period
export type LegacyUser = BaseUser;
export type ModernUser = UserProfile;
export type UnifiedUser = LegacyUser | ModernUser;

// Type guards for user types
export function isLegacyUser(user: UnifiedUser): user is LegacyUser {
  return 'uid' in user && 'userType' in user;
}

export function isModernUser(user: UnifiedUser): user is ModernUser {
  return 'user_id' in user && 'role' in user && 'full_name' in user;
}

export interface OnboardingStatus {
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  canProceed: boolean;
  errors: string[];
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Medico {
  userId: string;
  crm: string;
  especialidades: string[];
  registroEspecialista: string;
  telefone: string;
  whatsapp: string;
  endereco: Endereco;
  dadosProfissionais: {
    nomeCompleto: string;
    cpf: string;
    dataNascimento: Date;
    formacao: string;
    instituicao: string;
    anoFormacao: number;
  };
  configuracoes: {
    duracaoConsulta: number;
    valorConsulta: number;
    aceitaConvenio: boolean;
    conveniosAceitos: string[];
    horarioAtendimento: {
      [key: string]: { inicio: string; fim: string; ativo: boolean };
    };
  };
  verificacao: {
    crmVerificado: boolean;
    documentosEnviados: boolean;
    aprovado: boolean;
    dataAprovacao?: Date;
  };
}

export interface Paciente {
  userId: string;
  dadosPessoais: {
    nomeCompleto: string;
    cpf: string;
    rg: string;
    dataNascimento: Date;
    genero: 'masculino' | 'feminino' | 'outro';
    estadoCivil: string;
    profissao: string;
  };
  contato: {
    telefone: string;
    whatsapp: string;
    telefoneEmergencia: string;
    contatoEmergencia: string;
  };
  endereco: Endereco;
  dadosMedicos: {
    tipoSanguineo: string;
    alergias: string[];
    medicamentosUso: string[];
    condicoesCronicas: string[];
    cirurgiasAnteriores: string[];
    historicoFamiliar: string[];
  };
  convenio: {
    temConvenio: boolean;
    nomeConvenio: string;
    numeroCartao: string;
    validade?: Date;
    tipoPlano: string;
  };
}