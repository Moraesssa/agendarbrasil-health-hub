// Legacy - Replaced by agendamentoService
import type { Doctor as DbDoctor, Appointment as DbAppointment, SearchFilters as DbSearchFilters, Location as DbLocation } from '@/types/database';

export type Doctor = DbDoctor;
export type SearchFilters = DbSearchFilters;
export type Location = DbLocation;
export type Appointment = DbAppointment & {
  paciente_id?: string;
  buffer_antes?: number;
  buffer_depois?: number;
  duracao_real?: number;
};

export class SchedulingService {
  async searchDoctors(filters?: any) { return [] as Doctor[]; }
  async getDoctorById(id: string) { return null as Doctor | null; }
  async getAvailableSlots(doctorId: string, date: string) { return []; }
  async scheduleAppointment(data: any) { return {} as Appointment; }
  async getSpecialties() { return []; }
  async createAppointment(data: any) { return {} as Appointment; }
  async getDoctorAppointments(id: string, filters?: any, options?: any) { return [] as Appointment[]; }
  async updateAppointmentStatus(id: string, status: string) { return {} as Appointment; }
}
export default new SchedulingService();
