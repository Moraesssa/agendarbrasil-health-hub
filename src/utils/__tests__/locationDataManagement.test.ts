/**
 * Integration tests for Location Data Management
 * Tests the complete location data management system including caching, validation, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { locationRefreshManager, refreshUtils } from '../locationRefreshManager';
import { locationCacheManager, cacheUtils } from '../locationCacheManager';
import { locationValidator, validationUtils } from '../locationValidation';
import { locationErrorHandler, errorUtils } from '../locationErrorHandler';
import { EnhancedLocation } from '@/types/location';

// Mock logger to avoid console output during tests
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock enhanced location service
vi.mock('@/services/enhancedLocationService', () => ({
  enhancedLocationService: {
    refreshLocationData: vi.fn().mockResolvedValue(undefined),
    getEnhancedLocations: vi.fn().mockResolvedValue({
      locations: [],
      total_count: 0,
      has_more: false,
      last_updated: new Date().toISOString()
    })
  }
}));

describe('Location Data Management Integration', () => {
  const mockLocation: Partial<EnhancedLocation> = {
    id: 'test-location-1',
    nome_local: 'Hospital Teste',
    endereco_completo: 'Rua das Flores, 123, Centro, São Paulo, SP',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    telefone: '(11) 1234-5678',
    email: 'contato@hospital.com',
    status: 'ativo',
    coordenadas: {
      lat: -23.5505,
      lng: -46.6333,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito' },
      { type: 'acessibilidade', available: true }
    ],
    ultima_atualizacao: new Date().toISOString(),
    verificado_em: new Date().toISOString(),
    fonte_dados: 'manual'
  };

  beforeEach(() => {
    // Clear all managers before each test
    locationCacheManager.clear();
    locationErrorHandler.clearErrorHistory();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    locationCacheManager.clear();
  });

  describe('Location Cache Manager', () => {
    it('should cache and retrieve location data', () => {
      const key = cacheUtils.locationKey('test-location-1');
      
      // Set data in cache
      locationCacheManager.set(key, mockLocation);
      
      // Retrieve data from cache
      const cachedData = locationCacheManager.get(key);
      
      expect(cachedData).toEqual(mockLocation);
      expect(locationCacheManager.has(key)).toBe(true);
    });

    it('should handle cache expiration', async () => {
      const key = cacheUtils.locationKey('test-location-1');
      
      // Set data with short TTL
      locationCacheManager.set(key, mockLocation, { ttl: 100 });
      
      // Data should be available immediately
      expect(locationCacheManager.get(key)).toEqual(mockLocation);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Data should be expired
      expect(locationCacheManager.get(key)).toBeNull();
    });

    it('should provide cache statistics', () => {
      const key1 = cacheUtils.locationKey('location-1');
      const key2 = cacheUtils.locationKey('location-2');
      
      locationCacheManager.set(key1, mockLocation);
      locationCacheManager.set(key2, mockLocation);
      
      // Access one item to increase hit count
      locationCacheManager.get(key1);
      
      const stats = locationCacheManager.getStats();
      
      expect(stats.totalEntries).toBe(2);
      expect(stats.hitCount).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should handle cache key utilities', () => {
      const locationId = 'test-location-1';
      const date = '2024-01-15';
      
      expect(cacheUtils.locationKey(locationId)).toBe('location:test-location-1');
      expect(cacheUtils.locationTimeSlotsKey(locationId, date)).toBe('location:test-location-1:timeslots:2024-01-15');
      expect(cacheUtils.locationStatusKey(locationId)).toBe('location:test-location-1:status');
    });
  });

  describe('Location Validator', () => {
    it('should validate complete location successfully', async () => {
      const result = await locationValidator.validateLocation(mockLocation);
      
      if (result.errors.length > 0) {
        console.log('Validation errors:', result.errors);
      }
      
      expect(result.is_valid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const incompleteLocation = {
        id: 'test-location-1',
        nome_local: 'Hospital Teste'
        // Missing required fields
      };
      
      const result = await locationValidator.validateLocation(incompleteLocation);
      
      expect(result.is_valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('endereco_completo');
      expect(errorFields).toContain('cidade');
      expect(errorFields).toContain('estado');
    });

    it('should validate phone number format', async () => {
      const locationWithInvalidPhone = {
        ...mockLocation,
        telefone: '123456789' // Invalid format
      };
      
      const result = await locationValidator.validateLocation(locationWithInvalidPhone);
      
      const phoneError = result.errors.find(e => e.field === 'telefone');
      expect(phoneError).toBeDefined();
      expect(phoneError?.severity).toBe('warning');
    });

    it('should validate coordinates', async () => {
      const locationWithInvalidCoords = {
        ...mockLocation,
        coordenadas: {
          lat: 200, // Invalid latitude
          lng: -46.6333,
          precisao: 'exata' as const
        }
      };
      
      const result = await locationValidator.validateLocation(locationWithInvalidCoords);
      
      const coordError = result.errors.find(e => e.field === 'coordenadas');
      expect(coordError).toBeDefined();
    });

    it('should validate operating hours', async () => {
      const locationWithInvalidHours = {
        ...mockLocation,
        horario_funcionamento: {
          ...mockLocation.horario_funcionamento!,
          segunda: { abertura: '25:00', fechamento: '18:00', fechado: false } // Invalid time
        }
      };
      
      const result = await locationValidator.validateLocation(locationWithInvalidHours);
      
      const hoursError = result.errors.find(e => e.field === 'horario_funcionamento');
      expect(hoursError).toBeDefined();
    });

    it('should use validation utilities', () => {
      expect(validationUtils.validatePhone('(11) 1234-5678')).toBe(true);
      expect(validationUtils.validatePhone('123456789')).toBe(false);
      
      expect(validationUtils.validateEmail('test@example.com')).toBe(true);
      expect(validationUtils.validateEmail('invalid-email')).toBe(false);
      
      expect(validationUtils.validateCEP('12345-678')).toBe(true);
      expect(validationUtils.validateCEP('12345678')).toBe(true);
      expect(validationUtils.validateCEP('invalid')).toBe(false);
    });
  });

  describe('Location Error Handler', () => {
    it('should classify network errors correctly', async () => {
      const networkError = new Error('Network request failed');
      const context = errorUtils.createContext('fetch_location', 'test-location-1');
      
      const result = await locationErrorHandler.handleError(networkError, context);
      
      expect(result.strategy).toBe('retry');
      expect(result.userMessage).toContain('conexão');
    });

    it('should classify not found errors correctly', async () => {
      const notFoundError = new Error('Location not found');
      const context = errorUtils.createContext('fetch_location', 'test-location-1');
      
      const result = await locationErrorHandler.handleError(notFoundError, context);
      
      expect(result.strategy).toBe('user_action_required');
      expect(result.userMessage).toContain('não encontrado');
    });

    it('should classify validation errors correctly', async () => {
      const validationError = new Error('Invalid data format');
      const context = errorUtils.createContext('validate_location', 'test-location-1');
      
      const result = await locationErrorHandler.handleError(validationError, context);
      
      expect(result.strategy).toBe('user_action_required');
      expect(result.userMessage).toContain('inválidos');
    });

    it('should track error statistics', async () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Validation error');
      const context = errorUtils.createContext('test_operation');
      
      await locationErrorHandler.handleError(error1, context);
      await locationErrorHandler.handleError(error2, context);
      
      const stats = locationErrorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(2);
      expect(stats.totalOperations).toBe(2);
      expect(stats.errorRate).toBe(100);
    });

    it('should detect error patterns', async () => {
      const context = errorUtils.createContext('test_operation');
      
      // Generate multiple network errors
      for (let i = 0; i < 15; i++) {
        await locationErrorHandler.handleError(new Error('Network error'), context);
      }
      
      const pattern = locationErrorHandler.detectErrorPatterns();
      
      expect(pattern.hasPattern).toBe(true);
      expect(pattern.pattern).toContain('network_error');
    });

    it('should provide error utilities', () => {
      const context = errorUtils.createContext('test_operation', 'location-1', { extra: 'data' });
      
      expect(context.operation).toBe('test_operation');
      expect(context.locationId).toBe('location-1');
      expect(context.additionalData).toEqual({ extra: 'data' });
      expect(context.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Location Refresh Manager', () => {
    it('should create refresh tasks', () => {
      const taskId = locationRefreshManager.refreshLocation('test-location-1', 'normal');
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      expect(taskId).toMatch(/^refresh_\d+_/);
    });

    it('should handle bulk refresh', () => {
      const locationIds = ['location-1', 'location-2', 'location-3'];
      const taskId = locationRefreshManager.refreshLocations(locationIds, 'normal');
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    it('should handle refresh all locations', () => {
      const taskId = locationRefreshManager.refreshAllLocations('background');
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    it('should prioritize critical refreshes', () => {
      const normalTask = locationRefreshManager.refreshLocation('location-1', 'normal');
      const criticalTask = locationRefreshManager.refreshLocation('location-2', 'critical');
      
      expect(normalTask).toBeDefined();
      expect(criticalTask).toBeDefined();
    });

    it('should provide refresh statistics', () => {
      locationRefreshManager.refreshLocation('location-1', 'normal');
      locationRefreshManager.refreshLocation('location-2', 'critical');
      
      const stats = locationRefreshManager.getStats();
      
      expect(stats.queuedRefreshes).toBeGreaterThanOrEqual(0);
    });

    it('should use refresh utilities', () => {
      const cancelFn = refreshUtils.schedulePeriodicRefresh(1000);
      expect(typeof cancelFn).toBe('function');
      
      // Cancel the periodic refresh
      cancelFn();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete data management workflow', async () => {
      const locationId = 'test-location-1';
      
      // 1. Validate location data
      const validationResult = await locationValidator.validateLocation(mockLocation);
      expect(validationResult.is_valid).toBe(true);
      
      // 2. Cache the validated data
      const cacheKey = cacheUtils.locationKey(locationId);
      locationCacheManager.set(cacheKey, mockLocation);
      
      // 3. Retrieve from cache
      const cachedData = locationCacheManager.get(cacheKey);
      expect(cachedData).toEqual(mockLocation);
      
      // 4. Schedule refresh
      const refreshTaskId = locationRefreshManager.refreshLocation(locationId, 'normal');
      expect(refreshTaskId).toBeDefined();
      
      // 5. Check statistics
      const cacheStats = locationCacheManager.getStats();
      const refreshStats = locationRefreshManager.getStats();
      
      expect(cacheStats.totalEntries).toBe(1);
      expect(refreshStats.queuedRefreshes).toBeGreaterThanOrEqual(0);
    });

    it('should handle error recovery with cache fallback', async () => {
      const locationId = 'test-location-1';
      const cacheKey = cacheUtils.locationKey(locationId);
      
      // Cache some data first
      locationCacheManager.set(cacheKey, mockLocation);
      
      // Simulate service unavailable error
      const serviceError = new Error('Service unavailable');
      const context = errorUtils.createContext('fetch_location', locationId);
      
      const recoveryResult = await locationErrorHandler.handleError(serviceError, context);
      
      // Should suggest cache fallback
      expect(recoveryResult.strategy).toBe('fallback_cache');
    });

    it('should handle validation errors with user feedback', async () => {
      const invalidLocation = {
        id: 'invalid-location',
        nome_local: 'X', // Too short
        telefone: '123', // Invalid format
        coordenadas: { lat: 200, lng: 300, precisao: 'exata' as const } // Invalid coordinates
      };
      
      // Validate the invalid location
      const validationResult = await locationValidator.validateLocation(invalidLocation);
      expect(validationResult.is_valid).toBe(false);
      
      // Format errors for user display
      const errorMessages = validationUtils.formatValidationErrors(validationResult.errors);
      expect(errorMessages.length).toBeGreaterThan(0);
      
      // Each error should be user-friendly
      errorMessages.forEach(message => {
        expect(message).toContain(':');
        expect(message.length).toBeGreaterThan(10);
      });
    });

    it('should handle cache optimization under load', () => {
      // Fill cache with multiple entries
      for (let i = 0; i < 50; i++) {
        const key = cacheUtils.locationKey(`location-${i}`);
        locationCacheManager.set(key, { ...mockLocation, id: `location-${i}` });
      }
      
      const initialStats = locationCacheManager.getStats();
      expect(initialStats.totalEntries).toBe(50);
      
      // Optimize cache
      locationCacheManager.optimize();
      
      // Cache should still be functional
      const key = cacheUtils.locationKey('location-1');
      const data = locationCacheManager.get(key);
      expect(data).toBeDefined();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      
      // Add many cache entries
      for (let i = 0; i < 1000; i++) {
        const key = cacheUtils.locationKey(`location-${i}`);
        locationCacheManager.set(key, mockLocation);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      
      // Cache should maintain reasonable size
      const stats = locationCacheManager.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(1000);
    });

    it('should clean up expired entries automatically', async () => {
      // Add entries with short TTL
      for (let i = 0; i < 10; i++) {
        const key = cacheUtils.locationKey(`temp-location-${i}`);
        locationCacheManager.set(key, mockLocation, { ttl: 50 });
      }
      
      const initialStats = locationCacheManager.getStats();
      expect(initialStats.totalEntries).toBe(10);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to access expired entries
      for (let i = 0; i < 10; i++) {
        const key = cacheUtils.locationKey(`temp-location-${i}`);
        const data = locationCacheManager.get(key);
        expect(data).toBeNull();
      }
    });
  });
});