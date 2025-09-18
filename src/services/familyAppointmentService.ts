
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { normalizeAppointmentId } from '@/utils/appointment-id';

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

      // Reservar horário via RPC v2 com p_family_member_id
      const { data: reserveResult, error: reserveError } = await supabase
        .rpc('reserve_appointment_v2', {
          p_doctor_id: appointmentData.medico_id,
          p_appointment_datetime: appointmentData.consultation_date,
          p_specialty: appointmentData.consultation_type,
          p_family_member_id: appointmentData.paciente_id,
        })
        .single();

      if (reserveError) {
        logger.error("Error reserving appointment via RPC", "FamilyAppointmentService", reserveError);
        throw reserveError;
      }

      if (!reserveResult?.success) {
        throw new Error(reserveResult?.message || "Não foi possível reservar o horário");
      }

      const appointmentId = normalizeAppointmentId(reserveResult.appointment_id);

      if (appointmentId === null) {
        throw new Error("Erro ao processar o identificador da consulta");
      }

      // Buscar a consulta criada para retornar
      const { data: appointment, error: fetchError } = await supabase
        .from('consultas')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError) {
        logger.error("Error fetching created appointment", "FamilyAppointmentService", fetchError);
        throw fetchError;
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
