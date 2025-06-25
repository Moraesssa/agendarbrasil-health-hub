
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

export const appointmentService = {
  // Busca todas as especialidades únicas cadastradas
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "AppointmentService");
    try {
      // Usando uma função de banco de dados (RPC) para retornar as especialidades
      const { data, error } = await supabase.rpc('get_specialties');

      if (error) throw error;
      
      // Garantindo que é um array de strings e ordenando
      return (data as string[] || []).sort();
    } catch (error) {
      logger.error("Failed to fetch specialties", "AppointmentService", error);
      throw error;
    }
  },

  // Busca médicos por especialidade
  async getDoctorsBySpecialty(specialty: string): Promise<Medico[]> {
    logger.info("Fetching doctors by specialty", "AppointmentService", { specialty });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          medicos!inner(especialidades)
        `)
        .eq('user_type', 'medico')
        .contains('medicos.especialidades', [specialty]);

      if (error) throw error;
      
      // Retorna apenas o ID e o nome do médico
      return data.map(profile => ({
        id: profile.id,
        display_name: profile.display_name || "Médico sem nome",
      }));
    } catch (error) {
      logger.error("Failed to fetch doctors", "AppointmentService", { specialty, error });
      throw error;
    }
  },

  // Busca horários disponíveis para um médico em uma data específica
  async getAvailableTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    logger.info("Fetching available time slots", "AppointmentService", { doctorId, date });
    
    try {
      // Normaliza a data para evitar problemas de timezone
      const normalizedDate = normalizeToStartOfDay(date);
      
      // Busca a configuração do médico
      const { data: doctorData, error: doctorError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (doctorError && doctorError.code !== 'PGRST116') { // PGRST116 = not found
        throw doctorError;
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
        logger.error("Failed to fetch existing appointments", "AppointmentService", appointmentsError);
        throw appointmentsError;
      }

      // Converte para o formato esperado pelo utilitário
      const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
        data_consulta: apt.data_consulta,
        duracao_minutos: apt.duracao_minutos || 30
      }));

      // Obtém a configuração do médico, ou usa os padrões se não configurado
      const config = doctorData?.configuracoes as DoctorConfig | null;
      const doctorConfig: DoctorConfig = {
        duracaoConsulta: config?.duracaoConsulta || 30,
        horarioAtendimento: config?.horarioAtendimento || getDefaultWorkingHours(),
        timezone: config?.timezone || 'America/Sao_Paulo',
        bufferMinutos: config?.bufferMinutos || 0,
      };

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
      // Verifica disponibilidade do horário antes de agendar (double-check)
      const appointmentDate = new Date(appointmentData.data_consulta);
      const dateString = appointmentDate.toISOString().split('T')[0];
      const timeString = `${appointmentDate.getUTCHours().toString().padStart(2, '0')}:${appointmentDate.getUTCMinutes().toString().padStart(2, '0')}`;
      
      const availableSlots = await this.getAvailableTimeSlots(appointmentData.medico_id, dateString);
      const requestedSlot = availableSlots.find(slot => slot.time === timeString);
      
      if (!requestedSlot || !requestedSlot.available) {
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
        
        throw error;
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
