import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test the error logger functionality
describe('Error Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Mock console methods to avoid noise in test output
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {})
    };
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach((spy: any) => spy.mockRestore());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should create error logger instance', async () => {
    const { ErrorLogger } = await import('@/utils/errorLogger');
    const instance = ErrorLogger.getInstance();
    expect(instance).toBeDefined();
    
    // Should return same instance (singleton)
    const instance2 = ErrorLogger.getInstance();
    expect(instance).toBe(instance2);
  });

  it('should log undefined property errors correctly', async () => {
    const { errorLogger } = await import('@/utils/errorLogger');
    const error = new Error("Cannot read properties of undefined (reading 'length')");
    
    const errorId = errorLogger.logError(error, 'undefined_property', { test: 'context' }, 0);
    
    expect(errorId).toBeDefined();
    expect(typeof errorId).toBe('string');
    expect(errorId).toMatch(/^error_\d+_/);
  });

  it('should store and retrieve error logs', async () => {
    const { errorLogger } = await import('@/utils/errorLogger');
    const error = new Error("Test error");
    
    // Clear existing logs
    errorLogger.clearLogs();
    
    // Log an error
    errorLogger.logError(error, 'generic', { test: 'context' }, 0);
    
    // Retrieve logs
    const logs = errorLogger.getStoredLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].errorMessage).toBe('Test error');
    expect(logs[0].errorType).toBe('generic');
    expect(logs[0].context).toEqual({ test: 'context' });
  });

  it('should provide error statistics', async () => {
    const { errorLogger } = await import('@/utils/errorLogger');
    
    // Clear existing logs
    errorLogger.clearLogs();
    
    // Log different types of errors
    errorLogger.logError(new Error("Undefined error"), 'undefined_property');
    errorLogger.logError(new Error("Network error"), 'network');
    errorLogger.logError(new Error("Generic error"), 'generic');
    
    const stats = errorLogger.getErrorStats();
    expect(stats.total).toBe(3);
    expect(stats.byType.undefined_property).toBe(1);
    expect(stats.byType.network).toBe(1);
    expect(stats.byType.generic).toBe(1);
  });

  it('should handle localStorage errors gracefully', async () => {
    const { errorLogger } = await import('@/utils/errorLogger');
    
    // Mock localStorage to throw an error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const error = new Error("Test error");
    
    // Should not throw even if localStorage fails
    expect(() => {
      errorLogger.logError(error, 'generic');
    }).not.toThrow();
    
    // Restore localStorage
    localStorage.setItem = originalSetItem;
  });

  it('should limit stored logs to maximum entries', async () => {
    const { errorLogger } = await import('@/utils/errorLogger');
    
    errorLogger.clearLogs();
    
    // Log more than the maximum number of entries (100)
    for (let i = 0; i < 105; i++) {
      errorLogger.logError(new Error(`Error ${i}`), 'generic');
    }
    
    const logs = errorLogger.getStoredLogs();
    expect(logs.length).toBe(100); // Should be limited to max entries
    
    // Should keep the most recent entries
    expect(logs[logs.length - 1].errorMessage).toBe('Error 104');
  });

  it('should generate unique error IDs', async () => {
    const { errorLogger } = await import('@/utils/errorLogger');
    
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");
    
    const id1 = errorLogger.logError(error1, 'generic');
    const id2 = errorLogger.logError(error2, 'generic');
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^error_\d+_/);
    expect(id2).toMatch(/^error_\d+_/);
  });
});

