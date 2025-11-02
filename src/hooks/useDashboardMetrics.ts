import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboardMetrics, DashboardMetrics } from '@/services/dashboardService';

/**
 * Hook to fetch dashboard metrics using React Query
 * 
 * Features:
 * - Automatic caching (5 minutes stale time)
 * - Automatic refetching on window focus
 * - Error handling and retry logic
 * - Loading states
 * 
 * @param period - Time period for metrics ('today' | 'week' | 'month' | 'year')
 * @returns Query result with metrics data, loading state, and error
 */
export function useDashboardMetrics(period: 'today' | 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth();

  return useQuery<DashboardMetrics, Error>({
    queryKey: ['dashboard-metrics', user?.id, period],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return fetchDashboardMetrics(user.id, period);
    },
    enabled: !!user?.id, // Only run query if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet connection is restored
  });
}
