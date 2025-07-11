
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface Notification {
  id: string;
  type: 'encaminhamento' | 'consulta' | 'pagamento' | 'sistema';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  data?: any;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [channelRef, setChannelRef] = useState<any>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Buscar encaminhamentos recebidos como notificações
      const { data: encaminhamentos, error: encError } = await supabase
        .from('encaminhamentos')
        .select(`
          id,
          especialidade,
          motivo,
          data_encaminhamento,
          status,
          paciente:profiles!encaminhamentos_paciente_id_fkey(display_name),
          medico_origem:profiles!encaminhamentos_medico_origem_id_fkey(display_name)
        `)
        .eq('medico_destino_id', user.id)
        .eq('status', 'aguardando')
        .order('data_encaminhamento', { ascending: false });

      if (encError) throw encError;

      // Buscar consultas próximas como notificações
      const { data: consultas, error: consultasError } = await supabase
        .from('consultas')
        .select(`
          id,
          data_consulta,
          tipo_consulta,
          status,
          paciente:profiles!consultas_paciente_id_fkey(display_name)
        `)
        .eq('medico_id', user.id)
        .gte('data_consulta', new Date().toISOString())
        .lte('data_consulta', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('data_consulta', { ascending: true });

      if (consultasError) throw consultasError;

      // Transformar em notificações
      const encaminhamentoNotifications: Notification[] = (encaminhamentos || []).map(enc => ({
        id: `enc_${enc.id}`,
        type: 'encaminhamento' as const,
        title: 'Novo Encaminhamento',
        message: `Encaminhamento de ${enc.especialidade} para ${enc.paciente?.display_name} de Dr. ${enc.medico_origem?.display_name}`,
        priority: 'high' as const,
        read: false,
        created_at: enc.data_encaminhamento,
        data: enc
      }));

      const consultaNotifications: Notification[] = (consultas || []).map(consulta => ({
        id: `consulta_${consulta.id}`,
        type: 'consulta' as const,
        title: 'Consulta Próxima',
        message: `Consulta com ${consulta.paciente?.display_name} hoje às ${new Date(consulta.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        priority: 'normal' as const,
        read: false,
        created_at: consulta.data_consulta,
        data: consulta
      }));

      const allNotifications = [...encaminhamentoNotifications, ...consultaNotifications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);

    } catch (error) {
      logger.error('Erro ao buscar notificações', 'useNotifications', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Setup realtime subscription - APENAS UMA SUBSCRIÇÃO
  useEffect(() => {
    if (!user?.id) return;

    // Limpar canal anterior se existir
    if (channelRef) {
      supabase.removeChannel(channelRef);
    }

    const channelName = `user_notifications_${user.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'encaminhamentos',
          filter: `medico_destino_id=eq.${user.id}`
        },
        (payload) => {
          logger.info('Novo encaminhamento recebido', 'useNotifications', payload);
          toast({
            title: "Novo Encaminhamento",
            description: "Você recebeu um novo encaminhamento",
          });
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        logger.info(`Canal de notificações: ${status}`, 'useNotifications');
      });

    setChannelRef(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, fetchNotifications, toast]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
