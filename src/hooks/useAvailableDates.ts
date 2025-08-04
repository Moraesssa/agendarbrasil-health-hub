import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAvailableDatesOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseAvailableDatesReturn {
  availableDates: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  refetch: () => void;
  clearError: () => void;
  retryCount: number;
  isRetrying: boolean;
}

// Simple cache
const cache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string): string[] | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: string[]): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const useAvailableDates = (
  doctorId: string,
  options: UseAvailableDatesOptions = {}
): UseAvailableDatesReturn => {
  const { startDate, endDate, enabled = true, maxRetries = 3, retryDelay = 1000 } = options;
  
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const currentRequestRef = useRef<AbortController | null>(null);

  const fetchAvailableDates = useCallback(async (signal?: AbortSignal, currentRetry = 0) => {
    if (!doctorId || !enabled) {
      setAvailableDates([]);
      return;
    }

    const cacheKey = `${doctorId}-${startDate}-${endDate}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      console.log("🟢 Usando dados em cache:", cachedData);
      setAvailableDates(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsRetrying(currentRetry > 0);

    try {
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Simular busca de datas (substituir por chamada real da API)
      const dates = [];
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        // Skip weekends for this example
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          dates.push(d.toISOString().split('T')[0]);
        }
      }

      setCachedData(cacheKey, dates);
      setAvailableDates(dates);
      setRetryCount(0);
      setIsRetrying(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao buscar datas disponíveis:", error);
      
      if (currentRetry < maxRetries) {
        console.log(`Tentativa ${currentRetry + 1}/${maxRetries} falhou, tentando novamente em ${retryDelay}ms...`);
        setRetryCount(currentRetry + 1);
        setTimeout(() => {
          if (!signal?.aborted) {
            fetchAvailableDates(signal, currentRetry + 1);
          }
        }, retryDelay);
      } else {
        setError(errorMessage);
        setIsRetrying(false);
        console.error("Todas as tentativas falharam");
      }
    } finally {
      if (currentRetry === 0 || currentRetry >= maxRetries) {
        setIsLoading(false);
      }
    }
  }, [doctorId, startDate, endDate, enabled, maxRetries, retryDelay]);

  const refresh = useCallback(() => {
    const cacheKey = `${doctorId}-${startDate}-${endDate}`;
    cache.delete(cacheKey);
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }
    const abortController = new AbortController();
    currentRequestRef.current = abortController;
    fetchAvailableDates(abortController.signal);
  }, [fetchAvailableDates, doctorId, startDate, endDate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    if (!mounted || !doctorId || !enabled) return;

    const abortController = new AbortController();
    currentRequestRef.current = abortController;

    fetchAvailableDates(abortController.signal);

    return () => {
      mounted = false;
      abortController.abort();
      currentRequestRef.current = null;
    };
  }, [doctorId, enabled, startDate, endDate]);

  return {
    availableDates,
    isLoading,
    error,
    refresh,
    refetch: refresh,
    clearError,
    retryCount,
    isRetrying
  };
};

export default useAvailableDates;