import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { HealthMetric, CreateHealthMetricData } from '@/types/health';

export const healthService = {
  async getHealthMetrics(patientId?: string): Promise<HealthMetric[]> {
    logger.info("Buscando métricas de saúde...", "HealthService", { patientId });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase.from('health_metrics').select('*').order('recorded_at', { ascending: false });

      query = query.eq('patient_id', patientId || user.id);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar métricas: ${error.message}`);
      }
      return (data || []) as HealthMetric[];
    } catch (error) {
      logger.error("Falha ao buscar métricas de saúde.", "HealthService", error);
      throw error;
    }
  },

  async createHealthMetric(metricData: CreateHealthMetricData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado. A operação foi cancelada.");
      }

      const dataToInsert = {
        ...metricData,
        patient_id: user.id, // Garante que o ID do usuário logado seja sempre usado
        recorded_at: metricData.recorded_at || new Date().toISOString()
      };

      const { error } = await supabase.from('health_metrics').insert(dataToInsert);

      if (error) {
        logger.error("Erro retornado pelo Supabase ao criar métrica", "HealthService", error);
        throw new Error(`O banco de dados rejeitou a operação: ${error.message}`);
      }
    } catch (error) {
      logger.error("Falha crítica ao criar métrica de saúde.", "HealthService", error);
      throw error;
    }
  },

  async deleteHealthMetric(metricId: string): Promise<void> {
    try {
      const { error } = await supabase.from('health_metrics').delete().eq('id', metricId);
      if (error) {
        throw new Error(`Erro ao deletar métrica de saúde: ${error.message}`);
      }
    } catch (error) {
      logger.error("Falha ao deletar métrica de saúde.", "HealthService", error);
      throw error;
    }
  }
};