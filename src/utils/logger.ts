export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  userId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Safe way to get current user ID without importing supabase directly
    try {
      return localStorage.getItem('supabase.auth.token') ? 'authenticated' : undefined;
    } catch {
      return undefined;
    }
  }

  private logToConsole(entry: LogEntry) {
    if (!this.isDevelopment) return;

    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data);
        break;
      case 'info':
        console.info(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'error':
        console.error(message, entry.data);
        break;
    }
  }

  private addToQueue(entry: LogEntry) {
    this.logs.push(entry);
    // Keep only last 100 logs in memory
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  debug(message: string, context?: string, data?: any) {
    const entry = this.formatMessage('debug', message, context, data);
    this.logToConsole(entry);
    this.addToQueue(entry);
  }

  info(message: string, context?: string, data?: any) {
    const entry = this.formatMessage('info', message, context, data);
    this.logToConsole(entry);
    this.addToQueue(entry);
  }

  warn(message: string, context?: string, data?: any) {
    const entry = this.formatMessage('warn', message, context, data);
    this.logToConsole(entry);
    this.addToQueue(entry);
  }

  error(message: string, context?: string, data?: any) {
    const entry = this.formatMessage('error', message, context, data);
    this.logToConsole(entry);
    this.addToQueue(entry);
    
    // In production, you would send this to your logging service
    // this.sendToLoggingService(entry);
  }

  // Method to get recent logs for debugging
  getRecentLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Method to clear logs
  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
