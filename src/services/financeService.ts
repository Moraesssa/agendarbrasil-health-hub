// Legacy - Will be replaced
export interface FinancialSummary {
  totalReceita: number;
  receitaMensal: number;
  receitaSemanal: number;
  totalConsultas: number;
  consultasPagas: number;
  consultasPendentes: number;
}

export const financeService = {
  registrarPagamento: async (data: any) => ({ success: false }),
  buscarPagamentos: async (id?: string) => [],
  buscarResumoFinanceiro: async (id?: string) => ({ totalReceita: 0, receitaMensal: 0, receitaSemanal: 0, totalConsultas: 0, consultasPagas: 0, consultasPendentes: 0 }),
  getRelatorioFinanceiro: async (id?: string) => [],
  getRefundHistory: async (id?: string) => [],
  getResumoFinanceiro: async (id?: string) => ({ totalReceita: 0, receitaMensal: 0, receitaSemanal: 0, totalConsultas: 0, consultasPagas: 0, consultasPendentes: 0 }),
  getReceitaMensal: async (id?: string) => []
};
