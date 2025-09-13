// Temporary type fixes while database schema is being normalized
import { safeStringId } from './idUtils';

// Extended types to handle schema inconsistencies temporarily
export interface DoctorExtended {
  id: string;
  display_name: string;
  foto_perfil_url?: string | null;
  rating?: number | null;
  total_avaliacoes?: number | null;
  bio_perfil?: string | null;
  usuario_id?: string;
  duracao_consulta_inicial?: number;
  especialidades?: string[];
}

export interface PatientExtended {
  id: string;
  display_name: string;
  usuario_id?: string;
}

export interface AppointmentExtended {
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
  observacoes_medico?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFiltersExtended {
  specialty?: string;
  city?: string;
  state?: string;
  rating_minimo?: number;
  available_today?: boolean;
  accepts_insurance?: boolean;
}

// Helper functions to safely convert objects
export const safeDoctorConvert = (doctor: any): DoctorExtended => ({
  id: safeStringId(doctor.id),
  display_name: doctor.display_name || doctor.nome || 'Médico',
  foto_perfil_url: doctor.foto_perfil_url || doctor.photo_url,
  rating: doctor.rating || 0,
  total_avaliacoes: doctor.total_avaliacoes || 0,
  bio_perfil: doctor.bio_perfil,
  usuario_id: doctor.usuario_id || doctor.user_id,
  duracao_consulta_inicial: doctor.duracao_consulta_inicial || 30,
  especialidades: doctor.especialidades || []
});

export const safePatientConvert = (patient: any): PatientExtended => ({
  id: safeStringId(patient.id),
  display_name: patient.display_name || patient.nome || 'Paciente',
  usuario_id: patient.usuario_id || patient.user_id
});

export const safeAppointmentConvert = (appointment: any): AppointmentExtended => ({
  id: safeStringId(appointment.id),
  medico_id: safeStringId(appointment.medico_id),
  paciente_id: safeStringId(appointment.paciente_id),
  consultation_date: appointment.consultation_date || appointment.data_consulta,
  consultation_type: appointment.consultation_type || appointment.tipo,
  status: appointment.status,
  status_pagamento: appointment.status_pagamento || 'pendente',
  patient_name: appointment.patient_name,
  patient_email: appointment.patient_email,
  notes: appointment.notes,
  prioridade: appointment.prioridade || 'normal',
  observacoes_medico: appointment.observacoes_medico,
  created_at: appointment.created_at,
  updated_at: appointment.updated_at
});