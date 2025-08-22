// Sistema de logging otimizado para produção
class ProductionLogger {
  private isProduction = process.env.NODE_ENV === 'production';
  
  // Log performance de queries críticas
  logQueryPerformance(operation: string, duration: number, details?: any) {
    if (this.isProduction) {
      // Em produção, logar apenas queries lentas
      if (duration > 2000) {
        console.warn(`🐌 Slow Query: ${operation} took ${duration}ms`, details);
      }
    } else {
      // Em desenvolvimento, logar todas
      console.log(`⚡ Query: ${operation} - ${duration}ms`, details);
    }
  }

  // Log erros críticos com contexto
  logError(operation: string, error: any, context?: any) {
    const errorData = {
      operation,
      error: error.message || error,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('🚨 Production Error:', errorData);
    
    // Em produção, poderia enviar para serviço de monitoramento
    if (this.isProduction) {
      // TODO: Integrar com serviço de monitoramento (Sentry, etc.)
    }
  }

  // Log sucesso de operações críticas
  logSuccess(operation: string, data?: any) {
    if (!this.isProduction) {
      console.log(`✅ Success: ${operation}`, data);
    }
  }

  // Log mudanças de estado importantes
  logStateChange(component: string, from: any, to: any) {
    if (!this.isProduction) {
      console.log(`🔄 State Change in ${component}:`, { from, to });
    }
  }
}

export const productionLogger = new ProductionLogger();