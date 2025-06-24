
import { supabase } from "@/integrations/supabase/client";
import { generateTimeSlots, getDefaultWorkingHours, type TimeSlot, type DoctorConfig } from "@/utils/timeSlotUtils";
import { logger } from "@/utils/logger";

export interface Medico {
  id: string;
  display_name: string | null;
}

export interface AppointmentData {
  paciente_id: string;
  medico_id: string;
  data_consulta: string;
  tipo_consulta: string;
}

// Type for doctor configuration from database
interface DoctorDBConfig {
  duracao_consulta?: number;
  horario_atendimento?: Record<string, { inicio: string; fim: string; ativo: boolean }>;
}

export const appointmentService = {
  async getDoctorsBySpecialty(specialty: string): Promise<Medico[]> {
    logger.info(`Fetching doctors for specialty: ${specialty}`, "appointmentService");
    
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select(`
          user_id,
          profiles!inner(display_name)
        `)
        .contains('especialidades', [specialty]);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.user_id,
        display_name: item.profiles?.display_name || null
      }));
    } catch (err) {
      logger.error("Error fetching doctors by specialty", "appointmentService", err);
      throw err;
    }
  },

  async getAvailableTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    logger.info(`Fetching time slots for doctor ${doctorId} on ${date}`, "appointmentService");
    
    try {
      // Buscar configurações do médico
      const { data: doctorData, error: doctorError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (doctorError) throw doctorError;

      // Buscar consultas já agendadas para o dia
      const { data: appointments, error: appointmentsError } = await supabase
        .from('consultas')
        .select('data_consulta')
        .eq('medico_id', doctorId)
        .gte('data_consulta', `${date}T00:00:00`)
        .lt('data_consulta', `${date}T23:59:59`);

      if (appointmentsError) throw appointmentsError;

      // Extrair horários ocupados
      const occupiedTimes = (appointments || []).map(apt => {
        const time = new Date(apt.data_consulta);
        return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      });

      // Parse and validate doctor configuration
      const dbConfig = doctorData?.configuracoes as DoctorDBConfig | null;
      
      // Configuração do médico ou padrão
      const doctorConfig: DoctorConfig = {
        duracaoConsulta: dbConfig?.duracao_consulta || 30,
        horarioAtendimento: dbConfig?.horario_atendimento || getDefaultWorkingHours()
      };

      // Gerar slots disponíveis
      return generateTimeSlots(doctorConfig, new Date(date), occupiedTimes);
    } catch (err) {
      logger.error("Error fetching available time slots", "appointmentService", err);
      throw err;
    }
  },

  async scheduleAppointment(appointmentData: AppointmentData): Promise<void> {
    logger.info("Scheduling appointment", "appointmentService", appointmentData);
    
    try {
      const { error } = await supabase
        .from('consultas')
        .insert({
          paciente_id: appointmentData.paciente_id,
          medico_id: appointmentData.medico_id,
          data_consulta: appointmentData.data_consulta,
          tipo_consulta: appointmentData.tipo_consulta,
          status: 'agendada'
        });

      if (error) throw error;
    } catch (err) {
      logger.error("Error scheduling appointment", "appointmentService", err);
      throw err;
    }
  }
};
