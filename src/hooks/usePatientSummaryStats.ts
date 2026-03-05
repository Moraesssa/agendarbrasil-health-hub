import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth } from 'date-fns';

interface PatientStats {
  consultasEsteMes: number;
  medicamentosAtivos: number;
  proximosExames: number;
  loading: boolean;
}

export const usePatientSummaryStats = (): PatientStats => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatientStats>({
    consultasEsteMes: 0,
    medicamentosAtivos: 0,
    proximosExames: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        const now = new Date();
        const monthStart = startOfMonth(now).toISOString();
        const monthEnd = endOfMonth(now).toISOString();

        const [consultasRes, medsRes, examesRes] = await Promise.all([
          // Consultas este mês
          supabase
            .from('consultas')
            .select('id', { count: 'exact', head: true })
            .eq('paciente_id', user.id)
            .gte('consultation_date', monthStart)
            .lte('consultation_date', monthEnd)
            .in('status', ['agendada', 'confirmada', 'realizada']),

          // Medicamentos ativos
          supabase
            .from('medication_reminders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true),

          // Próximos exames agendados
          supabase
            .from('medical_exams')
            .select('id', { count: 'exact', head: true })
            .eq('patient_id', user.id)
            .gte('scheduled_date', now.toISOString())
            .in('status', ['scheduled', 'pending_results']),
        ]);

        setStats({
          consultasEsteMes: consultasRes.count ?? 0,
          medicamentosAtivos: medsRes.count ?? 0,
          proximosExames: examesRes.count ?? 0,
          loading: false,
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas do paciente:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};
