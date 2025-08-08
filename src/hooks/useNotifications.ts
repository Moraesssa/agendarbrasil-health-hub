
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  read: boolean;
  created_at: string;
  // New optional fields for referral CTAs
  actionUrl?: string;
  actionRequired?: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch family notifications
      const { data: familyNotifications, error: familyError } = await supabase
        .from('family_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (familyError) throw familyError;

      // Fetch consultation-based notifications using explicit JOIN
      const { data: consultations, error: consultationError } = await supabase
        .from('consultas')
        .select(`
          id,
          consultation_date,
          status,
          consultation_type,
          medico_profiles:profiles!consultas_medico_id_fkey (
            display_name
          )
        `)
        .eq('paciente_id', user.id)
        .gte('consultation_date', new Date().toISOString())
        .order('consultation_date', { ascending: true })
        .limit(10);

      if (consultationError) throw consultationError;

      // Process consultation notifications with safe profile access
      const consultationNotifications: Notification[] = (consultations || []).map(consultation => {
        const doctorName = consultation.medico_profiles?.display_name || 'Médico';
          
        const consultationDate = new Date(consultation.consultation_date);
        const now = new Date();
        const timeDiff = consultationDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        let message = '';
        let type = 'info';
        let priority = 'normal';

        if (daysDiff <= 1) {
          message = `Consulta com ${doctorName} em ${consultationDate.toLocaleDateString('pt-BR')} às ${consultationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          type = 'urgent';
          priority = 'urgent';
        } else if (daysDiff <= 3) {
          message = `Lembrete: Consulta com ${doctorName} em ${daysDiff} dias`;
          type = 'reminder';
          priority = 'high';
        } else if (daysDiff <= 7) {
          message = `Consulta agendada com ${doctorName} para ${consultationDate.toLocaleDateString('pt-BR')}`;
          type = 'upcoming';
          priority = 'normal';
        }

        return {
          id: `consultation-${consultation.id}`,
          title: 'Consulta Agendada',
          message,
          type,
          priority,
          read: false,
          created_at: consultation.consultation_date
        };
      }).filter(notification => notification.message !== '');

      // Combine all notifications
      const allNotifications = [
        ...(familyNotifications || []).map(fn => ({
          id: fn.id,
          title: fn.title,
          message: fn.message,
          type: fn.notification_type,
          priority: fn.priority || 'normal',
          read: fn.read,
          created_at: fn.created_at,
          // map CTA fields from DB
          actionUrl: fn.action_url ?? undefined,
          actionRequired: fn.action_required ?? false,
        })),
        ...consultationNotifications
      ];

      // Sort by creation date
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Only mark family notifications as read in the database
      if (!notificationId.startsWith('consultation-')) {
        const { error } = await supabase
          .from('family_notifications')
          .update({ read: true })
          .eq('id', notificationId);

        if (error) throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all family notifications as read
      const familyNotificationIds = notifications
        .filter(n => !n.id.startsWith('consultation-') && !n.read)
        .map(n => n.id);

      if (familyNotificationIds.length > 0) {
        const { error } = await supabase
          .from('family_notifications')
          .update({ read: true })
          .in('id', familyNotificationIds);

        if (error) throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for family notifications
    const subscription = supabase
      .channel('family_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
