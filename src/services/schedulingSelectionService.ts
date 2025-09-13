import { supabase } from '@/integrations/supabase/client';
import { newAppointmentService, Medico, LocalComHorarios } from './newAppointmentService';

export interface StateInfo { uf: string }
export interface CityInfo { cidade: string }

export interface SchedulingSelectionService {
  getSpecialties(): Promise<string[]>;
  getStates(): Promise<StateInfo[]>;
  getCities(state: string): Promise<CityInfo[]>;
  getDoctors(specialty: string, city: string, state: string): Promise<Medico[]>;
  getAvailableSlots(doctorId: string, date: string): Promise<LocalComHorarios[]>;
}

export function createSchedulingSelectionService(): SchedulingSelectionService {
  return {
    async getSpecialties() {
      return newAppointmentService.getSpecialties();
    },
    async getStates() {
      const { data } = await supabase.rpc('get_available_states');
      return data ?? [];
    },
    async getCities(state: string) {
      const { data } = await supabase.rpc('get_available_cities', { state_uf: state });
      return data ?? [];
    },
    async getDoctors(specialty: string, city: string, state: string) {
      return newAppointmentService.getDoctorsByLocationAndSpecialty(specialty, city, state);
    },
    async getAvailableSlots(doctorId: string, date: string) {
      return newAppointmentService.getAvailableSlotsByDoctor(doctorId, date);
    }
  };
}

export const schedulingSelectionService = createSchedulingSelectionService();

export type { Medico, LocalComHorarios };
