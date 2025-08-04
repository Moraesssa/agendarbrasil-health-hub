/**
 * Location Data Manager Hook
 * Comprehensive hook that integrates all location data management features
 */

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useEnhancedLocations,
  useLocationWithTimeSlots,
  useLocationStatus,
  useUpdateLocationData,
  useRefreshLocationData,
  useValidateLocationData,
  useLocationDataFreshness,
  useLocationCache,
  useLocationErrorHandler,
  locationQueryKeys
} from './useLocationData';
import { locationRefreshManager, refreshUtils } from '@/utils/locationRefreshManager';
import { locationCacheManager } from '@/utils/locationCacheManager';
import { locationValidator } from '@/utils/locationValidation';
import { locationErrorHandler, errorUtils } from '@/utils/locationErrorHandler';
import { 
  EnhancedLocation, 
  LocationWithTimeSlots, 
  LocationSearchParams,
  LocationUpdateRequest,
  LocationStatus,
  LocationStatusChangeEvent,
  LocationDataUpdateEvent
} from '@/types/location';
import { logger } from '@/utils/logger';

interface LocationDataManagerOptions {
  enableRealTimeUpdates?: boolean;
  enableAutoRefresh?: boolean;
  enableCaching?: boolean;
  enableValidation?: boolean;
  refreshInterval?: number;
  cacheStrategy?: 'aggressive' | 'normal' | 'minimal';
}

interface LocationDataManagerState {
  isInitialized: boolean;
  isRefreshing: boolean;
  lastRefreshTime?: Date;
  errorCount: number;
  cacheHitRate: number;
  realtimeConnected: boolean;
}

/**
 * Comprehensive location data management hook
 */
