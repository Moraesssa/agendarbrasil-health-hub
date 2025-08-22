import { Medico, LocalComHorarios } from '@/services/newAppointmentService';

/**
 * Unified contract for appointment services
 * This interface ensures both real and mock services implement the same methods
 */
export interface IAppointmentService {
  /**
   * Fetches all available medical specialties
   */
  getSpecialties(): Promise<string[]>;

  /**
   * Fetches doctors based on specialty, city and state
   */
  getDoctorsByLocationAndSpecialty(
    specialty: string, 
    city: string, 
    state: string
  ): Promise<Medico[]>;

  /**
   * Fetches available time slots for a specific doctor on a given date
   */
  getAvailableSlotsByDoctor(
    doctorId: string, 
    date: string
  ): Promise<LocalComHorarios[]>;

  /**
   * Creates a temporary reservation for a time slot
   */
  createTemporaryReservation(
    doctorId: string, 
    dateTime: string, 
    localId?: string
  ): Promise<{
    data: { id: string };
    sessionId: string;
    expiresAt: Date;
  }>;

  /**
   * Removes a temporary reservation
   */
  cleanupTemporaryReservation(sessionId: string): Promise<void>;

  /**
   * Extends the expiry time of a temporary reservation
   */
  extendReservation(sessionId: string): Promise<{ expiresAt: Date } | null>;

  /**
   * Schedules a final appointment
   */
  scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    consultation_date: string;
    consultation_type: string;
    local_consulta_texto: string;
    local_id?: string;
  }): Promise<any>;
}

/**
 * Environment types for service selection
 */
export type AppointmentServiceEnvironment = 'production' | 'development' | 'mock';