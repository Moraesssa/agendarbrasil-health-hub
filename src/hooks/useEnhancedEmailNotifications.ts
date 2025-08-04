/**
 * Enhanced Email Notifications Hook
 * Integrates location-aware email notifications with appointment booking flow
 * replaced by kiro @2025-02-08T20:00:00Z
 */

import { useState, useCallback } from 'react';
import { emailNotificationService } from '@/services/emailNotificationService';
import { useNotification } from '@/contexts/NotificationContext';

export interface EmailNotificationState {
  isLoading: boolean;
  error: string | null;
  lastSentType: string | null;
}

export interface EmailNotificationOptions {
  sendConfirmation?: boolean;
  sendReminder?: boolean;
  autoScheduleReminder?: boolean;
  reminderHours?: number;
}

export function useEnhancedEmailNotifications() {
  const [state, setState] = useState<EmailNotificationState>({
    isLoading: false,
    error: null,
    lastSentType: null
  });

  const { addNotification } = useNotification();

  /**
   * Send appointment confirmation email with location details
   */
  const sendConfirmationEmail = useCallback(async (appointmentId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await emailNotificationService.sendConfirmationEmail(appointmentId);
      
      if (success) {
        setState(prev => ({ ...prev, isLoading: false, lastSentType: 'confirmation' }));
        addNotification({
          type: 'success',
          title: 'Email Enviado',
          message: 'Email de confirmação enviado com sucesso com detalhes da localização!'
        });
        return true;
      } else {
        throw new Error('Falha ao enviar email de confirmação');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro no Email',
        message: `Não foi possível enviar o email de confirmação: ${errorMessage}`
      });
      return false;
    }
  }, [addNotification]);

  /**
   * Send appointment reminder email with location details
   */
  const sendReminderEmail = useCallback(async (appointmentId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await emailNotificationService.sendReminderEmail(appointmentId);
      
      if (success) {
        setState(prev => ({ ...prev, isLoading: false, lastSentType: 'reminder' }));
        addNotification({
          type: 'success',
          title: 'Lembrete Enviado',
          message: 'Email de lembrete enviado com informações completas da localização!'
        });
        return true;
      } else {
        throw new Error('Falha ao enviar email de lembrete');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro no Lembrete',
        message: `Não foi possível enviar o lembrete: ${errorMessage}`
      });
      return false;
    }
  }, [addNotification]);

  /**
   * Send appointment cancellation email with location details
   */
  const sendCancellationEmail = useCallback(async (appointmentId: string, reason?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await emailNotificationService.sendCancellationEmail(appointmentId, reason);
      
      if (success) {
        setState(prev => ({ ...prev, isLoading: false, lastSentType: 'cancellation' }));
        addNotification({
          type: 'success',
          title: 'Cancelamento Notificado',
          message: 'Email de cancelamento enviado com informações para reagendamento!'
        });
        return true;
      } else {
        throw new Error('Falha ao enviar email de cancelamento');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro no Cancelamento',
        message: `Não foi possível enviar o email de cancelamento: ${errorMessage}`
      });
      return false;
    }
  }, [addNotification]);

  /**
   * Send location change notification email
   */
  const sendLocationChangeEmail = useCallback(async (
    appointmentId: string, 
    oldLocationName?: string, 
    newLocationName?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await emailNotificationService.sendLocationChangeEmail(
        appointmentId, 
        oldLocationName, 
        newLocationName
      );
      
      if (success) {
        setState(prev => ({ ...prev, isLoading: false, lastSentType: 'location_change' }));
        addNotification({
          type: 'success',
          title: 'Alteração Notificada',
          message: 'Email de alteração de local enviado com novo endereço e instruções!'
        });
        return true;
      } else {
        throw new Error('Falha ao enviar email de alteração de local');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro na Alteração',
        message: `Não foi possível enviar o email de alteração: ${errorMessage}`
      });
      return false;
    }
  }, [addNotification]);

  /**
   * Handle complete appointment booking flow with enhanced emails
   */
  const handleAppointmentBooking = useCallback(async (
    appointmentId: string,
    options: EmailNotificationOptions = {}
  ): Promise<boolean> => {
    const {
      sendConfirmation = true,
      sendReminder = true,
      autoScheduleReminder = true,
      reminderHours = 24
    } = options;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let allSuccess = true;

      // Send confirmation email immediately
      if (sendConfirmation) {
        const confirmationSuccess = await sendConfirmationEmail(appointmentId);
        if (!confirmationSuccess) {
          allSuccess = false;
        }
      }

      // Schedule reminder email (in a real implementation, this would use a job queue)
      if (sendReminder && autoScheduleReminder) {
        // For now, we'll just log that a reminder should be scheduled
        console.log(`Lembrete agendado para ${reminderHours} horas antes da consulta ${appointmentId}`);
        
        // In production, you would integrate with a job scheduler like:
        // await scheduleReminderEmail(appointmentId, reminderHours);
      }

      setState(prev => ({ ...prev, isLoading: false }));

      if (allSuccess) {
        addNotification({
          type: 'success',
          title: 'Consulta Agendada',
          message: 'Consulta agendada com sucesso! Emails com detalhes da localização foram enviados.'
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Consulta Agendada',
          message: 'Consulta agendada, mas houve problemas no envio de alguns emails.'
        });
      }

      return allSuccess;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro no Agendamento',
        message: `Erro ao processar agendamento: ${errorMessage}`
      });
      return false;
    }
  }, [sendConfirmationEmail, addNotification]);

  /**
   * Handle appointment cancellation with enhanced emails
   */
  const handleAppointmentCancellation = useCallback(async (
    appointmentId: string,
    reason?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await sendCancellationEmail(appointmentId, reason);
      
      setState(prev => ({ ...prev, isLoading: false }));

      if (success) {
        addNotification({
          type: 'success',
          title: 'Consulta Cancelada',
          message: 'Consulta cancelada e email de notificação enviado com informações para reagendamento.'
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Consulta Cancelada',
          message: 'Consulta cancelada, mas houve problemas no envio do email de notificação.'
        });
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro no Cancelamento',
        message: `Erro ao processar cancelamento: ${errorMessage}`
      });
      return false;
    }
  }, [sendCancellationEmail, addNotification]);

  /**
   * Handle location change with enhanced emails
   */
  const handleLocationChange = useCallback(async (
    appointmentId: string,
    oldLocationName?: string,
    newLocationName?: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await sendLocationChangeEmail(appointmentId, oldLocationName, newLocationName);
      
      setState(prev => ({ ...prev, isLoading: false }));

      if (success) {
        addNotification({
          type: 'success',
          title: 'Local Alterado',
          message: 'Local da consulta alterado e email de notificação enviado com novo endereço.'
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Local Alterado',
          message: 'Local alterado, mas houve problemas no envio do email de notificação.'
        });
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      addNotification({
        type: 'error',
        title: 'Erro na Alteração',
        message: `Erro ao processar alteração de local: ${errorMessage}`
      });
      return false;
    }
  }, [sendLocationChangeEmail, addNotification]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastSentType: null
    });
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    lastSentType: state.lastSentType,

    // Individual email functions
    sendConfirmationEmail,
    sendReminderEmail,
    sendCancellationEmail,
    sendLocationChangeEmail,

    // Workflow functions
    handleAppointmentBooking,
    handleAppointmentCancellation,
    handleLocationChange,

    // Utility functions
    clearError,
    reset
  };
}