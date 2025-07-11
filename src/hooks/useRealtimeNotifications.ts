
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyNotification } from '@/types/medical';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { useToast } from './use-toast';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
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

    // Use um nome de canal único para evitar conflitos
    const channelName = `family_notifications_${user.id}`;
    const channel = supabase.channel(channelName)
      .on<FamilyNotification>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'family_notifications' },
        (payload) => {
          const newNotification = payload.new as FamilyNotification;
          logger.info('New notification received', 'useRealtimeNotifications', newNotification);
          setNotifications((prev) => [newNotification, ...prev]);
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to family notifications channel', 'useRealtimeNotifications');
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
