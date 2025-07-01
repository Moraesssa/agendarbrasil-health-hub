
import { supabase } from '@/integrations/supabase/client';
import { 
  generateTimeSlots, 
  DoctorConfig, 
  TimeSlot,
  ExistingAppointment,
  WorkingHours,
  DayWorkingHours
} from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';

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

const isValidConfiguration = (config: any): config is { horarioAtendimento?: WorkingHours; duracaoConsulta?: number } => {
  return config && typeof config === 'object';
};

const checkAuthentication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error("User not authenticated", "AppointmentService");
    throw new Error("Você precisa estar logado para realizar esta ação");
  }
  return user;
};

export const appointmentService = {
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
    return (data || []) as Medico[];
  },

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
    const config = isValidConfiguration(configuracoes) ? configuracoes : {};
    const horarioAtendimento = config.horarioAtendimento || {};
    const diaDaSemana = new Date(date + 'T00:00:00').toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

    const blocosDoDia = horarioAtendimento[diaDaSemana] || [];
    
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

    // Garantir que locais é um array de objetos
    const locaisArray = Array.isArray(locais) ? locais : [];

    for (const local of locaisArray) {
      // Verificar se local é um objeto válido
      if (!local || typeof local !== 'object' || !local.id) continue;

      // Verificar se blocosDoDia é array e filtrar blocos para este local
      const blocosDoLocal = Array.isArray(blocosDoDia) 
        ? blocosDoDia.filter((bloco: any) => 
            bloco && 
            typeof bloco === 'object' && 
            bloco.local_id && 
            bloco.local_id === local.id
          )
        : [];

      if (blocosDoLocal.length > 0) {
        // Criar WorkingHours válido
        const workingHours: WorkingHours = {};
        workingHours[diaDaSemana] = blocosDoLocal;

        const horariosNesteLocal = generateTimeSlots({
          duracaoConsulta: config.duracaoConsulta || 30,
          horarioAtendimento: workingHours
        }, new Date(date + 'T00:00:00'), existingAppointments);

        if (horariosNesteLocal.length > 0) {
          locaisComHorarios.push({
            id: local.id,
            nome_local: local.nome_local,
            endereco: local.endereco,
            horarios_disponiveis: horariosNesteLocal
          });
        }
      }
    }
    
    return locaisComHorarios;
  },

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
      local_id: appointmentData.local_id,
      local_consulta: appointmentData.local_consulta_texto,
      status: 'agendada',
    });
    if (error) throw error;
    return { success: true };
  }
};
