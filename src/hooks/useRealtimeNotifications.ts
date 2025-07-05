
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyNotification } from '@/types/medical';
import { useAuth } from '@/contexts/AuthContextV2';
import { logger } from '@/utils/logger';
import { useToast } from './use-toast';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialNotifications = useCallback(async () => {
    if (!user) {
      logger.warn('fetchInitialNotifications called without a user.', 'useRealtimeNotifications');
      return;
    }
    
    logger.info('Fetching initial notifications for user:', 'useRealtimeNotifications', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching initial notifications', 'useRealtimeNotifications', error);
        throw error;
      }
      
      logger.info('Successfully fetched notifications', 'useRealtimeNotifications', { count: data.length, data });
      // Corrigido: Cast explícito para o tipo correto.
      setNotifications((data as FamilyNotification[]) || []);
    } catch (error) {
      logger.error('Failed to fetch initial notifications', 'useRealtimeNotifications', error);
      toast({ title: 'Erro ao carregar notificações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    fetchInitialNotifications();

    const channel = supabase.channel('family_notifications_channel')
      .on<FamilyNotification>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'family_notifications' },
        (payload) => {
          const newNotification = payload.new as FamilyNotification;
          logger.info('New realtime notification received', 'useRealtimeNotifications', newNotification);
          setNotifications((prev) => [newNotification, ...prev]);
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Successfully subscribed to notifications channel', 'useRealtimeNotifications');
        }
        if (status === 'CHANNEL_ERROR') {
          logger.error('Failed to subscribe to notifications channel', 'useRealtimeNotifications', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchInitialNotifications, toast]);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('family_notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;

      setNotifications((prev) => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
       logger.error('Failed to mark notification as read', 'useRealtimeNotifications', error);
       toast({ title: 'Erro ao atualizar notificação', variant: 'destructive' });
    }
  }, [toast]);

  return { notifications, loading, markAsRead };
};
