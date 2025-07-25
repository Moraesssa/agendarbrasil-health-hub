
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

// Type for appointment status
type AppointmentStatus = 'agendada' | 'confirmada' | 'cancelada' | 'realizada' | 'pendente';

// Type for appointments with doctor info from profiles table - made optional to handle missing data
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

  const fetchConsultas = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use explicit JOIN with proper alias
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
        query = query.gte('consultation_date', new Date().toISOString());
      }

      // Filtrar consultas pagas, pendentes ou aguardando pagamento
      query = query.in('status_pagamento', ['pago', 'pendente', 'pending_payment']);

      // Apply month/year filter
      if (filters?.month !== undefined && filters?.year !== undefined) {
        const startOfMonth = new Date(filters.year, filters.month - 1, 1);
        const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59);
        query = query
          .gte('consultation_date', startOfMonth.toISOString())
          .lte('consultation_date', endOfMonth.toISOString());
      }

      // Apply limit
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      // Order by date
      query = query.order('consultation_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Safely process the data and handle missing profile information
      const processedData: AppointmentWithDoctor[] = (data || []).map(item => ({
        ...item,
        doctor_profile: item.doctor_profile || { display_name: null }
      }));

      setConsultas(processedData);

    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      setError('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  }, [user, filters?.status, filters?.futureOnly, filters?.month, filters?.year, filters?.limit]);

  const updateConsultaStatus = async (consultaId: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: newStatus })
        .eq('id', consultaId);

      if (error) throw error;

      // Update local state
      setConsultas(prev => prev.map(consulta =>
        consulta.id === consultaId
          ? { ...consulta, status: newStatus }
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
    refetch: fetchConsultas,
    updateConsultaStatus
  };
};
