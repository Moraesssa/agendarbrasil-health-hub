import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { enhancedAppointmentService } from "@/services/enhancedAppointmentService";

interface WaitingListEntry {
  id: string;
  medico_id: string;
  data_preferencia: string;
  periodo_preferencia: string | null;
  especialidade: string;
  status: string | null;
  created_at: string;
  local_id?: string | null;
  paciente_id: string;
  updated_at: string;
  doctor_profile?: {
    display_name: string | null;
  } | null;
  position?: number | null;
}

export const useWaitingList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWaitingList = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .select(`
          *,
          doctor_profile:profiles!waiting_list_medico_id_fkey (display_name)
        `)
        .eq('paciente_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar posição na fila para cada entrada
      const entriesWithPosition = await Promise.all(
        (data || []).map(async (entry) => {
          const position = await enhancedAppointmentService.getWaitingListPosition(entry.paciente_id || '', entry.medico_id || '');
          return { ...entry, position };
        })
      );

      setWaitingList(entriesWithPosition as any);
    } catch (error) {
      console.error("Erro ao buscar lista de espera:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar sua lista de espera",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWaitingList = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('waiting_list')
        .update({ status: 'cancelled' })
        .eq('id', entryId);

      if (error) throw error;

      setWaitingList(prev => prev.filter(entry => entry.id !== entryId));
      
      toast({
        title: "Removido da lista de espera",
        description: "Você foi removido da lista de espera com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover da lista de espera:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover da lista de espera",
        variant: "destructive"
      });
    }
  };

  const checkNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('paciente_id', user.id)
        .eq('status', 'notified');

      if (error) throw error;

      if (data && data.length > 0) {
        toast({
          title: "Vaga disponível!",
          description: `Há ${data.length} vaga(s) disponível(is) na sua lista de espera. Verifique sua agenda.`,
        });
      }
    } catch (error) {
      console.error("Erro ao verificar notificações:", error);
    }
  };

  useEffect(() => {
    fetchWaitingList();
    
    // Verificar notificações a cada 30 segundos
    const interval = setInterval(checkNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    waitingList,
    loading,
    fetchWaitingList,
    removeFromWaitingList,
    checkNotifications
  };
};