import { supabase } from "@/integrations/supabase/client";
import { logger } from './logger';

const EDGE_FUNCTIONS_URL = 'https://ulebotjrsgheybhpdnxd.functions.supabase.co';

export type AdvancedLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface AdvancedLogEntry {
  id: string;
  traceId: string;
  sessionId: string;
  level: AdvancedLogLevel;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  context?: string;
  meta?: Record<string, any>;
  breadcrumbs?: any[];
  userId?: string;
  performanceData?: Record<string, any>;
}

interface LogQueue {
  entries: AdvancedLogEntry[];
  lastSent: number;
}

class AdvancedLogger {
  private queue: AdvancedLogEntry[] = [];
  private sessionId: string;
  private traceId: string;
  private userId?: string;
  private isEnabled: boolean = false;
  private sendInterval: number = 5000; // 5 seconds
  private maxBatchSize: number = 50;
  private maxPayloadSize: number = 200000; // 200KB
  private breadcrumbs: any[] = [];
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.sessionId = this.generateId();
    this.traceId = this.generateId();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.checkAccess();
      if (this.isEnabled) {
        this.init();
      }
    } catch (e) {
      console.debug('AdvancedLogger initialize failed:', e);
    }
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async checkAccess() {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.userId = user.id;

      // Check allowlist - in production you might want to cache this
      const { data } = await supabase
        .from('debug_allowlist')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      this.isEnabled = !!data;
    } catch (error) {
      console.debug('Advanced logging access check failed:', error);
    }
  }

  private init() {
    if (!this.isEnabled) return;

    // Wrap console methods
    this.wrapConsole();
    
    // Setup error handlers
    this.setupErrorHandlers();
    
    // Setup fetch/XHR instrumentation
    this.setupNetworkInstrumentation();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Start periodic sending
    setInterval(() => this.flush(), this.sendInterval);
    
    // Send logs on page unload
    window.addEventListener('beforeunload', () => this.flush(true));

    logger.info('Advanced logging initialized', 'AdvancedLogger', { sessionId: this.sessionId });
  }

  private wrapConsole() {
    const originalMethods = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
      const original = originalMethods[method as keyof typeof originalMethods];
      (console as any)[method] = (...args: any[]) => {
        // Call original method
        original.apply(console, args);
        
        // Log to advanced logger
        if (this.isEnabled) {
          this.captureLog(method as AdvancedLogLevel, args);
        }
      };
    });
  }

  private setupErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, { type: 'unhandledrejection' });
    });
  }

  private setupNetworkInstrumentation() {
      // Wrap fetch
    if (window.fetch) {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = performance.now();
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
        
        try {
          const response = await originalFetch(...args);
          const duration = performance.now() - startTime;
          
          this.captureNetworkEvent('fetch', {
            url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration
          });
          
          return response;
        } catch (error) {
          const duration = performance.now() - startTime;
          this.captureNetworkEvent('fetch_error', {
            url,
            method: args[1]?.method || 'GET',
            error: error.message,
            duration
          });
          throw error;
        }
      };
    }
  }

  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
              this.capturePerformanceMetric('navigation', {
                domContentLoaded: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
                loadComplete: (entry as PerformanceNavigationTiming).loadEventEnd,
                type: (entry as PerformanceNavigationTiming).type
              });
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint'] });
      } catch (error) {
        console.debug('Performance observer setup failed:', error);
      }
    }
  }

  private captureLog(level: AdvancedLogLevel, args: any[]) {
    const entry: AdvancedLogEntry = {
      id: this.generateId(),
      traceId: this.traceId,
      sessionId: this.sessionId,
      level,
      message: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch {
          return String(arg);
        }
      }).join(' '),
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      meta: { rawArgs: args },
      breadcrumbs: [...this.breadcrumbs]
    };

    this.enqueue(entry);
  }

  private captureError(error: Error | any, meta?: Record<string, any>) {
    const entry: AdvancedLogEntry = {
      id: this.generateId(),
      traceId: this.traceId,
      sessionId: this.sessionId,
      level: 'error',
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      meta,
      breadcrumbs: [...this.breadcrumbs]
    };

    this.enqueue(entry);
    
    // Also log to regular logger
    logger.error(entry.message, 'AdvancedLogger', { error, meta });
  }

  private captureNetworkEvent(type: string, data: Record<string, any>) {
    this.addBreadcrumb({
      type: 'http',
      category: 'network',
      data,
      timestamp: Date.now()
    });

    if (type === 'fetch_error' || (data.status && data.status >= 400)) {
      this.captureLog('error', [`Network ${type}`, data]);
    } else {
      this.captureLog('info', [`Network ${type}`, data]);
    }
  }

  private capturePerformanceMetric(name: string, data: Record<string, any>) {
    const entry: AdvancedLogEntry = {
      id: this.generateId(),
      traceId: this.traceId,
      sessionId: this.sessionId,
      level: 'info',
      message: `Performance metric: ${name}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      performanceData: data,
      breadcrumbs: [...this.breadcrumbs]
    };

    this.enqueue(entry);
  }

  private addBreadcrumb(crumb: any) {
    this.breadcrumbs.push(crumb);
    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  private enqueue(entry: AdvancedLogEntry) {
    this.queue.push(entry);
    
    // Keep queue size reasonable
    if (this.queue.length > 1000) {
      this.queue = this.queue.slice(-500);
    }
  }

  private async flush(useBeacon: boolean = false) {
    if (!this.isEnabled || this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.maxBatchSize);
    const payload = {
      events: batch,
      sentAt: new Date().toISOString(),
      client: {
        url: window.location.href,
        ua: navigator.userAgent,
        sessionId: this.sessionId
      }
    };

    try {
      if (useBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${EDGE_FUNCTIONS_URL}/client-logs`, blob);
      } else {
        // Prefer using Supabase Functions SDK
        const { error } = await supabase.functions.invoke('client-logs', {
          body: payload,
        });
        if (error) throw error;
      }
    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...batch);
      console.debug('Failed to send logs:', error);
    }
  }

  // Public API
  public captureException(error: Error, context?: Record<string, any>) {
    this.captureError(error, context);
  }

  public captureBreadcrumb(name: string, data?: any) {
    this.addBreadcrumb({
      message: name,
      data,
      timestamp: Date.now()
    });
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public setTraceId(traceId: string) {
    this.traceId = traceId;
  }

  public getTraceId(): string {
    return this.traceId;
  }

  public isAdvancedLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  public async queryLogs(filters?: { traceId?: string; level?: string; limit?: number }) {
    if (!this.isEnabled) return null;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      
      if (filters?.traceId) params.set('traceId', filters.traceId);
      if (filters?.level) params.set('level', filters.level);
      if (filters?.limit) params.set('limit', filters.limit.toString());
      
      const response = await fetch(`${EDGE_FUNCTIONS_URL}/client-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to query logs:', error);
      return null;
    }
  }
}

// Export singleton instance
export const advancedLogger = new AdvancedLogger();

// Make it available globally for debugging
(window as any).__AdvancedLogger = advancedLogger;
