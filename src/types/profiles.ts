import { Tables } from '@/integrations/supabase/types';

// ============= New Normalized Profile Types =============

export type UserRole = 'patient' | 'doctor' | 'admin' | 'family_member';
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

// New normalized profile type (v2)
export interface ProfileV2 {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  cpf?: string;
  onboarding_completed: boolean;
  onboarding_status: OnboardingStatus;
  created_at: string;
  updated_at?: string;
}

// Legacy profile types (from pacientes/medicos tables)
export type PatientLegacy = Tables<'pacientes'>;
export type DoctorLegacy = Tables<'medicos'>;

// Union types for transition period
export type UnifiedProfile = ProfileV2 | PatientLegacy | DoctorLegacy;

// ============= Profile-related Types =============

export interface DoctorProfile extends ProfileV2 {
  role: 'doctor';
  crm: string;
  specialties: string[];
  professional_data: {
    registration_number: string;
    practice_locations: string[];
    experience_years?: number;
  };
  verification_status: {
    crm_verified: boolean;
    documents_submitted: boolean;
    approved: boolean;
  };
}

export interface PatientProfile extends ProfileV2 {
  role: 'patient';
  medical_data: {
    allergies?: string[];
    medications?: string[];
    medical_conditions?: string[];
    insurance_info?: {
      has_insurance: boolean;
      provider?: string;
      plan?: string;
    };
  };
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface FamilyMemberProfile extends ProfileV2 {
  role: 'family_member';
  main_user_id: string;
  relationship: string;
  permissions: {
    can_schedule: boolean;
    can_view_history: boolean;
    can_cancel: boolean;
  };
}

// ============= Type Guards =============

export function isLegacyPatient(profile: UnifiedProfile): profile is PatientLegacy {
  return 'dados_pessoais' in profile && 'contato' in profile;
}

export function isLegacyDoctor(profile: UnifiedProfile): profile is DoctorLegacy {
  return 'crm' in profile && 'especialidades' in profile;
}

export function isV2Profile(profile: UnifiedProfile): profile is ProfileV2 {
  return 'role' in profile && 'full_name' in profile;
}

export function isDoctorProfile(profile: ProfileV2): profile is DoctorProfile {
  return profile.role === 'doctor';
}

export function isPatientProfile(profile: ProfileV2): profile is PatientProfile {
  return profile.role === 'patient';
}

// ============= Conversion Types =============

export interface ProfileConversionResult {
  v2: ProfileV2;
  source: 'legacy_patient' | 'legacy_doctor' | 'v2';
  converted: boolean;
}