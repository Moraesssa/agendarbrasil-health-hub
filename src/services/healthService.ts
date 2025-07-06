
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { HealthMetric, CreateHealthMetricData } from '@/types/health';

export const healthService = {
  async createHealthMetric(metricData: CreateHealthMetricData): Promise<void> {
    logger.info("Criando nova métrica de saúde", "HealthService");
    
    try {
      // Verificar o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.error("Usuário não autenticado", "HealthService");
        throw new Error("Usuário não autenticado. Faça o login novamente.");
      }

      // Preparar os dados para inserção usando auth.uid() diretamente
      const dataToInsert = {
        ...metricData,
        patient_id: user.id, // Usando user.id diretamente (profiles.id = auth.uid())
      };
      
      logger.info("Inserindo métrica no banco de dados", "HealthService", { 
        patient_id: dataToInsert.patient_id,
        metric_type: dataToInsert.metric_type 
      });

      // Inserir no banco de dados
      const { error } = await supabase
        .from('health_metrics')
        .insert(dataToInsert);

      if (error) {
        logger.error("Erro ao inserir métrica", "HealthService", error);
        throw new Error(`Erro ao salvar métrica: ${error.message}`);
      }

      logger.info("Métrica de saúde criada com sucesso", "HealthService");

    } catch (error) {
      logger.error("Erro no healthService.createHealthMetric", "HealthService", error);
      throw error;
    }
  },

  async getHealthMetrics(patientId?: string): Promise<HealthMetric[]> {
    logger.info("Buscando métricas de saúde", "HealthService", { patientId });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from('health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else {
        query = query.eq('patient_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Erro ao buscar métricas", "HealthService", error);
        throw new Error(`Erro ao buscar métricas de saúde: ${error.message}`);
      }

      return (data || []).map(metric => ({
        ...metric,
        metric_type: metric.metric_type as HealthMetric['metric_type'],
        value: metric.value as HealthMetric['value']
      }));
    } catch (error) {
      logger.error("Erro ao carregar métricas", "HealthService", error);
      throw error;
    }
  },

  async deleteHealthMetric(metricId: string): Promise<void> {
    logger.info("Deletando métrica de saúde", "HealthService", { metricId });
    
    try {
      const { error } = await supabase
        .from('health_metrics')
        .delete()
        .eq('id', metricId);

      if (error) {
        logger.error("Erro ao deletar métrica", "HealthService", error);
        throw new Error(`Erro ao deletar métrica de saúde: ${error.message}`);
      }

      logger.info("Métrica deletada com sucesso", "HealthService");
    } catch (error) {
      logger.error("Erro ao deletar métrica", "HealthService", error);
      throw error;
    }
  }
};
