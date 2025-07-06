import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { HealthMetric, CreateHealthMetricData } from '@/types/health';

export const healthService = {
  async getHealthMetrics(patientId?: string): Promise<HealthMetric[]> {
    logger.info("Fetching health metrics", "HealthService", { patientId });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from('health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false });

      // Se patientId não for fornecido, busca métricas do próprio usuário
      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else {
        query = query.eq('patient_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Error fetching health metrics", "HealthService", error);
        throw new Error(`Erro ao buscar métricas de saúde: ${error.message}`);
      }

      return (data || []).map(metric => ({
        ...metric,
        metric_type: metric.metric_type as HealthMetric['metric_type'],
        value: metric.value as HealthMetric['value']
      }));
    } catch (error) {
      logger.error("Failed to fetch health metrics", "HealthService", error);
      throw error;
    }
  },

  async createHealthMetric(metricData: CreateHealthMetricData): Promise<void> {
    logger.info("Creating health metric", "HealthService", { 
      metric_type: metricData.metric_type,
      patient_id: metricData.patient_id 
    });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('health_metrics')
        .insert({
          ...metricData,
          recorded_at: metricData.recorded_at || new Date().toISOString()
        });

      if (error) {
        logger.error("Error creating health metric", "HealthService", error);
        throw new Error(`Erro ao criar métrica de saúde: ${error.message}`);
      }

      logger.info("Health metric created successfully", "HealthService");
    } catch (error) {
      logger.error("Failed to create health metric", "HealthService", error);
      throw error;
    }
  },

  async getLatestMetricsByType(patientId?: string): Promise<Map<string, HealthMetric>> {
    logger.info("Fetching latest metrics by type", "HealthService", { patientId });
    try {
      const metrics = await this.getHealthMetrics(patientId);
      const latestMetrics = new Map<string, HealthMetric>();

      metrics.forEach(metric => {
        const existing = latestMetrics.get(metric.metric_type);
        if (!existing || new Date(metric.recorded_at) > new Date(existing.recorded_at)) {
          latestMetrics.set(metric.metric_type, metric);
        }
      });

      return latestMetrics;
    } catch (error) {
      logger.error("Failed to fetch latest metrics by type", "HealthService", error);
      throw error;
    }
  },

  async deleteHealthMetric(metricId: string): Promise<void> {
    logger.info("Deleting health metric", "HealthService", { metricId });
    try {
      const { error } = await supabase
        .from('health_metrics')
        .delete()
        .eq('id', metricId);

      if (error) {
        logger.error("Error deleting health metric", "HealthService", error);
        throw new Error(`Erro ao deletar métrica de saúde: ${error.message}`);
      }

      logger.info("Health metric deleted successfully", "HealthService");
    } catch (error) {
      logger.error("Failed to delete health metric", "HealthService", error);
      throw error;
    }
  }
};