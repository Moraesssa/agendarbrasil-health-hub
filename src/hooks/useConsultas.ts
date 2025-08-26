
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

// Type for appointment status
type AppointmentStatus = 'agendada' | 'confirmada' | 'cancelada' | 'realizada' | 'pendente';

// Fase 3: Types for dual-read between appointments and consultas
type AppointmentWithDoctor = Tables<'consultas'> & {
  doctor_profile: {
    display_name: string | null;
  } | null;
};

// New normalized appointment type from appointments table
type NormalizedAppointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_datetime: string;
  appointment_type: string;
  status: string;
  payment_status: string;
  amount?: number;
  created_at: string;
  updated_at: string;
  doctor_profile?: {
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

  // Create stable filter values to prevent infinite loops
  const statusFilter = useMemo(() => filters?.status, [filters?.status ? filters.status.join(',') : undefined]);
  const futureOnlyFilter = useMemo(() => filters?.futureOnly, [filters?.futureOnly]);
  const monthFilter = useMemo(() => filters?.month, [filters?.month]);
  const yearFilter = useMemo(() => filters?.year, [filters?.year]);
  const limitFilter = useMemo(() => filters?.limit, [filters?.limit]);

  // Fase 3: Melhorado para preparar dual-read (appointments table será criada futuramente)
  const fetchConsultas = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log mais estruturado
      logger.debug('useConsultas: Buscando consultas com melhorias da Fase 3', 'useConsultas');
      
      // Por enquanto, apenas consultas legacy (appointments será implementado futuramente)
      let query = supabase
        .from('consultas')
        .select(`
          *,
          doctor_profile:profiles!consultas_medico_id_fkey (display_name)
        `)
        .eq('paciente_id', user.id);

      // Apply status filter
      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      // Apply future only filter
      if (futureOnlyFilter) {
        query = query.gte('consultation_date', new Date().toISOString());
      }

      // Filtrar consultas pagas, pendentes ou aguardando pagamento
      query = query.in('status_pagamento', ['pago', 'pendente', 'pending_payment']);

      // Apply month/year filter
      if (monthFilter !== undefined && yearFilter !== undefined) {
        const startOfMonth = new Date(yearFilter, monthFilter - 1, 1);
        const endOfMonth = new Date(yearFilter, monthFilter, 0, 23, 59, 59);
        query = query
          .gte('consultation_date', startOfMonth.toISOString())
          .lte('consultation_date', endOfMonth.toISOString());
      }

      // Apply limit
      if (limitFilter) {
        query = query.limit(limitFilter);
      }

      // Order by date
      query = query.order('consultation_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Safely process the data and handle missing profile information
      const processedData: AppointmentWithDoctor[] = (data || []).map(item => ({
        ...item,
        doctor_profile: item?.doctor_profile || { display_name: null }
      }));

      logger.info(`useConsultas: Total de ${processedData.length} consultas carregadas`, 'useConsultas');
      setConsultas(processedData);

    } catch (err) {
      logger.error('useConsultas: Erro ao buscar consultas', 'useConsultas', err);
      setError('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, futureOnlyFilter, monthFilter, yearFilter, limitFilter]);

  const updateConsultaStatus = async (consultaId: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: newStatus })
        .eq('id', consultaId);

      if (error) throw error;

      // Update local state
      setConsultas(prev => (prev || []).map(consulta =>
        consulta?.id === consultaId
          ? { ...consulta, status: newStatus }
          : consulta
      ));

      return { success: true };
    } catch (err) {
      logger.error('Erro ao atualizar status da consulta', 'useConsultas.updateConsultaStatus', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    // Only fetch if we have a user and haven't loaded yet, or if critical filters changed
    fetchConsultas();

    // Listen for consultation updates with enhanced debouncing
    let timeoutId: NodeJS.Timeout;
    let isSubscribed = true;
    
    const handleConsultaUpdate = () => {
      if (!isSubscribed) return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isSubscribed) {
          fetchConsultas();
        }
      }, 200); // Increased debounce to 200ms
    };

    window.addEventListener('consultaUpdated', handleConsultaUpdate);
    
    return () => {
      isSubscribed = false;
      window.removeEventListener('consultaUpdated', handleConsultaUpdate);
      clearTimeout(timeoutId);
    };
  }, [fetchConsultas]);

  return {
    consultas,
    loading,
    error,
    refetch: fetchConsultas,
    updateConsultaStatus
  };
};
