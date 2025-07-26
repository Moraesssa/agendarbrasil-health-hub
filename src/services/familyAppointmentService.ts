
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const familyAppointmentService = {
  async scheduleFamilyAppointment(appointmentData: {
    paciente_id: string;
    medico_id: string;
    consultation_date: string;
    consultation_type: string;
    notes?: string;
    scheduled_by: string;
  }) {
    try {
      logger.info("Scheduling family appointment", "FamilyAppointmentService", appointmentData);

      // Verificar se o usuário tem permissão para agendar para este familiar
      const { data: familyMember } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', appointmentData.scheduled_by)
        .eq('family_member_id', appointmentData.paciente_id)
        .eq('can_schedule', true)
        .eq('status', 'active')
        .single();

      if (!familyMember) {
        throw new Error("Você não tem permissão para agendar consultas para este familiar");
      }

      const { data: appointment, error } = await supabase.from('consultas').insert({
        paciente_id: appointmentData.paciente_id,
        medico_id: appointmentData.medico_id,
        consultation_date: appointmentData.consultation_date,
        consultation_type: appointmentData.consultation_type,
        notes: appointmentData.notes,
        status: 'agendada',
        patient_name: 'Familiar', // Placeholder
        patient_email: 'familiar@email.com' // Placeholder
      });

      if (error) {
        logger.error("Error scheduling family appointment", "FamilyAppointmentService", error);
        throw error;
      }

      return { success: true, appointment };
    } catch (error) {
      logger.error("Failed to schedule family appointment", "FamilyAppointmentService", error);
      throw error;
    }
  },

  async getFamilyAppointments(userId: string) {
    try {
      // Buscar membros da família
      const { data: familyMembers } = await supabase
        .from('family_members')
        .select('family_member_id')
        .eq('user_id', userId)
        .eq('can_view_history', true)
        .eq('status', 'active');

      if (!familyMembers || familyMembers.length === 0) {
        return [];
      }

      const familyIds = familyMembers.map(fm => fm.family_member_id);

      // Buscar consultas dos familiares
      const { data: appointments, error } = await supabase
        .from('consultas')
        .select(`
          *,
          doctor_profile:profiles!consultas_medico_id_fkey (display_name),
          patient_profile:profiles!consultas_paciente_id_fkey (display_name)
        `)
        .in('paciente_id', familyIds)
        .order('consultation_date', { ascending: false });

      if (error) {
        logger.error("Error fetching family appointments", "FamilyAppointmentService", error);
        throw error;
      }

      return appointments || [];
    } catch (error) {
      logger.error("Failed to fetch family appointments", "FamilyAppointmentService", error);
      throw error;
    }
  }
};
