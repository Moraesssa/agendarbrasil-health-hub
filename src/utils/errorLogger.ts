/**
 * Enhanced error logging utility for tracking and monitoring application errors
 * Specifically designed to handle undefined property access errors
 */

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  errorType: 'undefined_property' | 'network' | 'generic';
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  retryCount: number;
  context?: Record<string, any>;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private sessionId: string;
  private maxLogEntries = 100;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public logError(
    error: Error,
    errorType: ErrorLogEntry['errorType'] = 'generic',
    context?: Record<string, any>,
    retryCount: number = 0
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      errorMessage: error.message,
      errorStack: error.stack,
      errorType,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      retryCount,
      context
    };

    // Enhanced logging for undefined property errors
    if (errorType === 'undefined_property') {
      this.logUndefinedPropertyError(logEntry);
    }

    // Store in localStorage
    this.storeErrorLog(logEntry);

    // In production, this would send to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }

    return errorId;
  }

  private logUndefinedPropertyError(logEntry: ErrorLogEntry) {
    // Only show detailed error logs in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Undefined Property Error Logged');
      console.error('Error ID:', logEntry.id);
      console.error('Timestamp:', logEntry.timestamp);
      console.error('Message:', logEntry.errorMessage);
      console.error('URL:', logEntry.url);
      console.error('Session:', logEntry.sessionId);
      
      if (logEntry.context) {
        console.error('Context:', logEntry.context);
      }

      // Analyze error patterns
      this.analyzeErrorPatterns(logEntry.errorMessage);
      
      console.groupEnd();
    } else {
      // In production, just log a simple error message
      console.error('Application Error:', logEntry.errorMessage);
    }
  }

  private analyzeErrorPatterns(errorMessage: string) {
    // Only analyze patterns in development
    if (process.env.NODE_ENV !== 'development') return;
    
    const patterns = [
      {
        pattern: /Cannot read properties of undefined \(reading '(\w+)'\)/,
        analysis: (match: RegExpMatchArray) => 
          `Attempted to access property '${match[1]}' on undefined object`
      },
      {
        pattern: /Cannot read property '(\w+)' of undefined/,
        analysis: (match: RegExpMatchArray) => 
          `Legacy undefined property access: '${match[1]}'`
      },
      {
        pattern: /undefined is not an object \(evaluating '.*\.(\w+)'\)/,
        analysis: (match: RegExpMatchArray) => 
          `Safari/WebKit undefined object evaluation: '${match[1]}'`
      }
    ];

    patterns.forEach(({ pattern, analysis }) => {
      const match = errorMessage.match(pattern);
      if (match) {
        console.warn('Pattern Analysis:', analysis(match));
        
        // Suggest potential fixes
        this.suggestFixes(match[1]);
      }
    });
  }

  private suggestFixes(propertyName: string) {
    // Only show suggestions in development
    if (process.env.NODE_ENV !== 'development') return;
    
    const commonFixes = {
      'length': 'Use: array?.length || 0 or Array.isArray(array) ? array.length : 0',
      'map': 'Use: array?.map(...) || [] or (array || []).map(...)',
      'filter': 'Use: array?.filter(...) || [] or (array || []).filter(...)',
      'find': 'Use: array?.find(...) or (array || []).find(...)',
      'forEach': 'Use: array?.forEach(...) or (array || []).forEach(...)'
    };

    if (commonFixes[propertyName as keyof typeof commonFixes]) {
      console.info('💡 Suggested fix:', commonFixes[propertyName as keyof typeof commonFixes]);
    } else {
      console.info('💡 General fix:', `Use optional chaining: object?.${propertyName} or object && object.${propertyName}`);
    }
  }

  private storeErrorLog(logEntry: ErrorLogEntry) {
    try {
      const existingLogs = this.getStoredLogs();
      existingLogs.push(logEntry);
      
      // Keep only the most recent entries
      if (existingLogs.length > this.maxLogEntries) {
        existingLogs.splice(0, existingLogs.length - this.maxLogEntries);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.warn('Failed to store error log:', e);
    }
  }

  private sendToLoggingService(logEntry: ErrorLogEntry) {
    // In a real application, this would send to a service like Sentry, LogRocket, etc.
    // For now, we'll just log that it would be sent
    console.log('📤 Would send to logging service:', {
      errorId: logEntry.id,
      errorType: logEntry.errorType,
      timestamp: logEntry.timestamp
    });
  }

  public getStoredLogs(): ErrorLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch (e) {
      console.warn('Failed to retrieve error logs:', e);
      return [];
    }
  }

  public clearLogs(): void {
    localStorage.removeItem('errorLogs');
    console.log('🗑️ Error logs cleared');
  }

  public getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    recentErrors: ErrorLogEntry[];
  } {
    const logs = this.getStoredLogs();
    const byType: Record<string, number> = {};
    
    logs.forEach(log => {
      byType[log.errorType] = (byType[log.errorType] || 0) + 1;
    });

    // Get errors from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = logs.filter(log => 
      new Date(log.timestamp) > oneDayAgo
    );

    return {
      total: logs.length,
      byType,
      recentErrors
    };
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Utility function for quick error logging
export const logUndefinedPropertyError = (
  error: Error,
  context?: Record<string, any>,
  retryCount: number = 0
): string => {
  return errorLogger.logError(error, 'undefined_property', context, retryCount);
};