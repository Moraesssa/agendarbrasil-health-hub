// Database types that extend the Supabase generated types
import { Tables } from '@/integrations/supabase/types';

// Core extended types with all properties that components expect
export interface Doctor extends Partial<Tables<'medicos'>> {
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

export interface Patient extends Partial<Tables<'pacientes'>> {
  id: string;
  display_name?: string;
  nome?: string;
  usuario_id?: string;
}

export interface Profile extends Tables<'profiles'> {
  avatar_url?: string;
}

// Appointment types with all extended fields
export interface Appointment {
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

export interface AppointmentWithDoctor extends Appointment {
  doctor_profile?: Doctor;
  patient_profile?: Patient;
}

// Search and filter types
export interface SearchFilters {
  specialty?: string;
  city?: string;
  state?: string;
  rating_minimo?: number;
  available_today?: boolean;
  accepts_insurance?: boolean;
}

// Location types
export interface Location {
  id: string;
  nome_local?: string;
  endereco?: any;
  cidade?: string;
  estado?: string;
  ativo?: boolean;
}

// Recent appointments for dashboard
export interface RecentAppointment {
  id: string;
  status: string;
  consultation_date: string;
  patient_profile?: any;
}

// Utility function to convert number IDs to strings
export const toStringId = (id: number | string): string => {
  return typeof id === 'number' ? id.toString() : id;
};

// Utility function to convert string IDs to numbers (when needed)
export const toNumberId = (id: string | number): number => {
  return typeof id === 'string' ? parseInt(id, 10) : id;
};

// Safe conversion functions
export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return value.toString();
};

export const safeToNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return isNaN(num) ? 0 : num;
};

// Safe data conversion functions for components
export const convertDatabaseDoctor = (doctor: any): Doctor => ({
  id: String(doctor?.id || doctor?.user_id || ''),
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

export const convertDatabasePatient = (patient: any): Patient => ({
  id: String(patient?.id || patient?.user_id || ''),
  display_name: patient?.display_name || patient?.nome,
  nome: patient?.nome || patient?.display_name,
  usuario_id: patient?.usuario_id || patient?.user_id,
  ...patient
});

export const convertDatabaseAppointment = (appointment: any): Appointment => ({
  id: String(appointment?.id || ''),
  medico_id: String(appointment?.medico_id || ''),
  paciente_id: String(appointment?.paciente_id || ''),
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
  updated_at: appointment?.updated_at
});