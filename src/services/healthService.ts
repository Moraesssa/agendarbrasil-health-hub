import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { HealthMetric, CreateHealthMetricData } from '@/types/health';

export const healthService = {
  async createHealthMetric(metricData: CreateHealthMetricData): Promise<void> {
    console.log("=============================================");
    logger.info("INICIANDO PROCESSO DE CRIAÇÃO DE MÉTRICA", "HealthService");
    
    try {
      // 1. Verificar o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.error("FALHA CRÍTICA: Usuário não autenticado. Operação abortada.", "HealthService");
        throw new Error("Usuário não autenticado. Faça o login novamente.");
      }

      // 2. LOG DETALHADO DOS IDs
      console.log(`[DEBUG] ID do paciente vindo do formulário:`, metricData.patient_id);
      console.log(`[DEBUG] ID do usuário autenticado (auth.uid):`, user.id);

      // 3. Preparar os dados para inserção, forçando o ID correto
      const dataToInsert = {
        ...metricData,
        patient_id: user.id, // AQUI GARANTIMOS O USO DO ID CORRETO
      };
      
      console.log(`[DEBUG] Objeto final a ser enviado para o Supabase:`, dataToInsert);
      console.log(`[DEBUG] O patient_id final é:`, dataToInsert.patient_id);
      logger.info("Enviando dados para o Supabase...", "HealthService");

      // 4. Inserir no banco de dados
      const { error } = await supabase
        .from('health_metrics')
        .insert(dataToInsert);

      // 5. Tratar o resultado
      if (error) {
        logger.error("ERRO RETORNADO PELO SUPABASE", "HealthService", { 
          message: error.message,
          details: error.details,
          code: error.code
        });
        throw new Error(`O banco de dados rejeitou a operação: ${error.message}`);
      }

      logger.info("SUCESSO: Métrica de saúde criada no banco de dados.", "HealthService");
      console.log("=============================================");

    } catch (error) {
      logger.error("ERRO NO BLOCO CATCH GERAL", "HealthService", error);
      console.log("=============================================");
      throw error;
    }
  },

  // As outras funções permanecem as mesmas
  async getHealthMetrics(patientId?: string): Promise<HealthMetric[]> {
    // ... (código existente)
    logger.info("Fetching health metrics", "HealthService", { patientId });
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

  async deleteHealthMetric(metricId: string): Promise<void> {
    // ... (código existente)
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