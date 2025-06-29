import { supabase } from '@/integrations/supabase/client';
import { 
  generateTimeSlots, 
  getDefaultWorkingHours,
  DoctorConfig, 
  TimeSlot,
  ExistingAppointment
} from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';

// Tipos atualizados
export interface Medico {
  id: string;
  display_name: string | null;
}
export interface LocalComHorarios extends LocalAtendimento {
  horarios_disponiveis: TimeSlot[];
}
export interface LocalAtendimento {
  id: string;
  nome_local: string;
  endereco: any;
}

const checkAuthentication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error("User not authenticated", "AppointmentService");
    throw new Error("Você precisa estar logado para realizar esta ação");
  }
  return user;
};

export const appointmentService = {
  // ... (getSpecialties permanece o mesmo)
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "AppointmentService");
    try {
      await checkAuthentication();
      const { data, error } = await supabase.rpc('get_specialties');
      if (error) throw new Error(`Erro ao buscar especialidades: ${error.message}`);
      return (data || []).sort();
    } catch (error) {
      logger.error("Failed to fetch specialties", "AppointmentService", error);
      throw error;
    }
  },

  // Busca médicos que atendem em uma cidade/estado específica e com a especialidade desejada
  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<Medico[]> {
    await checkAuthentication();
    const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: specialty,
      p_city: city,
      p_state: state
    });
    if (error) {
      logger.error("Error fetching doctors by location", "AppointmentService", error);
      throw error;
    }
    return data || [];
  },

  // Busca os locais e horários disponíveis para um médico em uma data específica
  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    await checkAuthentication();
    if (!doctorId || !date) return [];

    const { data: medico, error: medicoError } = await supabase
      .from('medicos')
      .select('configuracoes, locais:locais_atendimento(*)')
      .eq('user_id', doctorId)
      .single();

    if (medicoError) throw new Error(`Erro ao buscar dados do médico: ${medicoError.message}`);

    const { configuracoes, locais } = medico;
    const horarioAtendimento = configuracoes?.horarioAtendimento || {};
    const diaDaSemana = new Date(date + 'T00:00:00').toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    const blocosDoDia = horarioAtendimento[diaDaSemana] || [];
    
    // Busca todas as consultas do médico para o dia para evitar conflitos
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const { data: appointments } = await supabase
      .from('consultas')
      .select('data_consulta, duracao_minutos, local_id')
      .eq('medico_id', doctorId)
      .gte('data_consulta', startOfDay.toISOString())
      .lte('data_consulta', endOfDay.toISOString());
    
    const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
      data_consulta: apt.data_consulta,
      duracao_minutos: apt.duracao_minutos || 30
    }));

    const locaisComHorarios: LocalComHorarios[] = [];

    for (const local of locais) {
      const horariosNesteLocal = generateTimeSlots({
        duracaoConsulta: configuracoes.duracaoConsulta || 30,
        horarioAtendimento: { [diaDaSemana]: blocosDoDia.filter(b => b.local_id === local.id) }
      }, new Date(date + 'T00:00:00'), existingAppointments);

      if (horariosNesteLocal.length > 0) {
        locaisComHorarios.push({
          ...local,
          horarios_disponiveis: horariosNesteLocal
        });
      }
    }
    
    return locaisComHorarios;
  },

  // Salva o agendamento com o local da consulta
  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    data_consulta: string;
    tipo_consulta: string;
    local_id: string;
    local_consulta_texto: string;
  }) {
    await checkAuthentication();
    const { error } = await supabase.from('consultas').insert({
      paciente_id: appointmentData.paciente_id,
      medico_id: appointmentData.medico_id,
      data_consulta: appointmentData.data_consulta,
      tipo_consulta: appointmentData.tipo_consulta,
      local_id: appointmentData.local_id, // <-- NOVO
      local_consulta: appointmentData.local_consulta_texto, // <-- NOVO
      status: 'agendada',
    });
    if (error) throw error;
    return { success: true };
  }
};