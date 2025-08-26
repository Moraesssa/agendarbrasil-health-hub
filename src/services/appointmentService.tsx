
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
    .eq('consultation_date', appointmentDateTime)
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
      .select('consultation_date')
      .eq('medico_id', doctorId)
      .gte('consultation_date', startOfDay.toISOString())
      .lte('consultation_date', endOfDay.toISOString());
    
    const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
      data_consulta: apt.consultation_date,
      duracao_minutos: 30
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
    consultation_date: string;
    consultation_type: string;
    notes?: string;
  }) {
    try {
      await checkAuthentication();
      logger.info("Scheduling appointment via v2 RPC", "AppointmentService");

      // Try v2 RPC first
      try {
        const { data, error } = await supabase.rpc('reserve_appointment_v2', {
          p_doctor_id: appointmentData.medico_id,
          p_appointment_datetime: appointmentData.consultation_date,
          p_specialty: appointmentData.consultation_type,
          p_family_member_id: null
        });

        if (error) {
          logger.warn("V2 RPC failed, falling back to legacy", "AppointmentService", error);
          throw error;
        }

        if (data && data.length > 0 && data[0].success) {
          logger.info("Appointment scheduled via v2 RPC", "AppointmentService");
          return { success: true, appointmentId: data[0].appointment_id };
        } else {
          const message = data?.[0]?.message || "Falha ao agendar";
          throw new Error(message);
        }
      } catch (v2Error) {
        logger.warn("V2 RPC failed, using legacy approach", "AppointmentService", v2Error);
        
        // Fallback to legacy method
        const isAvailable = await checkAvailabilityBeforeScheduling(
          appointmentData.medico_id, 
          appointmentData.consultation_date
        );

        if (!isAvailable) {
          throw new Error("Este horário não está mais disponível. Por favor, selecione outro horário.");
        }

        const appointmentDate = new Date(appointmentData.consultation_date);
        const now = new Date();
        
        if (appointmentDate <= now) {
          throw new Error("Não é possível agendar consultas para horários passados.");
        }

        const { error } = await supabase.from('consultas').insert({
          paciente_id: appointmentData.paciente_id,
          medico_id: appointmentData.medico_id,
          consultation_date: appointmentData.consultation_date,
          consultation_type: appointmentData.consultation_type,
          notes: appointmentData.notes,
          status: 'agendada',
          status_pagamento: 'pendente',
          patient_name: 'Nome do Paciente',
          patient_email: 'email@paciente.com'
        });

        if (error) {
          if (error.code === '23505' && error.message?.includes('idx_consultas_unique_slot')) {
            logger.warn("Attempt to schedule duplicate appointment", "AppointmentService", { 
              doctorId: appointmentData.medico_id, 
              dateTime: appointmentData.consultation_date 
            });
            throw new Error("Este horário já foi ocupado por outro paciente. Por favor, escolha outro horário disponível.");
          }
          
          logger.error("Error scheduling appointment (legacy)", "AppointmentService", error);
          throw error;
        }

        logger.info("Appointment scheduled via legacy method", "AppointmentService");
        return { success: true };
      }
    } catch (error) {
      logger.error("Failed to schedule appointment", "AppointmentService", error);
      throw error;
    }
  }
};
