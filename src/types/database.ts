// Database types that extend the Supabase generated types
import { Tables } from '@/integrations/supabase/types';

// Core extended types with all properties that components expect
export type Doctor = Omit<Partial<Tables<'medicos'>>, 'id'> & {
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
};

export type Patient = Omit<Partial<Tables<'pacientes'>>, 'id'> & {
  id: string;
  display_name?: string;
  nome?: string;
  usuario_id?: string;
};

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
export const convertDatabaseDoctor = (doctor: any): Doctor => {
  const rawDoctor = doctor ?? {};
  const parsedId = toStringId(rawDoctor.id ?? rawDoctor.user_id ?? '');
  const parsedUserId =
    rawDoctor.user_id != null ? toStringId(rawDoctor.user_id) : undefined;
  const parsedUsuarioId =
    rawDoctor.usuario_id != null
      ? toStringId(rawDoctor.usuario_id)
      : parsedUserId;
  const parsedRating = rawDoctor.rating ?? 0;
  const parsedTotalAvaliacoes = rawDoctor.total_avaliacoes ?? 0;
  const parsedDuracao = rawDoctor.duracao_consulta_inicial ?? 30;

  return {
    ...rawDoctor,
    id: parsedId,
    user_id: parsedUserId,
    display_name: rawDoctor.display_name ?? rawDoctor.nome,
    nome: rawDoctor.nome ?? rawDoctor.display_name,
    foto_perfil_url: rawDoctor.foto_perfil_url ?? rawDoctor.photo_url,
    rating:
      typeof parsedRating === 'number'
        ? parsedRating
        : Number(parsedRating) || 0,
    total_avaliacoes:
      typeof parsedTotalAvaliacoes === 'number'
        ? parsedTotalAvaliacoes
        : Number(parsedTotalAvaliacoes) || 0,
    bio_perfil: rawDoctor.bio_perfil,
    usuario_id: parsedUsuarioId,
    duracao_consulta_inicial:
      typeof parsedDuracao === 'number'
        ? parsedDuracao
        : Number(parsedDuracao) || 30,
    especialidades: Array.isArray(rawDoctor.especialidades)
      ? rawDoctor.especialidades
      : [],
    especialidade: rawDoctor.especialidade,
    crm: rawDoctor.crm,
    uf_crm: rawDoctor.uf_crm,
    email: rawDoctor.email
  };
};

export const convertDatabasePatient = (patient: any): Patient => {
  const rawPatient = patient ?? {};
  const parsedId = toStringId(rawPatient.id ?? rawPatient.user_id ?? '');
  const parsedUserId =
    rawPatient.user_id != null ? toStringId(rawPatient.user_id) : undefined;
  const parsedUsuarioId =
    rawPatient.usuario_id != null
      ? toStringId(rawPatient.usuario_id)
      : parsedUserId;

  return {
    ...rawPatient,
    id: parsedId,
    user_id: parsedUserId,
    display_name: rawPatient.display_name ?? rawPatient.nome,
    nome: rawPatient.nome ?? rawPatient.display_name,
    usuario_id: parsedUsuarioId
  };
};

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