/**
 * Location Error Handler
 * Provides comprehensive error handling, recovery strategies, and user-friendly error messages
 */

import { logger } from '@/utils/logger';

export type ErrorType = 
  | 'network_error'
  | 'validation_error'
  | 'not_found_error'
  | 'permission_error'
  | 'service_unavailable'
  | 'timeout_error'
  | 'data_corruption'
  | 'cache_error'
  | 'unknown_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RecoveryStrategy = 
  | 'retry'
  | 'fallback_cache'
  | 'fallback_default'
  | 'user_action_required'
  | 'escalate'
  | 'ignore';

interface ErrorContext {
  operation: string;
  locationId?: string;
  userId?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

interface ErrorClassification {
  type: ErrorType;
  severity: ErrorSeverity;
  isRecoverable: boolean;
  suggestedStrategy: RecoveryStrategy;
  userMessage: string;
  technicalMessage: string;
}

interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recoveryAttempts: number;
  successfulRecoveries: number;
  totalOperations: number;
  errorRate: number;
}

interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  userMessage: string;
  technicalDetails?: string;
  fallbackData?: any;
}

class LocationErrorHandler {
  private errorHistory: Array<{
    error: Error;
    context: ErrorContext;
    classification: ErrorClassification;
    timestamp: Date;
  }> = [];

  private stats: ErrorStats = {
    totalErrors: 0,
    errorsByType: {} as Record<ErrorType, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
    totalOperations: 0,
    errorRate: 0
  };

  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Progressive delays
  private readonly MAX_RETRIES = 3;

  /**
   * Handle error with automatic classification and recovery
   */
  async handleError(error: Error, context: ErrorContext): Promise<RecoveryResult> {
    this.stats.totalOperations++;
    
    const classification = this.classifyError(error, context);
    
    // Log error with classification
    logger.error('Location error occurred', 'locationErrorHandler', {
      error: error.message,
      context,
      classification
    });

    // Add to history
    this.addToHistory(error, context, classification);
    
    // Update statistics
    this.updateStats(classification);

    // Attempt recovery based on classification
    const recoveryResult = await this.attemptRecovery(error, context, classification);

    if (recoveryResult.success) {
      this.stats.successfulRecoveries++;
      logger.info('Error recovery successful', 'locationErrorHandler', {
        strategy: recoveryResult.strategy,
        context
      });
    } else {
      logger.error('Error recovery failed', 'locationErrorHandler', {
        strategy: recoveryResult.strategy,
        context
      });
    }

    return recoveryResult;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    this.updateErrorRate();
    return { ...this.stats };
  }

  /**
   * Get recent error history
   */
  getRecentErrors(limit: number = 50): Array<{
    error: string;
    context: ErrorContext;
    classification: ErrorClassification;
    timestamp: Date;
  }> {
    return this.errorHistory
      .slice(-limit)
      .map(entry => ({
        error: entry.error.message,
        context: entry.context,
        classification: entry.classification,
        timestamp: entry.timestamp
      }));
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.resetStats();
    logger.info('Error history cleared', 'locationErrorHandler');
  }

  /**
   * Check if error pattern indicates system issue
   */
  detectErrorPatterns(): {
    hasPattern: boolean;
    pattern?: string;
    recommendation?: string;
  } {
    if (this.errorHistory.length < 10) {
      return { hasPattern: false };
    }

    const recentErrors = this.errorHistory.slice(-20);
    
    // Check for repeated error types
    const errorTypeCounts: Record<string, number> = {};
    recentErrors.forEach(entry => {
      const type = entry.classification.type;
      errorTypeCounts[type] = (errorTypeCounts[type] || 0) + 1;
    });

    const dominantType = Object.entries(errorTypeCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantType && dominantType[1] > 10) {
      return {
        hasPattern: true,
        pattern: `Repeated ${dominantType[0]} errors`,
        recommendation: this.getPatternRecommendation(dominantType[0] as ErrorType)
      };
    }

    // Check for error rate spike
    const errorRate = this.stats.errorRate;
    if (errorRate > 25) {
      return {
        hasPattern: true,
        pattern: `High error rate: ${errorRate.toFixed(1)}%`,
        recommendation: 'Investigate system health and network connectivity'
      };
    }

    return { hasPattern: false };
  }

  // Private methods

