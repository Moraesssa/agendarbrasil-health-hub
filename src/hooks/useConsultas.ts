import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConsultaWithDoctor {
  id: number;
  consultation_date: string;
  consultation_type: string | null;
  status: string | null;
  status_pagamento: string | null;
  notes: string | null;
  patient_name: string | null;
  patient_email: string | null;
  medico_id: string;
  paciente_id: string;
  paciente_familiar_id: string | null;
  created_at: string | null;
  expires_at: string | null;
  // Mapped fields for components
  doctor_profile: {
    display_name: string | null;
    especialidades?: string[] | null;
  } | null;
  local_consulta: string | null;
}

export const useConsultas = (filters?: { futureOnly?: boolean; limit?: number; month?: number; year?: number }) => {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<ConsultaWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchConsultas = useCallback(async () => {
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
          medico:profiles!consultas_medico_id_fkey(display_name)
        `)
        .eq('paciente_id', user.id)
        .order('consultation_date', { ascending: false });

      if (filters?.futureOnly) {
        query = query.gte('consultation_date', new Date().toISOString());
      }

      if (filters?.month && filters?.year) {
        const startDate = new Date(filters.year, filters.month - 1, 1).toISOString();
        const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59).toISOString();
        query = query.gte('consultation_date', startDate).lte('consultation_date', endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Map data to expected format
      const mapped: ConsultaWithDoctor[] = (data || []).map((row: any) => ({
        ...row,
        doctor_profile: row.medico ? {
          display_name: row.medico.display_name || 'Médico',
          especialidades: null,
        } : { display_name: 'Médico', especialidades: null },
        local_consulta: row.consultation_type === 'Online' 
          ? 'Teleconsulta' 
          : row.notes || 'Consultório médico',
      }));

      setConsultas(mapped);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      setError(err);
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters?.futureOnly, filters?.limit, filters?.month, filters?.year]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const updateConsultaStatus = async (consultaId: string | number, newStatus: string) => {
    try {
      const numericId = typeof consultaId === 'string' ? parseInt(consultaId, 10) : consultaId;
      
      const { error: updateError } = await supabase
        .from('consultas')
        .update({ status: newStatus })
        .eq('id', numericId)
        .eq('paciente_id', user?.id || '');

      if (updateError) throw updateError;

      await fetchConsultas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      return { success: false, error: err };
    }
  };

  const cancelConsulta = async (consultaId: string | number) => {
    return updateConsultaStatus(consultaId, 'cancelada');
  };

  return {
    consultas,
    loading,
    error,
    refetch: fetchConsultas,
    updateConsultaStatus,
    cancelConsulta
  };
};
