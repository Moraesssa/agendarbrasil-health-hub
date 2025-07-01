
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Json } from '@/integrations/supabase/types';

export interface PaymentData {
  consulta_id: string;
  paciente_id: string;
  medico_id: string;
  valor: number;
  metodo_pagamento: 'credit_card' | 'pix' | 'convenio' | 'manual';
  gateway_id?: string;
  status: 'succeeded' | 'pending' | 'failed';
  dados_gateway?: Json;
}

export interface FinancialSummary {
  totalReceita: number;
  receitaMensal: number;
  receitaSemanal: number;
  totalConsultas: number;
  consultasPagas: number;
  consultasPendentes: number;
}

export const financeService = {
  /**
   * Registra um novo pagamento no banco de dados e atualiza o status da consulta.
   */
  async registrarPagamento(paymentData: PaymentData): Promise<{ success: boolean; error?: Error }> {
    logger.info("Registrando pagamento", "financeService", { consulta_id: paymentData.consulta_id });

    try {
      // Iniciar uma transação do Supabase
      const { data: pagamento, error: pagamentoError } = await supabase
        .from('pagamentos')
        .insert(paymentData)
        .select()
        .single();

      if (pagamentoError) {
        throw new Error(`Erro ao inserir pagamento: ${pagamentoError.message}`);
      }

      // Se o pagamento foi bem-sucedido, atualizar o status da consulta
      if (paymentData.status === 'succeeded') {
        const { error: consultaError } = await supabase
          .from('consultas')
          .update({ 
            status_pagamento: 'pago',
            valor: paymentData.valor 
          })
          .eq('id', paymentData.consulta_id);

        if (consultaError) {
          throw new Error(`Erro ao atualizar status da consulta: ${consultaError.message}`);
        }
      }

      logger.info("Pagamento registrado com sucesso", "financeService", { pagamentoId: pagamento.id });
      return { success: true };
    } catch (error) {
      logger.error("Falha ao registrar pagamento", "financeService", error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Busca o histórico financeiro de um médico.
   */
  async getRelatorioFinanceiro(medicoId: string): Promise<any[]> {
    logger.info("Buscando relatório financeiro para o médico", "financeService", { medicoId });

    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          consulta:consultas (
            data_consulta,
            tipo_consulta,
            paciente:profiles!consultas_paciente_id_fkey (
              display_name
            )
          )
        `)
        .eq('medico_id', medicoId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar relatório: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Falha ao buscar relatório financeiro", "financeService", error);
      throw error;
    }
  },

  /**
   * Calcula o resumo financeiro do médico.
   */
  async getResumoFinanceiro(medicoId: string): Promise<FinancialSummary> {
    try {
      const { data: pagamentos, error } = await supabase
        .from('pagamentos')
        .select('valor, status, created_at')
        .eq('medico_id', medicoId);

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

      const pagamentosValidos = pagamentos?.filter(p => p.status === 'succeeded') || [];
      
      const totalReceita = pagamentosValidos.reduce((acc, p) => acc + Number(p.valor), 0);
      
      const receitaMensal = pagamentosValidos
        .filter(p => new Date(p.created_at) >= startOfMonth)
        .reduce((acc, p) => acc + Number(p.valor), 0);
      
      const receitaSemanal = pagamentosValidos
        .filter(p => new Date(p.created_at) >= startOfWeek)
        .reduce((acc, p) => acc + Number(p.valor), 0);

      const { data: consultas } = await supabase
        .from('consultas')
        .select('status_pagamento')
        .eq('medico_id', medicoId);

      const totalConsultas = consultas?.length || 0;
      const consultasPagas = consultas?.filter(c => c.status_pagamento === 'pago').length || 0;
      const consultasPendentes = consultas?.filter(c => c.status_pagamento === 'pendente').length || 0;

      return {
        totalReceita,
        receitaMensal,
        receitaSemanal,
        totalConsultas,
        consultasPagas,
        consultasPendentes
      };
    } catch (error) {
      logger.error("Erro ao calcular resumo financeiro", "financeService", error);
      throw error;
    }
  },

  /**
   * Busca dados para o gráfico de receita mensal.
   */
  async getReceitaMensal(medicoId: string, meses: number = 6): Promise<Array<{month: string, revenue: number}>> {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('valor, created_at')
        .eq('medico_id', medicoId)
        .eq('status', 'succeeded')
        .gte('created_at', new Date(Date.now() - meses * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Agrupar por mês
      const monthlyData: { [key: string]: number } = {};
      
      data?.forEach(payment => {
        const date = new Date(payment.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(payment.valor);
      });

      // Converter para array ordenado
      return Object.entries(monthlyData)
        .map(([month, revenue]) => ({
          month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          revenue
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    } catch (error) {
      logger.error("Erro ao buscar receita mensal", "financeService", error);
      return [];
    }
  }
};
