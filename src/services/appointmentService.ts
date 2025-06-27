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

export interface Medico {
  id: string;
  display_name: string | null;
}

// **A FUNÇÃO QUE ESTAVA EM FALTA ESTÁ AQUI**
// Garante que o utilizador está autenticado antes de fazer qualquer chamada à API.
const checkAuthentication = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error("User not authenticated", "AppointmentService", error);
    throw new Error("Você precisa estar logado para realizar esta ação");
  }
  return user;
};

export const appointmentService = {
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "AppointmentService");
    try {
      await checkAuthentication(); // Agora esta função existe
      
      const { data, error } = await supabase.rpc('get_specialties');

      if (error) {
        logger.error("RPC get_specialties failed", "AppointmentService", error);
        throw new Error(`Erro ao buscar especialidades: ${error.message}`);
      }
      
      return (data || []).sort();
    } catch (error) {
      logger.error("Failed to fetch specialties", "AppointmentService", error);
      throw error;
    }
  },

  async getDoctorsBySpecialty(specialty: string): Promise<Medico[]> {
    logger.info("Fetching doctors by specialty", "AppointmentService", { specialty });
    try {
      await checkAuthentication();
      if (!specialty) throw new Error("Especialidade é obrigatória");

      const { data, error } = await supabase
        .from('medicos')
        .select(`user_id, profiles(display_name)`)
        .contains('especialidades', [specialty]);

      if (error) throw new Error(`Erro ao buscar médicos: ${error.message}`);
      
      return (data || []).map((d: any) => ({
        id: d.user_id,
        display_name: d.profiles?.display_name || "Médico"
      }));
    } catch (error) {
      logger.error("Failed to fetch doctors", "AppointmentService", { specialty, error });
      throw error;
    }
  },

  async getAvailableTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    logger.info("Fetching available time slots", "AppointmentService", { doctorId, date });
    
    try {
      await checkAuthentication();
      if (!doctorId || !date) throw new Error("ID do médico e data são obrigatórios");

      const normalizedDate = normalizeToStartOfDay(date);
      
      const { data: doctorData, error: doctorError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (doctorError && doctorError.code !== 'PGRST116') {
        logger.error("Failed to fetch doctor config", "AppointmentService", { doctorId, error: doctorError });
        throw new Error(`Erro ao buscar configuração do médico: ${doctorError.message}`);
      }

      const config = (doctorData?.configuracoes || {}) as DoctorConfig;
      const doctorConfig: DoctorConfig = {
        duracaoConsulta: config.duracaoConsulta || 30,
        horarioAtendimento: config.horarioAtendimento || getDefaultWorkingHours(),
        bufferMinutos: config.bufferMinutos || 0,
      };

      const validation = validateDoctorConfig(doctorConfig);
      if (!validation.isValid) {
        logger.error("Invalid doctor configuration", "AppointmentService", { doctorId, errors: validation.errors });
        return [];
      }
      
      const startOfDay = new Date(normalizedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(normalizedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      const { data: appointments, error: appointmentsError } = await supabase
        .from('consultas')
        .select('data_consulta, duracao_minutos')
        .eq('medico_id', doctorId)
        .gte('data_consulta', startOfDay.toISOString())
        .lte('data_consulta', endOfDay.toISOString())
        .in('status', ['agendada', 'confirmada']);

      if (appointmentsError) throw new Error(`Erro ao buscar consultas existentes: ${appointmentsError.message}`);

      const existingAppointments: ExistingAppointment[] = (appointments || []).map(apt => ({
        data_consulta: apt.data_consulta,
        duracao_minutos: apt.duracao_minutos || 30
      }));

      const slots = generateTimeSlots(doctorConfig, normalizedDate, existingAppointments);
      return slots;

    } catch (error) {
      logger.error("Error fetching available time slots", "AppointmentService", { doctorId, date, error });
      throw error;
    }
  },

  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    data_consulta: string;
    tipo_consulta: string;
  }) {
    logger.info("Scheduling new appointment", "AppointmentService", { data: appointmentData });
    try {
      const user = await checkAuthentication();
      if (appointmentData.paciente_id !== user.id) {
        throw new Error("ID do paciente não corresponde ao usuário logado");
      }
      
      const { error } = await supabase.from('consultas').insert({
        ...appointmentData,
        status: 'agendada',
        motivo: 'Consulta solicitada via plataforma.'
      });
      if (error) throw new Error(`Erro ao agendar consulta: ${error.message}`);
      
      return { success: true };
    } catch (error) {
      logger.error("Error scheduling appointment", "AppointmentService", { error });
      throw error;
    }
  }
};