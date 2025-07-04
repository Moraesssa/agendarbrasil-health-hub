import { supabase } from '@/integrations/supabase/client';
import { 
  generateTimeSlots, 
  DoctorConfig, 
  TimeSlot,
  ExistingAppointment,
  WorkingHours,
  DayWorkingHours,
  getDayName
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

// Função para verificar se um horário específico ainda está disponível
const checkAvailabilityBeforeScheduling = async (
  doctorId: string, 
  appointmentDateTime: string
): Promise<boolean> => {
  const { data: existingAppointment, error } = await supabase
    .from('consultas')
    .select('id')
    .eq('medico_id', doctorId)
    .eq('data_consulta', appointmentDateTime)
    .in('status', ['agendada', 'confirmada'])
    .limit(1);

  if (error) {
    logger.error("Error checking appointment availability", "AppointmentService", error);
    throw new Error("Erro ao verificar disponibilidade do horário");
  }

  return !existingAppointment || existingAppointment.length === 0;
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
    
    // Usar a função getDayName para obter o dia da semana em português
    const diaDaSemana = getDayName(new Date(date + 'T00:00:00'));

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
    try {
      await checkAuthentication();

      // Verificação final de disponibilidade antes do agendamento
      const isAvailable = await checkAvailabilityBeforeScheduling(
        appointmentData.medico_id, 
        appointmentData.data_consulta
      );

      if (!isAvailable) {
        throw new Error("Este horário não está mais disponível. Por favor, selecione outro horário.");
      }

      const { error } = await supabase.from('consultas').insert({
        paciente_id: appointmentData.paciente_id,
        medico_id: appointmentData.medico_id,
        data_consulta: appointmentData.data_consulta,
        tipo_consulta: appointmentData.tipo_consulta,
        local_id: appointmentData.local_id,
        local_consulta: appointmentData.local_consulta_texto,
        status: 'agendada',
      });

      if (error) {
        // Verificar se é erro de constraint violation (agendamento duplicado)
        if (error.code === '23505' && error.message?.includes('idx_consultas_unique_slot')) {
          logger.warn("Attempt to schedule duplicate appointment", "AppointmentService", { 
            doctorId: appointmentData.medico_id, 
            dateTime: appointmentData.data_consulta 
          });
          throw new Error("Este horário já foi ocupado por outro paciente. Por favor, escolha outro horário disponível.");
        }
        
        logger.error("Error scheduling appointment", "AppointmentService", error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error("Failed to schedule appointment", "AppointmentService", error);
      throw error;
    }
  },

  async getHistory() {
    const user = await checkAuthentication();

    const { data: consultasData, error: consultasError } = await supabase
      .from('consultas')
      .select(`
        id,
        data_consulta,
        status,
        tipo_consulta,
        diagnostico_resumo,
        receita_emitida,
        medico:medicos (
          perfil:perfis (
            display_name,
            especialidade
          )
        )
      `)
      .eq('paciente_id', user.id)
      .order('data_consulta', { ascending: false });

    if (consultasError) {
      logger.error('Error fetching history (consultas)', 'appointmentService', consultasError);
      throw new Error('Não foi possível carregar o histórico de consultas.');
    }

    const { data: examesData, error: examesError } = await supabase
      .from('exames')
      .select(`
        id,
        nome,
        data_exame,
        status,
        resultado,
        medico_solicitante:medicos (
          perfil:perfis (
            display_name
          )
        )
      `)
      .eq('paciente_id', user.id)
      .order('data_exame', { ascending: false });

    if (examesError) {
      logger.warn('Could not fetch exams, maybe the table does not exist or the user has no exams.', 'appointmentService', examesError);
    }

    const consultas = (consultasData || []).map((c: any) => ({
      id: c.id,
      data: new Date(c.data_consulta).toLocaleDateString('pt-BR'),
      medico: c.medico?.perfil?.display_name || 'N/A',
      especialidade: c.medico?.perfil?.especialidade || c.tipo_consulta,
      diagnostico: c.diagnostico_resumo || 'Diagnóstico não disponível.',
      status: c.status,
      receita: c.receita_emitida || false,
    }));

    const exames = (examesData || []).map((e: any) => ({
      id: e.id,
      nome: e.nome,
      data: new Date(e.data_exame).toLocaleDateString('pt-BR'),
      medico: e.medico_solicitante?.perfil?.display_name || 'N/A',
      status: e.status,
      resultado: e.resultado,
    }));

    return {
      consultas,
      exames
    };
  },
};
