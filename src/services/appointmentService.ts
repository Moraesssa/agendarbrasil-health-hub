import { supabase } from '@/integrations/supabase/client';
import { generateTimeSlots, getDefaultWorkingHours, DoctorConfig, TimeSlot } from '@/utils/timeSlotUtils';
import { logger } from '@/utils/logger';

// Interface para o médico, refletindo o que esperamos do Supabase
interface Medico {
  id: string; // user_id do perfil
  display_name: string | null;
}

export const appointmentService = {
  // Busca todas as especialidades únicas cadastradas
  async getSpecialties(): Promise<string[]> {
    logger.info("Fetching specialties", "AppointmentService");
    try {
      // Usando uma função de banco de dados (RPC) para retornar as especialidades
      // Se não tiver essa função no Supabase, você precisará adaptar
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
        .contains('medicos.especialidades', [specialty]); // Busca médicos que contenham essa especialidade

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
      // Busca a configuração do médico (horários, duração da consulta)
      const { data: doctorData, error: doctorError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', doctorId)
        .single();

      if (doctorError) throw doctorError;

      // Define o início e o fim do dia para filtrar as consultas
      const startOfDay = new Date(`${date}T00:00:00.000Z`); // Usando UTC para consistência
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      
      // Busca consultas existentes para o médico e a data selecionada
      const { data: appointments, error: appointmentsError } = await supabase
        .from('consultas')
        .select('data_consulta') // Apenas a data/hora da consulta é necessária
        .eq('medico_id', doctorId)
        .gte('data_consulta', startOfDay.toISOString())
        .lte('data_consulta', endOfDay.toISOString())
        .in('status', ['agendada', 'confirmada']); // Considera apenas consultas que ocupam horário

      if (appointmentsError) throw appointmentsError;

      // Extrai os horários das consultas existentes para verificar a ocupação
      const existingTimes = appointments.map(apt => {
        const d = new Date(apt.data_consulta);
        // Formata para HH:MM no fuso local da execução, ou pode ser UTC se preferir consistência
        // Aqui usaremos local, pois o input date é baseado no fuso do navegador.
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      });

      // Obtém a configuração do médico, ou usa os padrões se não configurado
      const config = doctorData?.configuracoes as DoctorConfig | null;
      const doctorConfig: DoctorConfig = {
        duracaoConsulta: config?.duracaoConsulta || 30, // Padrão 30 minutos
        horarioAtendimento: config?.horarioAtendimento || getDefaultWorkingHours(),
      };

      // Gera os slots de tempo disponíveis
      const slots = generateTimeSlots(doctorConfig, startOfDay, existingTimes);
      
      return slots;

    } catch (error) {
      logger.error("Error fetching available time slots", "AppointmentService", error);
      throw error; // Propaga o erro para o React Query
    }
  },

  // Cria uma nova consulta
  async scheduleAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    data_consulta: string;
    tipo_consulta: string;
  }) {
    logger.info("Scheduling new appointment", "AppointmentService", { data: appointmentData });
    
    const { error } = await supabase
      .from('consultas')
      .insert({
        ...appointmentData,
        status: 'agendada', // Novo agendamento inicia como 'agendada'
        motivo: 'Consulta solicitada via plataforma.', // Pode ser passado como parâmetro se necessário
        duracao_minutos: 30 // Default, ou buscar da config do médico
      });

    if (error) {
      logger.error("Failed to schedule appointment", "AppointmentService", { error });
      throw error;
    }

    return { success: true }; // Retorna sucesso se não houver erro
  }
};