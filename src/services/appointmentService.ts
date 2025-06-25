
import { supabase } from '@/integrations/supabase/client';
import { 
  generateTimeSlots, 
  getDefaultWorkingHours, 
  validateDoctorConfig,
  normalizeToStartOfDay,
  DoctorConfig, 
  TimeSlot,
  ExistingAppointment
} from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';

// Interface para o médico, refletindo o que esperamos do Supabase
export interface Medico {
  id: string; // user_id do perfil
  display_name: string | null;
}

// Função para verificar autenticação
const checkAuthentication = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error("User not authenticated", "AppointmentService", error);
    throw new Error("Você precisa estar logado para realizar esta ação");
  }
  return user;
};

export const appointmentService = {
  // Busca todas as especialidades únicas cadastradas
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "AppointmentService");
    try {
      // Verificar autenticação antes de buscar dados
      await checkAuthentication();
      
      // Usando uma função de banco de dados (RPC) para retornar as especialidades
      const { data, error } = await supabase.rpc('get_specialties');

      if (error) {
        logger.error("RPC get_specialties failed", "AppointmentService", error);
        throw new Error(`Erro ao buscar especialidades: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        logger.warn("No specialties found in database", "AppointmentService");
        return [];
      }
      
      // Garantindo que é um array de strings e ordenando
      const specialties = (data as string[] || []).sort();
      logger.info("Specialties fetched successfully", "AppointmentService", { count: specialties.length, specialties });
      return specialties;
    } catch (error) {
      logger.error("Failed to fetch specialties", "AppointmentService", error);
      throw error;
    }
  },

  // Busca médicos por especialidade
  async getDoctorsBySpecialty(specialty: string): Promise<Medico[]> {
    logger.info("Fetching doctors by specialty", "AppointmentService", { specialty });
    try {
      // Verificar autenticação
      await checkAuthentication();
      
      if (!specialty) {
        throw new Error("Especialidade é obrigatória");
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          medicos!inner(especialidades)
        `)
        .eq('user_type', 'medico')
        .contains('medicos.especialidades', [specialty]);

      if (error) {
        logger.error("Failed to query doctors", "AppointmentService", { specialty, error });
        throw new Error(`Erro ao buscar médicos: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        logger.warn("No doctors found for specialty", "AppointmentService", { specialty });
        return [];
      }
      
      // Retorna apenas o ID e o nome do médico
      const doctors = data.map(profile => ({
        id: profile.id,
        display_name: profile.display_name || "Médico sem nome",
      }));
      
      logger.info("Doctors fetched successfully", "AppointmentService", { 
        specialty, 
        count: doctors.length,
        doctors: doctors.map(d => ({ id: d.id, name: d.display_name }))
      });
      
      return doctors;
    } catch (error) {
      logger.error("Failed to fetch doctors", "AppointmentService", { specialty, error });
      throw error;
    }
  },

  // Busca horários disponíveis para um médico em uma data específica
  async getAvailableTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    logger.info("Fetching available time slots", "AppointmentService", { doctorId, date });
    
    try {
      // Verificar autenticação
      await checkAuthentication();
      
      if (!doctorId || !date) {
        throw new Error("ID do médico e data são obrigatórios");
      }

      // Normaliza a data para evitar problemas de timezone
      const normalizedDate = normalizeToStartOfDay(date);
      
      // Busca a configuração do médico
      const { data: doctorData, error: doctorError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (doctorError && doctorError.code !== 'PGRST116') { // PGRST116 = not found
        logger.error("Failed to fetch doctor config", "AppointmentService", { doctorId, error: doctorError });
        throw new Error(`Erro ao buscar configuração do médico: ${doctorError.message}`);
      }

      // Define o início e o fim do dia em UTC para filtrar as consultas
      const startOfDay = new Date(normalizedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(normalizedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      // Busca consultas existentes para o médico e a data selecionada
      const { data: appointments, error: appointmentsError } = await supabase
        .from('consultas')
        .select('data_consulta, duracao_minutos')
        .eq('medico_id', doctorId)
        .gte('data_consulta', startOfDay.toISOString())
        .lte('data_consulta', endOfDay.toISOString())
        .in('status', ['agendada', 'confirmada']);

      if (appointmentsError) {
        logger.error("Failed to fetch existing appointments", "AppointmentService", { doctorId, date, error: appointmentsError });
        throw new Error(`Erro ao buscar consultas existentes: ${appointmentsError.message}`);
      }

      // Converte para o formato esperado pelo utilitário
      const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
        data_consulta: apt.data_consulta,
        duracao_minutos: apt.duracao_minutos || 30
      }));

      logger.info("Existing appointments found", "AppointmentService", { 
        doctorId, 
        date, 
        appointmentsCount: existingAppointments.length 
      });

      // Obtém a configuração do médico, ou usa os padrões se não configurado
      const config = doctorData?.configuracoes as DoctorConfig | null;
      const doctorConfig: DoctorConfig = {
        duracaoConsulta: config?.duracaoConsulta || 30,
        horarioAtendimento: config?.horarioAtendimento || getDefaultWorkingHours(),
        timezone: config?.timezone || 'America/Sao_Paulo',
        bufferMinutos: config?.bufferMinutos || 0,
      };

      logger.info("Doctor configuration", "AppointmentService", { doctorId, config: doctorConfig });

      // Valida a configuração do médico
      const validation = validateDoctorConfig(doctorConfig);
      if (!validation.isValid) {
        logger.error("Invalid doctor configuration", "AppointmentService", { 
          doctorId, 
          errors: validation.errors 
        });
        
        // Retorna slots vazios se a configuração for inválida
        return [];
      }

      // Gera os slots de tempo disponíveis
      const slots = generateTimeSlots(doctorConfig, normalizedDate, existingAppointments);
      
      logger.info("Generated time slots", "AppointmentService", { 
        doctorId, 
        date, 
        totalSlots: slots.length,
        availableSlots: slots.filter(s => s.available).length 
      });
      
      return slots;

    } catch (error) {
      logger.error("Error fetching available time slots", "AppointmentService", { 
        doctorId, 
        date, 
        error 
      });
      throw error;
    }
  },

  // Cria uma nova consulta com validação de conflitos
  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    data_consulta: string;
    tipo_consulta: string;
  }) {
    logger.info("Scheduling new appointment", "AppointmentService", { data: appointmentData });
    
    try {
      // Verificar autenticação antes de agendar
      const user = await checkAuthentication();
      
      // Verificar se o usuário é um paciente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        logger.error("Failed to fetch user profile", "AppointmentService", { userId: user.id, error: profileError });
        throw new Error("Erro ao verificar perfil do usuário");
      }

      if (profile.user_type !== 'paciente') {
        logger.error("User is not a patient", "AppointmentService", { userId: user.id, userType: profile.user_type });
        throw new Error("Apenas pacientes podem agendar consultas");
      }

      // Verificar se o paciente_id corresponde ao usuário logado
      if (appointmentData.paciente_id !== user.id) {
        logger.error("Patient ID mismatch", "AppointmentService", { 
          loggedUserId: user.id, 
          appointmentPatientId: appointmentData.paciente_id 
        });
        throw new Error("ID do paciente não corresponde ao usuário logado");
      }

      // Verifica disponibilidade do horário antes de agendar (double-check)
      const appointmentDate = new Date(appointmentData.data_consulta);
      const dateString = appointmentDate.toISOString().split('T')[0];
      const timeString = `${appointmentDate.getUTCHours().toString().padStart(2, '0')}:${appointmentDate.getUTCMinutes().toString().padStart(2, '0')}`;
      
      logger.info("Checking slot availability", "AppointmentService", { 
        dateString, 
        timeString, 
        medico_id: appointmentData.medico_id 
      });

      const availableSlots = await this.getAvailableTimeSlots(appointmentData.medico_id, dateString);
      const requestedSlot = availableSlots.find(slot => slot.time === timeString);
      
      if (!requestedSlot || !requestedSlot.available) {
        logger.warn("Slot not available", "AppointmentService", { 
          requestedTime: timeString, 
          availableSlots: availableSlots.filter(s => s.available).map(s => s.time) 
        });
        throw new Error('Horário não está mais disponível. Por favor, selecione outro horário.');
      }

      // Insere a consulta no banco
      const { error } = await supabase
        .from('consultas')
        .insert({
          ...appointmentData,
          status: 'agendada',
          motivo: 'Consulta solicitada via plataforma.',
          duracao_minutos: 30 // Pode ser parametrizado futuramente
        });

      if (error) {
        logger.error("Failed to schedule appointment", "AppointmentService", { error });
        
        // Tratamento específico para conflitos de horário
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Este horário já foi agendado por outro paciente. Por favor, selecione outro horário.');
        }
        
        // Tratamento para violação de RLS
        if (error.message.includes('row-level security')) {
          throw new Error('Erro de permissão: Verifique se você está logado como paciente.');
        }
        
        throw new Error(`Erro ao agendar consulta: ${error.message}`);
      }

      logger.info("Appointment scheduled successfully", "AppointmentService", { 
        appointmentData 
      });

      return { success: true };
      
    } catch (error) {
      logger.error("Error scheduling appointment", "AppointmentService", { 
        appointmentData, 
        error 
      });
      throw error;
    }
  }
};
