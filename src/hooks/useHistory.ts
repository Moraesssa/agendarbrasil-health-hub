import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { logger } from '@/utils/logger';

interface Consulta {
  id: number;
  data: string;
  medico: string;
  especialidade: string;
  diagnostico: string;
  status: string;
  receita: boolean;
}

interface Exame {
  id: number;
  nome: string;
  data: string;
  medico: string;
  status: string;
  resultado: string;
}

interface HistoryData {
  consultas: Consulta[];
  exames: Exame[];
}

export const useHistory = () => {
  const [data, setData] = useState<HistoryData>({ consultas: [], exames: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const historyData = await appointmentService.getHistory();
      setData(historyData);
    } catch (err: any) {
      logger.error('Failed to fetch history', 'useHistory', err);
      setError(err.message || 'Ocorreu um erro ao buscar o histórico.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, isLoading, error, refetch: fetchHistory };
};