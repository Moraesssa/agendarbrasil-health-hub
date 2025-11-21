// Stub for legacy useConsultas hook
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useConsultas = (filters?: any) => {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchConsultas = async () => {
    if (!user) {
      setConsultas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('consultas')
        .select(`
          *,
          medico:profiles!medico_id(display_name, medicos(especialidades)),
          paciente:profiles!paciente_id(display_name)
        `)
        .eq('paciente_id', user.id)
        .order('consultation_date', { ascending: false });

      if (filters?.futureOnly) {
        query = query.gte('consultation_date', new Date().toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setConsultas(data || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      setError(err);
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultas();
  }, [user, JSON.stringify(filters)]);

  const updateConsultaStatus = async (consultaId: string | number, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('consultas')
        .update({ status: newStatus })
        .eq('id', typeof consultaId === 'string' ? parseInt(consultaId) : consultaId);

      if (updateError) throw updateError;

      await fetchConsultas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      return { success: false, error: err };
    }
  };

  return {
    consultas,
    loading,
    error,
    refetch: fetchConsultas,
    updateConsultaStatus
  };
};
