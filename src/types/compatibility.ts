// Temporary compatibility layer for schema transition
import { Tables } from '@/integrations/supabase/types';
import { safeStringId, safeNumberId } from '@/utils/idUtils';

// Extended Doctor type with all properties that components expect
export interface CompatibleDoctor extends Partial<Tables<'medicos'>> {
  id: string;
  display_name?: string;
  nome?: string;
  foto_perfil_url?: string;
  rating?: number;
  total_avaliacoes?: number;
  bio_perfil?: string;
  usuario_id?: string;
  duracao_consulta_inicial?: number;
  especialidades?: string[];
  especialidade?: string;
  crm?: string;
  uf_crm?: string;
  email?: string;
}

// Extended Patient type
export interface CompatiblePatient extends Partial<Tables<'pacientes'>> {
  id: string;
  display_name?: string;
  nome?: string;
  usuario_id?: string;
}

// Extended Appointment type
export interface CompatibleAppointment extends Partial<Tables<'consultas'>> {
  id: string;
  medico_id?: string;
  paciente_id?: string;
  consultation_date?: string;
  consultation_type?: string;
  status?: string;
  status_pagamento?: string;
  patient_name?: string;
  patient_email?: string;
  notes?: string;
  prioridade?: string;
  observacoes_medico?: string;
  created_at?: string;
  updated_at?: string;
}

// Extended SearchFilters
export interface CompatibleSearchFilters {
  specialty?: string;
  city?: string;
  state?: string;
  rating_minimo?: number;
  available_today?: boolean;
  accepts_insurance?: boolean;
}

// Extended Location type
export interface CompatibleLocation {
  id: string | number;
  nome_local?: string;
  endereco?: any;
  cidade?: string;
  estado?: string;
  ativo?: boolean;
}

// Safe conversion functions
export const toCompatibleDoctor = (doctor: any): CompatibleDoctor => ({
  id: safeStringId(doctor?.id || doctor?.user_id),
  display_name: doctor?.display_name || doctor?.nome,
  nome: doctor?.nome || doctor?.display_name,
  foto_perfil_url: doctor?.foto_perfil_url || doctor?.photo_url,
  rating: doctor?.rating || 0,
  total_avaliacoes: doctor?.total_avaliacoes || 0,
  bio_perfil: doctor?.bio_perfil,
  usuario_id: doctor?.usuario_id || doctor?.user_id,
  duracao_consulta_inicial: doctor?.duracao_consulta_inicial || 30,
  especialidades: doctor?.especialidades || [],
  especialidade: doctor?.especialidade,
  crm: doctor?.crm,
  uf_crm: doctor?.uf_crm,
  email: doctor?.email,
  ...doctor
});

export const toCompatiblePatient = (patient: any): CompatiblePatient => ({
  id: safeStringId(patient?.id || patient?.user_id),
  display_name: patient?.display_name || patient?.nome,
  nome: patient?.nome || patient?.display_name,
  usuario_id: patient?.usuario_id || patient?.user_id,
  ...patient
});

export const toCompatibleAppointment = (appointment: any): CompatibleAppointment => ({
  id: safeStringId(appointment?.id),
  medico_id: safeStringId(appointment?.medico_id),
  paciente_id: safeStringId(appointment?.paciente_id),
  consultation_date: appointment?.consultation_date,
  consultation_type: appointment?.consultation_type,
  status: appointment?.status,
  status_pagamento: appointment?.status_pagamento || 'pendente',
  patient_name: appointment?.patient_name,
  patient_email: appointment?.patient_email,
  notes: appointment?.notes,
  prioridade: appointment?.prioridade || 'normal',
  observacoes_medico: appointment?.observacoes_medico,
  created_at: appointment?.created_at,
  updated_at: appointment?.updated_at,
  ...appointment
});

export const toCompatibleLocation = (location: any): CompatibleLocation => ({
  id: safeStringId(location?.id),
  nome_local: location?.nome_local,
  endereco: location?.endereco,
  cidade: location?.cidade,
  estado: location?.estado,
  ativo: location?.ativo,
  ...location
});

// Export compatibility functions without re-exporting main types
// Main types are exported from database.ts to avoid conflicts