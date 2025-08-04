/**
 * React Query hooks for Location Data Management
 * Provides caching, real-time updates, and error handling for location data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { enhancedLocationService } from '@/services/enhancedLocationService';
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

// Query keys for React Query
export const locationQueryKeys = {
  all: ['locations'] as const,
  lists: () => [...locationQueryKeys.all, 'list'] as const,
  list: (params?: LocationSearchParams) => [...locationQueryKeys.lists(), params] as const,
  details: () => [...locationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationQueryKeys.details(), id] as const,
  withTimeSlots: (id: string, date: string) => [...locationQueryKeys.detail(id), 'timeSlots', date] as const,
  status: (id: string) => [...locationQueryKeys.detail(id), 'status'] as const,
};

/**
 * Hook for fetching enhanced locations with caching and real-time updates
 */
export function useEnhancedLocations(params?: LocationSearchParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: locationQueryKeys.list(params),
    queryFn: () => enhancedLocationService.getEnhancedLocations(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3 && error.message.includes('network')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Setup real-time updates
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent<LocationDataUpdateEvent>) => {
      logger.info('Invalidating location cache due to real-time update', 'useEnhancedLocations', event.detail);
      
      // Invalidate all location queries
      queryClient.invalidateQueries({ queryKey: locationQueryKeys.all });
    };

    const handleStatusChange = (event: CustomEvent<LocationStatusChangeEvent>) => {
      logger.info('Invalidating location cache due to status change', 'useEnhancedLocations', event.detail);
      
      // Invalidate specific location and list queries
      queryClient.invalidateQueries({ queryKey: locationQueryKeys.detail(event.detail.location_id) });
      queryClient.invalidateQueries({ queryKey: locationQueryKeys.lists() });
    };

    window.addEventListener('locationDataUpdate', handleLocationUpdate as EventListener);
    window.addEventListener('locationStatusChange', handleStatusChange as EventListener);

    return () => {
      window.removeEventListener('locationDataUpdate', handleLocationUpdate as EventListener);
      window.removeEventListener('locationStatusChange', handleStatusChange as EventListener);
    };
  }, [queryClient]);

  return {
    ...query,
    locations: query.data?.locations || [],
    totalCount: query.data?.total_count || 0,
    hasMore: query.data?.has_more || false,
    lastUpdated: query.data?.last_updated,
  };
}

/**
 * Hook for fetching a single location with time slots
 */
export function useLocationWithTimeSlots(locationId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: locationQueryKeys.withTimeSlots(locationId, date),
    queryFn: () => enhancedLocationService.getLocationWithTimeSlots(locationId, date),
    enabled: enabled && !!locationId && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes for time-sensitive data
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook for fetching location status with real-time updates
 */
export function useLocationStatus(locationId: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: locationQueryKeys.status(locationId),
    queryFn: () => enhancedLocationService.getLocationStatus(locationId),
    enabled: enabled && !!locationId,
    staleTime: 2 * 60 * 1000, // 2 minutes for status data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Setup real-time status updates
  useEffect(() => {
    if (!enabled || !locationId) return;

    const handleStatusChange = (event: CustomEvent<LocationStatusChangeEvent>) => {
      if (event.detail.location_id === locationId) {
        logger.info('Updating location status from real-time event', 'useLocationStatus', event.detail);
        
        // Update the query data directly
        queryClient.setQueryData(locationQueryKeys.status(locationId), {
          status: event.detail.new_status,
          is_open_now: event.detail.new_status === 'ativo',
          last_updated: event.detail.timestamp
        });
      }
    };

    window.addEventListener('locationStatusChange', handleStatusChange as EventListener);

    return () => {
      window.removeEventListener('locationStatusChange', handleStatusChange as EventListener);
    };
  }, [locationId, enabled, queryClient]);

  return query;
}

/**
 * Hook for updating location data
 */
export function useUpdateLocationData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LocationUpdateRequest) => 
      enhancedLocationService.updateLocationData(request),
    onSuccess: (_, variables) => {
      logger.info('Location data updated successfully', 'useUpdateLocationData', { 
        locationId: variables.location_id 
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: locationQueryKeys.detail(variables.location_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: locationQueryKeys.lists() 
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to update location data', 'useUpdateLocationData', {
        error,
        locationId: variables.location_id
      });
    },
  });
}

/**
 * Hook for refreshing location data
 */