  private classifyError(error: Error, context: ErrorContext): ErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')
    ) {
      return {
        type: 'network_error',
        severity: 'medium',
        isRecoverable: true,
        suggestedStrategy: 'retry',
        userMessage: 'Problema de conexão. Tentando novamente...',
        technicalMessage: `Network error: ${error.message}`
      };
    }

    // Not found errors
    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('404') ||
      errorStack.includes('pgrst116')
    ) {
      return {
        type: 'not_found_error',
        severity: 'low',
        isRecoverable: false,
        suggestedStrategy: 'user_action_required',
        userMessage: 'Local não encontrado. Verifique se o local ainda está disponível.',
        technicalMessage: `Resource not found: ${error.message}`
      };
    }

    // Permission errors
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorStack.includes('pgrst301')
    ) {
      return {
        type: 'permission_error',
        severity: 'high',
        isRecoverable: false,
        suggestedStrategy: 'escalate',
        userMessage: 'Você não tem permissão para acessar este local.',
        technicalMessage: `Permission denied: ${error.message}`
      };
    }

    // Validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('formato')
    ) {
      return {
        type: 'validation_error',
        severity: 'low',
        isRecoverable: true,
        suggestedStrategy: 'user_action_required',
        userMessage: 'Dados inválidos. Verifique as informações fornecidas.',
        technicalMessage: `Validation error: ${error.message}`
      };
    }

    // Service unavailable
    if (
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504')
    ) {
      return {
        type: 'service_unavailable',
        severity: 'high',
        isRecoverable: true,
        suggestedStrategy: 'fallback_cache',
        userMessage: 'Serviço temporariamente indisponível. Usando dados em cache.',
        technicalMessage: `Service unavailable: ${error.message}`
      };
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out')
    ) {
      return {
        type: 'timeout_error',
        severity: 'medium',
        isRecoverable: true,
        suggestedStrategy: 'retry',
        userMessage: 'Operação demorou muito para responder. Tentando novamente...',
        technicalMessage: `Timeout error: ${error.message}`
      };
    }

    // Data corruption
    if (
      errorMessage.includes('corrupt') ||
      errorMessage.includes('malformed') ||
      errorMessage.includes('parse')
    ) {
      return {
        type: 'data_corruption',
        severity: 'high',
        isRecoverable: true,
        suggestedStrategy: 'fallback_default',
        userMessage: 'Dados corrompidos detectados. Usando valores padrão.',
        technicalMessage: `Data corruption: ${error.message}`
      };
    }

    // Default classification
    return {
      type: 'unknown_error',
      severity: 'medium',
      isRecoverable: true,
      suggestedStrategy: 'retry',
      userMessage: 'Erro inesperado. Tentando novamente...',
      technicalMessage: `Unknown error: ${error.message}`
    };
  }

  private async attemptRecovery(
    error: Error,
    context: ErrorContext,
    classification: ErrorClassification
  ): Promise<RecoveryResult> {
    this.stats.recoveryAttempts++;

    switch (classification.suggestedStrategy) {
      case 'retry':
        return await this.retryOperation(error, context);

      case 'fallback_cache':
        return await this.useCacheFallback(context);

      case 'fallback_default':
        return await this.useDefaultFallback(context);

      case 'user_action_required':
        return {
          success: false,
          strategy: 'user_action_required',
          userMessage: classification.userMessage,
          technicalDetails: classification.technicalMessage
        };

      case 'escalate':
        return await this.escalateError(error, context, classification);

      case 'ignore':
        return {
          success: true,
          strategy: 'ignore',
          userMessage: 'Erro ignorado conforme configuração.',
          technicalDetails: 'Error ignored by policy'
        };

      default:
        return {
          success: false,
          strategy: 'unknown',
          userMessage: 'Não foi possível recuperar do erro.',
          technicalDetails: classification.technicalMessage
        };
    }
  }

  private async retryOperation(error: Error, context: ErrorContext): Promise<RecoveryResult> {
    // For network errors, suggest retry with user-friendly message
    return {
      success: false,
      strategy: 'retry',
      userMessage: 'Problema de conexão detectado. Tente novamente em alguns instantes.',
      technicalDetails: `Retry suggested for: ${error.message}`
    };
  }

  private async useCacheFallback(context: ErrorContext): Promise<RecoveryResult> {
    try {
      // Try to get cached data
      const { locationCacheManager } = await import('./locationCacheManager');
      
      if (context.locationId) {
        const cachedData = locationCacheManager.get(`location:${context.locationId}`);
        if (cachedData) {
          return {
            success: true,
            strategy: 'fallback_cache',
            userMessage: 'Usando dados salvos localmente.',
            fallbackData: cachedData
          };
        }
      }

      return {
        success: false,
        strategy: 'fallback_cache',
        userMessage: 'Nenhum dado em cache disponível.',
        technicalDetails: 'No cached data found'
      };
    } catch (cacheError) {
      return {
        success: false,
        strategy: 'fallback_cache',
        userMessage: 'Erro ao acessar dados em cache.',
        technicalDetails: `Cache access failed: ${cacheError}`
      };
    }
  }

  private async useDefaultFallback(context: ErrorContext): Promise<RecoveryResult> {
    const defaultData = {
      id: context.locationId || 'unknown',
      nome_local: 'Local Indisponível',
      endereco_completo: 'Endereço não disponível',
      status: 'temporariamente_fechado' as const,
      motivo_fechamento: 'Dados temporariamente indisponíveis'
    };

    return {
      success: true,
      strategy: 'fallback_default',
      userMessage: 'Usando informações básicas do local.',
      fallbackData: defaultData
    };
  }

  private async escalateError(
    error: Error,
    context: ErrorContext,
    classification: ErrorClassification
  ): Promise<RecoveryResult> {
    // Log critical error for monitoring
    logger.error('Critical error escalated', 'locationErrorHandler', {
      error: error.message,
      context,
      classification,
      stack: error.stack
    });

    // In a real implementation, this might send alerts to monitoring systems
    
    return {
      success: false,
      strategy: 'escalate',
      userMessage: 'Erro crítico reportado. Nossa equipe foi notificada.',
      technicalDetails: 'Error escalated to monitoring system'
    };
  }

  private addToHistory(
    error: Error,
    context: ErrorContext,
    classification: ErrorClassification
  ): void {
    this.errorHistory.push({
      error,
      context,
      classification,
      timestamp: new Date()
    });

    // Maintain history size limit
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory = this.errorHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  private updateStats(classification: ErrorClassification): void {
    this.stats.totalErrors++;
    
    // Update error type counts
    const errorType = classification.type;
    this.stats.errorsByType[errorType] = (this.stats.errorsByType[errorType] || 0) + 1;
    
    // Update severity counts
    const severity = classification.severity;
    this.stats.errorsBySeverity[severity] = (this.stats.errorsBySeverity[severity] || 0) + 1;
  }

  private updateErrorRate(): void {
    if (this.stats.totalOperations > 0) {
      this.stats.errorRate = (this.stats.totalErrors / this.stats.totalOperations) * 100;
    }
  }

  private resetStats(): void {
    this.stats = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      totalOperations: 0,
      errorRate: 0
    };
  }

  private getPatternRecommendation(errorType: ErrorType): string {
    const recommendations: Record<ErrorType, string> = {
      network_error: 'Verificar conectividade de rede e status dos serviços',
      validation_error: 'Revisar validação de dados de entrada',
      not_found_error: 'Verificar integridade dos dados de localização',
      permission_error: 'Revisar configurações de permissão e autenticação',
      service_unavailable: 'Verificar status dos serviços externos',
      timeout_error: 'Otimizar performance das consultas',
      data_corruption: 'Verificar integridade do banco de dados',
      cache_error: 'Limpar e reconfigurar sistema de cache',
      unknown_error: 'Investigar logs detalhados para identificar causa'
    };

    return recommendations[errorType] || 'Investigar padrão de erro específico';
  }
}

// Export singleton instance
export const locationErrorHandler = new LocationErrorHandler();

// Export utility functions
export const errorUtils = {
  /**
   * Create error context for location operations
   */
  createContext(operation: string, locationId?: string, additionalData?: Record<string, any>): ErrorContext {
    return {
      operation,
      locationId,
      timestamp: new Date(),
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      additionalData
    };
  },

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: Error): boolean {
    const handler = new LocationErrorHandler();
    const context = errorUtils.createContext('check_recoverable');
    const classification = (handler as any).classifyError(error, context);
    return classification.isRecoverable;
  },

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error): string {
    const handler = new LocationErrorHandler();
    const context = errorUtils.createContext('get_user_message');
    const classification = (handler as any).classifyError(error, context);
    return classification.userMessage;
  },

  /**
   * Format error for logging
   */
  formatForLogging(error: Error, context?: Partial<ErrorContext>): Record<string, any> {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: context || {},
      timestamp: new Date().toISOString()
    };
  }
};

export default locationErrorHandler;