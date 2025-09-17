import { Tables } from '@/integrations/supabase/types';

// ============= New Normalized Appointment Types =============

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'consultation' | 'follow_up' | 'telemedicine' | 'emergency';

// New normalized appointment type (v2)
export interface AppointmentV2 {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_datetime: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  location_id?: string;
  local_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Legacy appointment type (from consultas table)
export type AppointmentLegacy = Tables<'consultas'>;

// Union type for transition period - supports both schemas
export type UnifiedAppointment = AppointmentV2 | AppointmentLegacy;

// ============= Appointment-related Types =============

export interface AppointmentDetails extends AppointmentV2 {
  doctor_name?: string;
  doctor_specialties?: string[];
  location_name?: string;
  location_address?: string;
  patient_name?: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  appointmentType?: AppointmentType[];
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

// ============= Type Guards =============

export function isLegacyAppointment(appointment: UnifiedAppointment): appointment is AppointmentLegacy {
  return 'consulta_date' in appointment || 'consultation_date' in appointment;
}

export function isV2Appointment(appointment: UnifiedAppointment): appointment is AppointmentV2 {
  return 'scheduled_datetime' in appointment && !('consultation_date' in appointment);
}

// ============= Conversion Types =============

export interface AppointmentConversionResult {
  v2: AppointmentV2;
  source: 'legacy' | 'v2';
  converted: boolean;
}