export function useRefreshLocationData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId?: string) => 
      enhancedLocationService.refreshLocationData(locationId),
    onSuccess: (_, locationId) => {
      logger.info('Location data refreshed successfully', 'useRefreshLocationData', { locationId });

      if (locationId) {
        // Invalidate specific location queries
        queryClient.invalidateQueries({ 
          queryKey: locationQueryKeys.detail(locationId) 
        });
      } else {
        // Invalidate all location queries
        queryClient.invalidateQueries({ 
          queryKey: locationQueryKeys.all 
        });
      }
    },
    onError: (error, locationId) => {
      logger.error('Failed to refresh location data', 'useRefreshLocationData', {
        error,
        locationId
      });
    },
  });
}

/**
 * Hook for validating location data
 */
export function useValidateLocationData() {
  return useMutation({
    mutationFn: (location: Partial<EnhancedLocation>) => 
      enhancedLocationService.validateLocationData(location),
    onError: (error) => {
      logger.error('Failed to validate location data', 'useValidateLocationData', error);
    },
  });
}

/**
 * Hook for checking if location data is outdated
 */
export function useLocationDataFreshness(location?: EnhancedLocation) {
  return {
    isOutdated: location ? enhancedLocationService.isLocationDataOutdated(location) : false,
    lastUpdated: location?.ultima_atualizacao,
    needsRefresh: useCallback(() => {
      return location ? enhancedLocationService.isLocationDataOutdated(location) : false;
    }, [location]),
  };
}

/**
 * Hook for managing location cache
 */
export function useLocationCache() {
  const queryClient = useQueryClient();

  const clearCache = useCallback((locationId?: string) => {
    if (locationId) {
      queryClient.removeQueries({ 
        queryKey: locationQueryKeys.detail(locationId) 
      });
    } else {
      queryClient.removeQueries({ 
        queryKey: locationQueryKeys.all 
      });
    }
  }, [queryClient]);

  const prefetchLocation = useCallback(async (locationId: string) => {
    await queryClient.prefetchQuery({
      queryKey: locationQueryKeys.detail(locationId),
      queryFn: () => enhancedLocationService.getEnhancedLocations({ 
        filters: { /* filter by locationId */ } 
      }),
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);

  const getCachedLocation = useCallback((locationId: string): EnhancedLocation | undefined => {
    const cachedData = queryClient.getQueryData(locationQueryKeys.detail(locationId));
    return cachedData as EnhancedLocation | undefined;
  }, [queryClient]);

  return {
    clearCache,
    prefetchLocation,
    getCachedLocation,
  };
}

/**
 * Hook for location error handling
 */
export function useLocationErrorHandler() {
  const queryClient = useQueryClient();

  const handleLocationError = useCallback((error: any, locationId?: string) => {
    logger.error('Location error occurred', 'useLocationErrorHandler', { error, locationId });

    // Check if it's a network error and we have cached data
    if (error.message?.includes('network') && locationId) {
      const cachedData = queryClient.getQueryData(locationQueryKeys.detail(locationId));
      if (cachedData) {
        logger.info('Using cached data due to network error', 'useLocationErrorHandler', { locationId });
        return cachedData;
      }
    }

    // For other errors, invalidate potentially stale data
    if (locationId) {
      queryClient.invalidateQueries({ 
        queryKey: locationQueryKeys.detail(locationId) 
      });
    }

    throw error;
  }, [queryClient]);

  const retryLocationQuery = useCallback((locationId: string) => {
    queryClient.refetchQueries({ 
      queryKey: locationQueryKeys.detail(locationId) 
    });
  }, [queryClient]);

  return {
    handleLocationError,
    retryLocationQuery,
  };
}

/**
 * Hook for location real-time subscriptions management
 */
export function useLocationRealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    logger.info('Setting up location real-time subscriptions', 'useLocationRealtimeSubscriptions');

    // The subscriptions are already set up in the service
    // This hook just ensures they're active when components mount

    return () => {
      logger.info('Cleaning up location real-time subscriptions', 'useLocationRealtimeSubscriptions');
      // Cleanup is handled by the service
    };
  }, [queryClient]);

  const isSubscriptionActive = useCallback(() => {
    // Check if real-time subscriptions are active
    return true; // Placeholder - would check actual subscription status
  }, []);

  return {
    isSubscriptionActive,
  };
}