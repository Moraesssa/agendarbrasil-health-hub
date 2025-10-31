// Stub for legacy financial service
export interface FinancialSummary {
  totalReceita: number;
  receitaMensal: number;
  consultasPagas: number;
  consultasPendentes: number;
  totalConsultas: number;
}

export const financeService = {
  getRelatorioFinanceiro: async (userId: string) => [],
  getRefundHistory: async (userId: string) => [],
  getResumoFinanceiro: async (userId: string): Promise<FinancialSummary> => ({
    totalReceita: 0,
    receitaMensal: 0,
    consultasPagas: 0,
    consultasPendentes: 0,
    totalConsultas: 0
  }),
  getReceitaMensal: async (userId: string) => []
};
