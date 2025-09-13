// Database types that extend the Supabase generated types
import { Tables } from '@/integrations/supabase/types';

// Core extended types
export interface Doctor extends Partial<Tables<'medicos'>> {
  id: string;
  display_name: string;
  foto_perfil_url?: string;
  rating?: number;
  total_avaliacoes?: number;
  bio_perfil?: string;
  usuario_id?: string;
  duracao_consulta_inicial?: number;
  especialidades?: string[];
}

export interface Patient extends Partial<Tables<'pacientes'>> {
  id: string;
  display_name: string;
  usuario_id?: string;
}

export interface Profile extends Tables<'profiles'> {
  avatar_url?: string;
}

// Appointment types with extended fields
export interface Appointment {
  id: string;
  medico_id: string;
  paciente_id: string;
  consultation_date: string;
  consultation_type?: string;
  status?: string;
  status_pagamento?: string;
  patient_name?: string;
  patient_email?: string;
  notes?: string;
  prioridade?: string;
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
  nome_local: string;
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