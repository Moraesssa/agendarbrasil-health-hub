import { useState, useEffect, useCallback, useRef } from "react";
import { appointmentService } from "@/services/appointmentService";
import { logger } from "@/utils/logger";

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
  refetch: () => Promise<void>;
  clearError: () => void;
  retryCount: number;
  isRetrying: boolean;
}

// Simple in-memory cache for available dates
const cache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (doctorId: string, startDate?: string, endDate?: string): string => {
  return `${doctorId}-${startDate || 'default'}-${endDate || 'default'}`;
};

const getCachedData = (cacheKey: string): string[] | null => {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (cacheKey: string, data: string[]): void => {
  cache.set(cacheKey, { data, timestamp: Date.now() });
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
  
  // Use ref to track the current request to avoid race conditions
  const currentRequestRef = useRef<AbortController | null>(null);

  const fetchAvailableDates = useCallback(async (signal?: AbortSignal, currentRetry = 0) => {
    if (!doctorId || !enabled) {
      setAvailableDates([]);
      setRetryCount(0);
      return;
    }

    const cacheKey = getCacheKey(doctorId, startDate, endDate);
    
    // Check cache first (only on first attempt, not retries)
    if (currentRetry === 0) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        logger.info("Using cached available dates", "useAvailableDates", { doctorId, cacheKey });
        setAvailableDates(cachedData);
        setError(null);
        setRetryCount(0);
        return;
      }
    }

    if (currentRetry === 0) {
      setIsLoading(true);
      setRetryCount(0);
    } else {
      setIsRetrying(true);
      setRetryCount(currentRetry);
    }
    
    setError(null);

    try {
      logger.info("Fetching available dates", "useAvailableDates", { 
        doctorId, 
        startDate, 
        endDate, 
        attempt: currentRetry + 1 
      });
      
      const dates = await appointmentService.getAvailableDates(doctorId, startDate, endDate);
      
      // Check if request was aborted
      if (signal?.aborted) {
        logger.info("Request aborted", "useAvailableDates", { doctorId });
        return;
      }

      // Cache the result
      setCachedData(cacheKey, dates);
      
      setAvailableDates(dates);
      setError(null);
      setRetryCount(0);
      
      logger.info("Available dates fetched successfully", "useAvailableDates", { 
        doctorId, 
        datesCount: dates.length,
        attempt: currentRetry + 1
      });
    } catch (err) {
      // Don't set error if request was aborted
      if (signal?.aborted) {
        return;
      }

      let errorMessage = "Erro ao carregar datas disponíveis";
      let shouldRetry = false;
      
      if (err instanceof Error) {
        // Handle specific error types
        if (err.message.includes("não está logado") || err.message.includes("not authenticated")) {
          errorMessage = "Você precisa estar logado para ver as datas disponíveis";
        } else if (err.message.includes("network") || err.message.includes("fetch") || err.message.includes("timeout")) {
          errorMessage = "Erro de conexão. Tentando novamente...";
          shouldRetry = true;
        } else if (err.message.includes("configurações do médico")) {
          errorMessage = "Erro nas configurações do médico. Contate o suporte";
        } else {
          errorMessage = err.message;
          // Retry on generic errors that might be temporary
          shouldRetry = true;
        }
      } else {
        shouldRetry = true;
      }
      
      logger.error("Failed to fetch available dates", "useAvailableDates", { 
        error: err, 
        attempt: currentRetry + 1,
        willRetry: shouldRetry && currentRetry < maxRetries
      });

      // Retry logic for network errors
      if (shouldRetry && currentRetry < maxRetries) {
        const delay = retryDelay * Math.pow(2, currentRetry); // Exponential backoff
        logger.info("Retrying in", "useAvailableDates", { delay, attempt: currentRetry + 2 });
        
        setTimeout(() => {
          if (!signal?.aborted) {
            fetchAvailableDates(signal, currentRetry + 1);
          }
        }, delay);
        return;
      }
      
      // Final error after all retries
      if (currentRetry >= maxRetries && shouldRetry) {
        errorMessage = "Não foi possível carregar as datas após várias tentativas. Verifique sua conexão";
      }
      
      setError(errorMessage);
      setAvailableDates([]);
      setRetryCount(currentRetry);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
        setIsRetrying(false);
      }
    }
  }, [doctorId, startDate, endDate, enabled, maxRetries, retryDelay]);

  const refetch = useCallback(async () => {
    // Cancel any ongoing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Clear cache for this request
    const cacheKey = getCacheKey(doctorId, startDate, endDate);
    cache.delete(cacheKey);

    // Create new abort controller
    const abortController = new AbortController();
    currentRequestRef.current = abortController;

    await fetchAvailableDates(abortController.signal);
  }, [fetchAvailableDates, doctorId, startDate, endDate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    // Cancel any ongoing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    currentRequestRef.current = abortController;

    fetchAvailableDates(abortController.signal);

    // Cleanup function to cancel request on unmount or dependency change
    return () => {
      abortController.abort();
    };
  }, [fetchAvailableDates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, []);

  return {
    availableDates,
    isLoading,
    error,
    refetch,
    clearError,
    retryCount,
    isRetrying,
  };
};