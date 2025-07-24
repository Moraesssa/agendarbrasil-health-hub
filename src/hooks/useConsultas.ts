import { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth

// Type for appointment status
type AppointmentStatus = 'agendada' | 'confirmada' | 'cancelada' | 'realizada' | 'pendente';

// Type for appointments with doctor info from profiles table
type AppointmentWithDoctor = Tables<'consultas'> & {
  doctor_profile: {
    display_name: string | null;
  } | null;
};

export interface ConsultasFilters {
  status?: AppointmentStatus[];
  futureOnly?: boolean;
  month?: number;
  year?: number;
  limit?: number;
}

export const useConsultas = (filters?: ConsultasFilters) => {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar useCallback para memorizar a função fetchConsultas
  const fetchConsultas = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('consultas')
        .select(`
          *,
          doctor_profile:profiles!consultas_medico_id_fkey (display_name)
        `)
        .eq('paciente_id', user.id);

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply future only filter
      if (filters?.futureOnly) {
        query = query.gte('data_consulta', new Date().toISOString());
      }

      // Filtrar consultas pagas ou pendentes
      query = query.in('status_pagamento', ['pago', 'pendente']);

      // Apply month/year filter
      if (filters?.month !== undefined && filters?.year !== undefined) {
        const startOfMonth = new Date(filters.year, filters.month - 1, 1);
        const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59);
        query = query
          .gte('data_consulta', startOfMonth.toISOString())
          .lte('data_consulta', endOfMonth.toISOString());
      }

      // Apply limit
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      // Order by date
      query = query.order('data_consulta', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Simplifica o estado para evitar loops infinitos
      setConsultas(data as AppointmentWithDoctor[] || []);

    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      setError('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  }, [user, filters?.status, filters?.futureOnly, filters?.month, filters?.year, filters?.limit]); // Dependências do useCallback

  const updateConsultaStatus = async (consultaId: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: newStatus })
        .eq('id', consultaId);

      if (error) throw error;

      // Update local state de forma imutável para garantir a detecção de mudança pelo React
      setConsultas(prev => prev.map(consulta =>
        consulta.id === consultaId
          ? { ...consulta, status: newStatus } // Não usar 'as any' aqui
          : consulta
      ));

      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar status da consulta:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchConsultas();

    // Listen for consultation updates
    const handleConsultaUpdate = () => {
      fetchConsultas();
    };

    window.addEventListener('consultaUpdated', handleConsultaUpdate);
    return () => window.removeEventListener('consultaUpdated', handleConsultaUpdate);
  }, [fetchConsultas]);

  return {
    consultas,
    loading,
    error,
    refetch: fetchConsultas, // Retorna a função memorizada
    updateConsultaStatus
  };
};