export function useLocationDataManager(options: LocationDataManagerOptions = {}) {
  const {
    enableRealTimeUpdates = true,
    enableAutoRefresh = true,
    enableCaching = true,
    enableValidation = true,
    refreshInterval = 15 * 60 * 1000, // 15 minutes
    cacheStrategy = 'normal'
  } = options;

  const queryClient = useQueryClient();
  const [state, setState] = useState<LocationDataManagerState>({
    isInitialized: false,
    isRefreshing: false,
    errorCount: 0,
    cacheHitRate: 0,
    realtimeConnected: false
  });

  // Core hooks
  const { clearCache, prefetchLocation, getCachedLocation } = useLocationCache();
  const { handleLocationError, retryLocationQuery } = useLocationErrorHandler();
  const refreshLocationData = useRefreshLocationData();
  const validateLocationData = useValidateLocationData();

  /**
   * Initialize the location data manager
   */
  const initialize = useCallback(async () => {
    try {
      logger.info('Initializing location data manager', 'useLocationDataManager', options);

      // Setup cache strategy
      if (enableCaching) {
        await setupCacheStrategy(cacheStrategy);
      }

      // Setup auto-refresh
      if (enableAutoRefresh) {
        setupAutoRefresh(refreshInterval);
      }

      // Setup real-time updates
      if (enableRealTimeUpdates) {
        setupRealTimeUpdates();
      }

      setState(prev => ({
        ...prev,
        isInitialized: true,
        realtimeConnected: enableRealTimeUpdates
      }));

      logger.info('Location data manager initialized successfully', 'useLocationDataManager');

    } catch (error) {
      logger.error('Failed to initialize location data manager', 'useLocationDataManager', error);
      setState(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [enableCaching, enableAutoRefresh, enableRealTimeUpdates, cacheStrategy, refreshInterval]);

  /**
   * Setup cache strategy
   */
  const setupCacheStrategy = useCallback(async (strategy: string) => {
    const cacheStats = locationCacheManager.getStats();
    
    switch (strategy) {
      case 'aggressive':
        // Prefetch commonly accessed locations
        await locationCacheManager.warmUp([
          {
            key: 'locations_list',
            fetcher: () => import('@/services/enhancedLocationService').then(s => 
              s.enhancedLocationService.getEnhancedLocations({ limit: 50 })
            ),
            priority: 3
          }
        ]);
        break;
        
      case 'minimal':
        // Clear unnecessary cache
        locationCacheManager.clear();
        break;
        
      default: // normal
        // Keep current cache, clean expired entries
        break;
    }

    setState(prev => ({ ...prev, cacheHitRate: cacheStats.hitRate }));
  }, []);

  /**
   * Setup auto-refresh mechanism
   */
  const setupAutoRefresh = useCallback((interval: number) => {
    // Schedule periodic refresh for all locations
    locationRefreshManager.refreshAllLocations('background');
    
    logger.info('Auto-refresh setup completed', 'useLocationDataManager', { interval });
  }, []);

  /**
   * Setup real-time updates
   */
  const setupRealTimeUpdates = useCallback(() => {
    const handleStatusChange = (event: CustomEvent<LocationStatusChangeEvent>) => {
      logger.info('Real-time status change received', 'useLocationDataManager', event.detail);
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ 
        queryKey: locationQueryKeys.detail(event.detail.location_id) 
      });
      
      // Update state
      setState(prev => ({ ...prev, realtimeConnected: true }));
    };

    const handleDataUpdate = (event: CustomEvent<LocationDataUpdateEvent>) => {
      logger.info('Real-time data update received', 'useLocationDataManager', event.detail);
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ 
        queryKey: locationQueryKeys.detail(event.detail.location_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: locationQueryKeys.lists() 
      });
    };

    window.addEventListener('locationStatusChange', handleStatusChange as EventListener);
    window.addEventListener('locationDataUpdate', handleDataUpdate as EventListener);

    return () => {
      window.removeEventListener('locationStatusChange', handleStatusChange as EventListener);
      window.removeEventListener('locationDataUpdate', handleDataUpdate as EventListener);
    };
  }, [queryClient]);

  /**
   * Get enhanced locations with full data management
   */
  const getLocations = useCallback((params?: LocationSearchParams) => {
    const locationsQuery = useEnhancedLocations(params);
    
    // Track cache performance
    useEffect(() => {
      const cacheStats = locationCacheManager.getStats();
      setState(prev => ({ ...prev, cacheHitRate: cacheStats.hitRate }));
    }, [locationsQuery.data]);

    return {
      ...locationsQuery,
      // Enhanced methods
      refreshData: () => {
        const taskId = locationRefreshManager.refreshAllLocations('normal');
        setState(prev => ({ ...prev, isRefreshing: true }));
        
        return taskId;
      },
      validateData: async () => {
        if (!locationsQuery.data?.locations) return [];
        
        const validationResults = await Promise.all(
          locationsQuery.data.locations.map(location => 
            locationValidator.validateLocation(location)
          )
        );
        
        return validationResults;
      },
      getCacheStats: () => locationCacheManager.getStats()
    };
  }, []);

  /**
   * Get location with time slots and full management
   */
  const getLocationWithTimeSlots = useCallback((locationId: string, date: string) => {
    const locationQuery = useLocationWithTimeSlots(locationId, date);
    const statusQuery = useLocationStatus(locationId);
    const freshnessInfo = useLocationDataFreshness(locationQuery.data);

    return {
      ...locationQuery,
      status: statusQuery.data,
      freshness: freshnessInfo,
      // Enhanced methods
      refreshData: () => {
        const taskId = locationRefreshManager.refreshLocation(locationId, 'normal');
        setState(prev => ({ ...prev, isRefreshing: true }));
        return taskId;
      },
      validateData: async () => {
        if (!locationQuery.data) return null;
        return await locationValidator.validateLocation(locationQuery.data);
      },
      forceRefresh: () => {
        return locationRefreshManager.forceRefresh(locationId);
      }
    };
  }, []);

  /**
   * Update location data with validation and error handling
   */
  const updateLocation = useCallback(async (request: LocationUpdateRequest) => {
    try {
      setState(prev => ({ ...prev, isRefreshing: true }));

      // Validate data if enabled
      if (enableValidation) {
        const validation = await locationValidator.validateLocation(request.updates);
        if (!validation.is_valid) {
          const errorMessages = validation.errors.map(e => e.message).join(', ');
          throw new Error(`Dados inválidos: ${errorMessages}`);
        }
      }

      // Perform update
      const updateMutation = useUpdateLocationData();
      await updateMutation.mutateAsync(request);

      // Schedule refresh to get updated data
      locationRefreshManager.refreshLocation(request.location_id, 'critical');

      logger.info('Location updated successfully', 'useLocationDataManager', { 
        locationId: request.location_id 
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to update location', 'useLocationDataManager', error);
      
      const context = errorUtils.createContext('update_location', request.location_id);
      const errorResult = await locationErrorHandler.handleError(error, context);
      
      setState(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      
      throw new Error(errorResult.userMessage);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [enableValidation]);

  /**
   * Bulk refresh multiple locations
   */
  const refreshLocations = useCallback(async (locationIds?: string[]) => {
    try {
      setState(prev => ({ ...prev, isRefreshing: true }));

      let taskId: string;
      
      if (locationIds && locationIds.length > 0) {
        taskId = locationRefreshManager.refreshLocations(locationIds, 'normal');
      } else {
        taskId = locationRefreshManager.refreshAllLocations('normal');
      }

      logger.info('Bulk refresh initiated', 'useLocationDataManager', { 
        taskId, 
        locationCount: locationIds?.length || 'all' 
      });

      setState(prev => ({ 
        ...prev, 
        lastRefreshTime: new Date() 
      }));

      return taskId;

    } catch (error) {
      logger.error('Bulk refresh failed', 'useLocationDataManager', error);
      setState(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, []);

  /**
   * Validate multiple locations
   */
  const validateLocations = useCallback(async (locations: EnhancedLocation[]) => {
    const validationResults = await Promise.all(
      locations.map(async (location) => ({
        locationId: location.id,
        validation: await locationValidator.validateLocation(location)
      }))
    );

    const invalidLocations = validationResults.filter(r => !r.validation.is_valid);
    
    if (invalidLocations.length > 0) {
      logger.warn('Invalid locations detected', 'useLocationDataManager', { 
        invalidCount: invalidLocations.length,
        totalCount: locations.length
      });
    }

    return validationResults;
  }, []);

  /**
   * Get comprehensive statistics
   */
  const getStatistics = useCallback(() => {
    const cacheStats = locationCacheManager.getStats();
    const refreshStats = locationRefreshManager.getStats();
    const errorStats = locationErrorHandler.getErrorStats();

    return {
      cache: cacheStats,
      refresh: refreshStats,
      errors: errorStats,
      manager: state
    };
  }, [state]);

  /**
   * Clear all data and reset
   */
  const reset = useCallback(() => {
    // Clear cache
    locationCacheManager.clear();
    
    // Clear React Query cache
    queryClient.removeQueries({ queryKey: locationQueryKeys.all });
    
    // Reset error handler
    locationErrorHandler.clearErrorHistory();
    
    // Reset state
    setState({
      isInitialized: false,
      isRefreshing: false,
      errorCount: 0,
      cacheHitRate: 0,
      realtimeConnected: false
    });

    logger.info('Location data manager reset', 'useLocationDataManager');
  }, [queryClient]);

  /**
   * Prefetch location data
   */
  const prefetchLocationData = useCallback(async (locationId: string) => {
    try {
      await prefetchLocation(locationId);
      logger.info('Location data prefetched', 'useLocationDataManager', { locationId });
    } catch (error) {
      logger.error('Failed to prefetch location data', 'useLocationDataManager', error);
    }
  }, [prefetchLocation]);

  /**
   * Check location data health
   */
  const checkDataHealth = useCallback(async () => {
    const stats = getStatistics();
    
    const health = {
      overall: 'healthy' as 'healthy' | 'warning' | 'critical',
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Check error rate
    const errorRate = stats.errors.totalOperations > 0 
      ? (Object.values(stats.errors.errorsByType).reduce((a, b) => a + b, 0) / stats.errors.totalOperations) * 100
      : 0;

    if (errorRate > 10) {
      health.overall = 'critical';
      health.issues.push(`Alta taxa de erro: ${errorRate.toFixed(1)}%`);
      health.recommendations.push('Verificar conectividade e integridade dos dados');
    } else if (errorRate > 5) {
      health.overall = 'warning';
      health.issues.push(`Taxa de erro moderada: ${errorRate.toFixed(1)}%`);
    }

    // Check cache performance
    if (stats.cache.hitRate < 50) {
      health.overall = health.overall === 'critical' ? 'critical' : 'warning';
      health.issues.push(`Baixa taxa de cache hit: ${stats.cache.hitRate.toFixed(1)}%`);
      health.recommendations.push('Considerar ajustar estratégia de cache');
    }

    // Check refresh performance
    if (stats.refresh.averageRefreshTime > 5000) {
      health.issues.push(`Tempo de refresh alto: ${stats.refresh.averageRefreshTime}ms`);
      health.recommendations.push('Otimizar operações de refresh');
    }

    return health;
  }, [getStatistics]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Monitor refresh completion
  useEffect(() => {
    const checkRefreshStatus = () => {
      const refreshStats = locationRefreshManager.getStats();
      if (refreshStats.activeRefreshes === 0 && state.isRefreshing) {
        setState(prev => ({ 
          ...prev, 
          isRefreshing: false,
          lastRefreshTime: new Date()
        }));
      }
    };

    const interval = setInterval(checkRefreshStatus, 1000);
    return () => clearInterval(interval);
  }, [state.isRefreshing]);

  return {
    // State
    state,
    
    // Core methods
    getLocations,
    getLocationWithTimeSlots,
    updateLocation,
    refreshLocations,
    validateLocations,
    
    // Utility methods
    prefetchLocationData,
    reset,
    getStatistics,
    checkDataHealth,
    
    // Direct access to managers (for advanced usage)
    managers: {
      cache: locationCacheManager,
      refresh: locationRefreshManager,
      validator: locationValidator,
      errorHandler: locationErrorHandler
    }
  };
}

/**
 * Simplified hook for basic location data needs
 */
export function useSimpleLocationData(params?: LocationSearchParams) {
  const manager = useLocationDataManager({
    enableRealTimeUpdates: true,
    enableAutoRefresh: false,
    enableCaching: true,
    enableValidation: false,
    cacheStrategy: 'normal'
  });

  return manager.getLocations(params);
}

/**
 * Hook for location data with real-time updates
 */
export function useRealtimeLocationData(locationId: string, date?: string) {
  const manager = useLocationDataManager({
    enableRealTimeUpdates: true,
    enableAutoRefresh: true,
    enableCaching: true,
    enableValidation: true,
    refreshInterval: 2 * 60 * 1000 // 2 minutes for real-time
  });

  if (date) {
    return manager.getLocationWithTimeSlots(locationId, date);
  }

  return manager.getLocations({ 
    filters: { /* filter by locationId */ } 
  });
}

export default useLocationDataManager;