import { supabase } from '@/integrations/supabase/client';
import { generateTimeSlots, DoctorConfig, TimeSlot, ExistingAppointment } from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';
import { LocalAtendimento } from './locationService';

export interface Medico { id: string; display_name: string | null; }
export interface LocalComHorarios extends LocalAtendimento { horarios_disponiveis: TimeSlot[]; }

const checkAuthentication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Você precisa estar logado para realizar esta ação.");
  return user;
};

export const appointmentService = {
  async getSpecialties(): Promise<string[]> {
    await checkAuthentication();
    const { data, error } = await supabase.rpc('get_specialties');
    if (error) throw new Error(`Erro ao buscar especialidades: ${error.message}`);
    return (data || []).sort();
  },

  async getAvailableCities(stateUf: string): Promise<{ cidade: string }[]> {
    await checkAuthentication();
    const { data, error } = await supabase.rpc('get_available_cities', { state_uf: stateUf });
    if (error) throw new Error(`Erro ao buscar cidades: ${error.message}`);
    return data || [];
  },

  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<Medico[]> {
    await checkAuthentication();
    const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', { p_specialty: specialty, p_city: city, p_state: state });
    if (error) throw error;
    return (data as Medico[]) || [];
  },

  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    await checkAuthentication();
    if (!doctorId || !date) return [];

    const { data: medico, error } = await supabase.from('medicos').select('configuracoes, locais_atendimento(*)').eq('user_id', doctorId).single();
    if (error) throw new Error(`Erro ao buscar dados do médico: ${error.message}`);
    
    const config = (medico.configuracoes as DoctorConfig) || {};
    const locais = (medico.locais_atendimento as LocalAtendimento[]) || [];
    const horarioAtendimento = config.horarioAtendimento || {};
    const diaDaSemana = new Date(date + 'T12:00:00Z').toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
    
    const blocosDoDia = horarioAtendimento[diaDaSemana] || [];

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const { data: appointments } = await supabase.from('consultas').select('data_consulta, duracao_minutos').eq('medico_id', doctorId).gte('data_consulta', startOfDay.toISOString()).lte('data_consulta', endOfDay.toISOString());
    const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({ data_consulta: apt.data_consulta, duracao_minutos: apt.duracao_minutos || 30 }));

    const locaisComHorarios: LocalComHorarios[] = [];
    for (const local of locais) {
      if (!local.ativo) continue;
      const blocosNesteLocal = blocosDoDia.filter((b: any) => b.local_id === local.id);
      if (blocosNesteLocal.length > 0) {
        const horarios = generateTimeSlots({ duracaoConsulta: config.duracaoConsulta || 30, horarioAtendimento: { [diaDaSemana]: blocosNesteLocal } }, startOfDay, existingAppointments);
        if (horarios.length > 0) {
          locaisComHorarios.push({ ...local, horarios_disponiveis: horarios });
        }
      }
    }
    return locaisComHorarios;
  },

  async scheduleAppointment(appointmentData: { paciente_id: string; medico_id: string; data_consulta: string; tipo_consulta: string; local_id: string; local_consulta: string; }) {
    await checkAuthentication();
    const { error } = await supabase.from('consultas').insert({ ...appointmentData, status: 'agendada' });
    if (error) throw error;
    return { success: true };
  }
};
