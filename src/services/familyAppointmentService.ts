
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { FamilyAppointmentData } from '@/types/family';

export const familyAppointmentService = {
  async scheduleFamilyAppointment(appointmentData: FamilyAppointmentData) {
    logger.info("Scheduling family appointment", "FamilyAppointmentService", {
      paciente_id: appointmentData.paciente_id,
      medico_id: appointmentData.medico_id
    });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se o usuário tem permissão para agendar para este paciente
      if (appointmentData.paciente_id !== user.id) {
        const { data: familyMember } = await supabase
          .from('family_members')
          .select('can_schedule')
          .eq('user_id', user.id)
          .eq('family_member_id', appointmentData.paciente_id)
          .eq('status', 'active')
          .single();

        if (!familyMember?.can_schedule) {
          throw new Error("Você não tem permissão para agendar consultas para este membro da família");
        }
      }

      const { error } = await supabase.from('consultas').insert({
        paciente_id: appointmentData.paciente_id,
        medico_id: appointmentData.medico_id,
        consultation_date: appointmentData.data_consulta,
        consultation_type: appointmentData.tipo_consulta,
        status: 'agendada',
        notes: 'Consulta agendada via plataforma familiar.'
      });

      if (error) {
        logger.error("Error scheduling family appointment", "FamilyAppointmentService", error);
        throw new Error(`Erro ao agendar consulta: ${error.message}`);
      }

      logger.info("Family appointment scheduled successfully", "FamilyAppointmentService");
      return { success: true };
    } catch (error) {
      logger.error("Failed to schedule family appointment", "FamilyAppointmentService", error);
      throw error;
    }
  },

  async getFamilyAppointments() {
    logger.info("Fetching family appointments", "FamilyAppointmentService");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('consultas')
        .select(`
          *,
          medico_profiles:profiles!consultas_medico_id_fkey(
            display_name
          ),
          paciente_profiles:profiles!consultas_paciente_id_fkey(
            display_name, 
            email
          )
        `)
        .order('consultation_date', { ascending: true });

      if (error) {
        logger.error("Error fetching family appointments", "FamilyAppointmentService", error);
        throw new Error(`Erro ao buscar consultas familiares: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Failed to fetch family appointments", "FamilyAppointmentService", error);
      throw error;
    }
  }
};
