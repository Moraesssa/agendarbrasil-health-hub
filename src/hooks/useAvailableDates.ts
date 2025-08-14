import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentService } from '@/services/appointmentService'; // Import the actual service

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

export const clearCache = () => {
  cache.clear();
};

const getCachedData = (key: string): string[] | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key); // Expire cache
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

  const fetchAvailableDates = useCallback(async (currentRetry = 0) => {
    if (!doctorId || !enabled) {
      setAvailableDates([]);
      return;
    }

    const cacheKey = `${doctorId}-${startDate}-${endDate}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      console.log("🟢 Usando dados em cache:", cachedData);
      setAvailableDates(cachedData);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsRetrying(currentRetry > 0);

    try {
      // Use the actual service now
      const dates = await appointmentService.getAvailableDates(doctorId, startDate, endDate);
      
      setCachedData(cacheKey, dates);
      setAvailableDates(dates);
      setRetryCount(0);
      setIsRetrying(false);
      
    } catch (err) {
      const error = err as Error;
      // Ignore abort errors
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }

      const errorMessage = error.message || 'Erro desconhecido';
      console.error("Erro ao buscar datas disponíveis:", error);
      
      if (currentRetry < maxRetries) {
        console.log(`Tentativa ${currentRetry + 1}/${maxRetries} falhou, tentando novamente em ${retryDelay}ms...`);
        setRetryCount(currentRetry + 1);
        setTimeout(() => {
            fetchAvailableDates(currentRetry + 1);
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
    fetchAvailableDates(0);
  }, [fetchAvailableDates, doctorId, startDate, endDate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchAvailableDates(0);
    } else {
      setAvailableDates([]);
    }
  }, [enabled, fetchAvailableDates]);

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