import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ValidationError } from '@/components/scheduling/FieldValidation';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  fieldErrors: Record<string, ValidationError>;
  isRetrying: boolean;
}

interface UseErrorHandlingOptions {
  onError?: (error: Error) => void;
  showToast?: boolean;
  retryAttempts?: number;
}

export const useErrorHandling = (options: UseErrorHandlingOptions = {}) => {
  const { onError, showToast = true, retryAttempts = 3 } = options;
  const { toast } = useToast();
  
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    fieldErrors: {},
    isRetrying: false
  });
  
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    console.error(`Error in ${context || 'unknown context'}:`, errorObj);
    
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error: errorObj
    }));

    if (showToast) {
      toast({
        title: "Erro no agendamento",
        description: errorObj.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }

    onError?.(errorObj);
  }, [toast, showToast, onError]);

  const handleNavigationError = useCallback((step: number, error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    handleError(errorObj, `Navigation to step ${step}`);
    
    // Additional navigation-specific error handling
    toast({
      title: "Erro de navegação",
      description: `Não foi possível avançar para a etapa ${step}. ${errorObj.message}`,
      variant: "destructive"
    });
  }, [handleError, toast]);

  const setFieldError = useCallback((field: string, error: ValidationError) => {
    setErrorState(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: error
      }
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrorState(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: undefined
      }
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      fieldErrors: {},
      isRetrying: false
    });
    setRetryCount(0);
  }, []);

  const retry = useCallback(async (retryFn: () => Promise<void> | void) => {
    if (retryCount >= retryAttempts) {
      toast({
        title: "Limite de tentativas excedido",
        description: "Tente novamente mais tarde ou entre em contato com o suporte",
        variant: "destructive"
      });
      return;
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));
    setRetryCount(prev => prev + 1);

    try {
      await retryFn();
      clearAllErrors();
      
      if (retryCount > 0) {
        toast({
          title: "Sucesso!",
          description: "Operação realizada com sucesso"
        });
      }
    } catch (error) {
      handleError(error as Error, 'Retry attempt');
    } finally {
      setErrorState(prev => ({ ...prev, isRetrying: false }));
    }
  }, [retryCount, retryAttempts, toast, handleError, clearAllErrors]);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    options?: { showSuccessToast?: boolean; successMessage?: string }
  ): Promise<T | null> => {
    try {
      const result = await operation();
      
      if (options?.showSuccessToast) {
        toast({
          title: "Sucesso!",
          description: options.successMessage || "Operação realizada com sucesso"
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [handleError, toast]);

  return {
    // State
    ...errorState,
    retryCount,
    canRetry: retryCount < retryAttempts,
    
    // Actions
    handleError,
    handleNavigationError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    retry,
    handleAsyncOperation,
    
    // Utilities
    getFieldError: (field: string) => errorState.fieldErrors[field],
    hasFieldError: (field: string) => !!errorState.fieldErrors[field],
    hasAnyFieldError: Object.keys(errorState.fieldErrors).some(key => !!errorState.fieldErrors[key])
  };
};