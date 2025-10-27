/**
 * Legacy compatibility layer for appointment service
 * Re-exports methods from agendamentoService with legacy signatures
 */

import { supabase } from '@/integrations/supabase/client';
import { agendamentoService } from './agendamento';
import type { Medico, LocalComHorarios } from './agendamento/types';

export type { Medico, LocalComHorarios };

// Re-export as named exports for backward compatibility
export const getSpecialties = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_specialties');
  if (error) throw error;
  return data || [];
};

export const getStates = async (): Promise<any[]> => {
  const { data, error } = await supabase.rpc('get_available_states');
  if (error) throw error;
  return data || [];
};

export const getCities = async (uf: string): Promise<any[]> => {
  const { data, error } = await supabase.rpc('get_available_cities', { state_uf: uf });
  if (error) throw error;
  return data || [];
};

export const getMedicos = async (
  specialty: string,
  state: string,
  city: string
): Promise<Medico[]> => {
  return agendamentoService.buscarMedicos(specialty, state, city);
};

export const getHorarios = async (
  doctorId: string,
  date: string
): Promise<any[]> => {
  const locais = await agendamentoService.buscarHorarios(doctorId, date);
  return locais.map(local => ({
    ...local,
    id: local.id.toString(),
    horarios: local.horarios_disponiveis
  }));
};

// Main service object for legacy imports
export const appointmentService = {
  getSpecialties,
  getStates,
  getCities,
  getMedicos,
  getHorarios,
  getDoctorsByLocationAndSpecialty: getMedicos,
  getAvailableSlotsByDoctor: getHorarios,
  searchDoctors: getMedicos,
  getAvailableSlots: getHorarios,
  createAppointment: async (appointmentData: any) => {
    return agendamentoService.criarConsulta(appointmentData);
  },
  scheduleAppointment: async (appointmentData: any) => {
    return agendamentoService.criarConsulta(appointmentData);
  }
};
