// Legacy - Replaced by agendamentoService
import type { Doctor as DbDoctor } from '@/types/database';

export type Doctor = DbDoctor;
export interface LocalComHorarios { id: string; nome_local: string; endereco: any; horarios_disponiveis: any[]; }
export type Medico = Doctor;
export interface TimeSlot { 
  time: string; 
  available: boolean; 
  type?: string; 
  location_id?: string; 
  estimated_duration?: number;
  confidence_score?: number;
}

export const schedulingService = {
  searchDoctors: async (specialty: string, state: string, city: string) => [] as Doctor[],
  getAvailableSlots: async (doctorId: string, date: string) => [] as LocalComHorarios[],
  scheduleAppointment: async (data: any) => ({}),
  getSpecialties: async () => [] as string[],
  createAppointment: async (data: any) => ({})
};
export default schedulingService;
