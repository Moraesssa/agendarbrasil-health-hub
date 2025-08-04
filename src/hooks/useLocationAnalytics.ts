// Location Analytics Hook
// replaced by kiro @2025-02-08T19:30:00Z

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import locationAnalyticsService from '@/services/locationAnalyticsService';

interface UseLocationAnalyticsOptions {
  trackViews?: boolean;
  trackSelections?: boolean;
  trackInteractions?: boolean;
  debounceMs?: number;
}

interface LocationAnalyticsHook {
  trackView: (locationId: string, metadata?: any) => void;
  trackSelection: (locationId: string, metadata?: any) => void;
  trackInteraction: (locationId: string, type: string, metadata?: any) => void;
  trackCall: (locationId: string) => void;
  trackMap: (locationId: string) => void;
  trackShare: (locationId: string, method?: string) => void;
  trackComparison: (locationIds: string[]) => void;
}

export const useLocationAnalytics = (
  options: UseLocationAnalyticsOptions = {}
): LocationAnalyticsHook => {
  const { user } = useAuth();
  const {
    trackViews = true,
    trackSelections = true,
    trackInteractions = true,
    debounceMs = 1000
  } = options;

  // Debounce tracking to avoid excessive API calls
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const viewedLocations = useRef<Set<string>>(new Set());

  const debounce = useCallback((key: string, fn: () => void, delay: number) => {
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    
    debounceTimers.current[key] = setTimeout(() => {
      fn();
      delete debounceTimers.current[key];
    }, delay);
  }, []);

  const trackView = useCallback((locationId: string, metadata?: any) => {
    if (!trackViews || viewedLocations.current.has(locationId)) return;

    debounce(`view-${locationId}`, () => {
      locationAnalyticsService.trackLocationView(locationId, {
        ...metadata,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      viewedLocations.current.add(locationId);
    }, debounceMs);
  }, [trackViews, user?.id, debounce, debounceMs]);

  const trackSelection = useCallback((locationId: string, metadata?: any) => {
    if (!trackSelections) return;

    locationAnalyticsService.trackLocationSelection(locationId, {
      ...metadata,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [trackSelections, user?.id]);

  const trackInteraction = useCallback((locationId: string, type: string, metadata?: any) => {
    if (!trackInteractions) return;

    debounce(`interaction-${locationId}-${type}`, () => {
      locationAnalyticsService.trackLocationInteraction({
        locationId,
        userId: user?.id,
        sessionId: sessionStorage.getItem('location_session_id') || 'unknown',
        interactionType: type as any,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    }, debounceMs / 2); // Shorter debounce for interactions
  }, [trackInteractions, user?.id, debounce, debounceMs]);

  const trackCall = useCallback((locationId: string) => {
    trackInteraction(locationId, 'call', {
      action: 'phone_call_initiated'
    });
  }, [trackInteraction]);

  const trackMap = useCallback((locationId: string) => {
    trackInteraction(locationId, 'map', {
      action: 'map_view_opened'
    });
  }, [trackInteraction]);

  const trackShare = useCallback((locationId: string, method?: string) => {
    trackInteraction(locationId, 'share', {
      action: 'location_shared',
      shareMethod: method
    });
  }, [trackInteraction]);

  const trackComparison = useCallback((locationIds: string[]) => {
    locationIds.forEach(locationId => {
      trackInteraction(locationId, 'compare', {
        action: 'location_comparison',
        comparedWith: locationIds.filter(id => id !== locationId),
        totalLocations: locationIds.length
      });
    });
  }, [trackInteraction]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  return {
    trackView,
    trackSelection,
    trackInteraction,
    trackCall,
    trackMap,
    trackShare,
    trackComparison
  };
};

// Hook for location feedback management
export const useLocationFeedback = () => {
  const { user } = useAuth();

  const submitFeedback = useCallback(async (
    locationId: string,
    rating?: number,
    comment?: string,
    category?: string
  ) => {
    if (!user) {
      throw new Error('Usuário deve estar logado para enviar feedback');
    }

    return await locationAnalyticsService.submitFeedback({
      locationId,
      rating,
      comment,
      feedbackType: 'rating',
      category
    });
  }, [user]);

  const submitCorrection = useCallback(async (
    locationId: string,
    fieldName: string,
    currentValue: string,
    suggestedValue: string,
    description?: string
  ) => {
    if (!user) {
      throw new Error('Usuário deve estar logado para enviar correção');
    }

    return await locationAnalyticsService.submitFeedback({
      locationId,
      feedbackType: 'correction',
      comment: description,
      correctionData: {
        fieldName,
        currentValue,
        suggestedValue
      }
    });
  }, [user]);

  const submitSuggestion = useCallback(async (
    locationId: string,
    suggestion: string,
    category?: string
  ) => {
    if (!user) {
      throw new Error('Usuário deve estar logado para enviar sugestão');
    }

    return await locationAnalyticsService.submitFeedback({
      locationId,
      feedbackType: 'suggestion',
      comment: suggestion,
      category
    });
  }, [user]);

  return {
    submitFeedback,
    submitCorrection,
    submitSuggestion
  };
};

// Hook for location analytics data
export const useLocationAnalyticsData = (locationId: string) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [analyticsData, popularityData, ratingData] = await Promise.all([
          locationAnalyticsService.getLocationAnalytics(locationId),
          locationAnalyticsService.getPopularityIndicators([locationId]),
          locationAnalyticsService.getLocationRating(locationId)
        ]);

        if (mounted) {
          setAnalytics({
            ...analyticsData,
            popularity: popularityData[0] || null,
            rating: ratingData
          });
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [locationId]);

  return { analytics, loading, error };
};

export default useLocationAnalytics;