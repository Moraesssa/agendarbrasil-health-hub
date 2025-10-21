// Legacy - Replaced by agendamentoService
export const useConsultas = (filters?: any) => ({ 
  consultas: [], 
  loading: false, 
  error: null, 
  refetch: async (params?: any) => {},
  updateConsultaStatus: async (id: string, status: string, filters?: any) => ({ success: true })
});
