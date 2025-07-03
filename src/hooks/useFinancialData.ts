import { useCallback } from 'react';
import { financeService } from '@/services/financeService';
import { useToast } from '@/hooks/use-toast';

export const useFinancialData = () => {
  const { toast } = useToast();

  const fetchFinancialData = useCallback(async (userId: string) => {
    try {
      const [reportResult, refundResult, summaryResult, chartResult] = await Promise.all([
        financeService.getRelatorioFinanceiro(userId),
        financeService.getRefundHistory(userId),
        financeService.getResumoFinanceiro(userId),
        financeService.getReceitaMensal(userId)
      ]);
      
      return {
        reportData: reportResult,
        refundData: refundResult,
        summary: summaryResult,
        chartData: chartResult
      };
    } catch (error) {
      console.error("Erro ao carregar dados financeiros", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  return { fetchFinancialData };
};