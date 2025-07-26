
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface TemporaryReservation {
  id: string;
  medico_id: string;
  paciente_id: string;
  data_consulta: string;
  expires_at: string;
  session_id: string;
}

export interface WaitingListEntry {
  id: string;
  paciente_id: string;
  medico_id: string;
  data_preferencia: string;
  periodo_preferencia: 'manha' | 'tarde' | 'noite' | 'qualquer';
  especialidade: string;
  status: 'active' | 'notified' | 'cancelled';
}

class EnhancedAppointmentService {
  private sessionId: string;

  constructor() {
    // Gerar ID único para a sessão do usuário
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sistema de reserva temporária (15 minutos)
  async createTemporaryReservation(
    medicoId: string,
    dataConsulta: string
  ): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Verificar se já existe reserva ou consulta neste horário
      const { data: existing } = await supabase
        .from('consultas')
        .select('id')
        .eq('medico_id', medicoId)
        .eq('consultation_date', dataConsulta)
        .in('status', ['agendada', 'confirmada', 'pendente'])
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "Horário já ocupado" };
      }

      // Verificar reservas temporárias ativas
      const { data: tempReservations } = await supabase
        .from('temporary_reservations')
        .select('id')
        .eq('medico_id', medicoId)
        .eq('data_consulta', dataConsulta)
        .gt('expires_at', new Date().toISOString())
        .neq('session_id', this.sessionId)
        .limit(1);

      if (tempReservations && tempReservations.length > 0) {
        return { success: false, error: "Horário temporariamente reservado por outro usuário" };
      }

      // Criar reserva temporária
      const { data, error } = await supabase
        .from('temporary_reservations')
        .insert({
          medico_id: medicoId,
          paciente_id: user.id,
          data_consulta: dataConsulta,
          session_id: this.sessionId,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Temporary reservation created", "EnhancedAppointmentService", { reservationId: data.id });
      return { success: true, reservationId: data.id };

    } catch (error) {
      logger.error("Failed to create temporary reservation", "EnhancedAppointmentService", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao criar reserva temporária" 
      };
    }
  }

  // Confirmar reserva temporária criando consulta oficial
  async confirmTemporaryReservation(
    reservationId: string,
    appointmentData: {
      tipo_consulta: string;
      motivo?: string;
      valor?: number;
    }
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar reserva temporária
      const { data: reservation, error: reservationError } = await supabase
        .from('temporary_reservations')
        .select('*')
        .eq('id', reservationId)
        .eq('paciente_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (reservationError || !reservation) {
        return { success: false, error: "Reserva temporária não encontrada ou expirada" };
      }

      // Criar consulta oficial
      const { data: appointment, error: appointmentError } = await supabase
        .from('consultas')
        .insert({
          medico_id: reservation.medico_id,
          paciente_id: reservation.paciente_id,
          consultation_date: reservation.data_consulta,
          consultation_type: appointmentData.tipo_consulta,
          notes: appointmentData.motivo,
          valor: appointmentData.valor,
          status: 'agendada',
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Remover reserva temporária
      await supabase
        .from('temporary_reservations')
        .delete()
        .eq('id', reservationId);

      logger.info("Temporary reservation confirmed", "EnhancedAppointmentService", { 
        appointmentId: appointment.id 
      });

      return { success: true, appointmentId: appointment.id };

    } catch (error) {
      logger.error("Failed to confirm temporary reservation", "EnhancedAppointmentService", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao confirmar reserva" 
      };
    }
  }

  // Liberar reserva temporária
  async releaseTemporaryReservation(reservationId: string): Promise<void> {
    try {
      await supabase
        .from('temporary_reservations')
        .delete()
        .eq('id', reservationId)
        .eq('session_id', this.sessionId);

      logger.info("Temporary reservation released", "EnhancedAppointmentService", { reservationId });
    } catch (error) {
      logger.error("Failed to release temporary reservation", "EnhancedAppointmentService", error);
    }
  }

  // Reagendamento simplificado
  async rescheduleAppointment(
    appointmentId: string,
    newDateTime: string,
    reason?: string
  ): Promise<{ success: boolean; newAppointmentId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Buscar consulta original
      const { data: originalAppointment, error: fetchError } = await supabase
        .from('consultas')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !originalAppointment) {
        return { success: false, error: "Consulta não encontrada" };
      }

      // Verificar se usuário tem permissão
      const hasPermission = originalAppointment.paciente_id === user.id || 
                           originalAppointment.medico_id === user.id;

      if (!hasPermission) {
        return { success: false, error: "Sem permissão para reagendar esta consulta" };
      }

      // Verificar disponibilidade do novo horário
      const reservationResult = await this.createTemporaryReservation(
        originalAppointment.medico_id,
        newDateTime
      );

      if (!reservationResult.success) {
        return { success: false, error: reservationResult.error };
      }

      // Criar nova consulta
      const { data: newAppointment, error: createError } = await supabase
        .from('consultas')
        .insert({
          paciente_id: originalAppointment.paciente_id,
          medico_id: originalAppointment.medico_id,
          consultation_date: newDateTime,
          consultation_type: originalAppointment.consultation_type,
          status: 'agendada',
          notes: `Reagendada de: ${originalAppointment.consultation_date}. ${reason || ''}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      // Cancelar consulta original
      await supabase
        .from('consultas')
        .update({
          status: 'cancelada',
          notes: `${originalAppointment.notes || ''} - Reagendada pelo usuário`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      // Liberar reserva temporária
      if (reservationResult.reservationId) {
        await this.releaseTemporaryReservation(reservationResult.reservationId);
      }

      logger.info("Appointment rescheduled", "EnhancedAppointmentService", {
        originalId: appointmentId,
        newId: newAppointment.id
      });

      return { success: true, newAppointmentId: newAppointment.id };

    } catch (error) {
      logger.error("Failed to reschedule appointment", "EnhancedAppointmentService", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao reagendar consulta" 
      };
    }
  }

  // Adicionar à lista de espera
  async addToWaitingList(
    medicoId: string,
    dataPreferencia: string,
    periodoPreferencia: 'manha' | 'tarde' | 'noite' | 'qualquer',
    especialidade: string
  ): Promise<{ success: boolean; waitingListId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Verificar se já está na lista de espera
      const { data: existing } = await supabase
        .from('waiting_list')
        .select('id')
        .eq('paciente_id', user.id)
        .eq('medico_id', medicoId)
        .eq('data_preferencia', dataPreferencia)
        .eq('status', 'active')
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: "Você já está na lista de espera para este médico e data" };
      }

      const { data, error } = await supabase
        .from('waiting_list')
        .insert({
          paciente_id: user.id,
          medico_id: medicoId,
          data_preferencia: dataPreferencia,
          periodo_preferencia: periodoPreferencia,
          especialidade,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Added to waiting list", "EnhancedAppointmentService", { waitingListId: data.id });
      return { success: true, waitingListId: data.id };

    } catch (error) {
      logger.error("Failed to add to waiting list", "EnhancedAppointmentService", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao adicionar à lista de espera" 
      };
    }
  }

  // Buscar posição na lista de espera
  async getWaitingListPosition(waitingListId: string): Promise<number | null> {
    try {
      const { data: entry } = await supabase
        .from('waiting_list')
        .select('medico_id, data_preferencia, created_at')
        .eq('id', waitingListId)
        .single();

      if (!entry) return null;

      const { count } = await supabase
        .from('waiting_list')
        .select('id', { count: 'exact' })
        .eq('medico_id', entry.medico_id)
        .eq('data_preferencia', entry.data_preferencia)
        .eq('status', 'active')
        .lt('created_at', entry.created_at);

      return (count || 0) + 1;

    } catch (error) {
      logger.error("Failed to get waiting list position", "EnhancedAppointmentService", error);
      return null;
    }
  }

  // Limpar reservas da sessão atual
  async cleanupSessionReservations(): Promise<void> {
    try {
      await supabase
        .from('temporary_reservations')
        .delete()
        .eq('session_id', this.sessionId);

      logger.info("Session reservations cleaned up", "EnhancedAppointmentService");
    } catch (error) {
      logger.error("Failed to cleanup session reservations", "EnhancedAppointmentService", error);
    }
  }
}

export const enhancedAppointmentService = new EnhancedAppointmentService();
