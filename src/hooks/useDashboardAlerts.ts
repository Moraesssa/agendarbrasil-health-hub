import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboardAlerts, DashboardAlert } from '@/services/dashboardService';

/**
 * Hook to fetch dashboard alerts using React Query
 * 
 * Features:
 * - Automatic caching (3 minutes stale time)
 * - Automatic refetching on window focus
 * - Error handling and retry logic
 * - Loading states
 * 
 * @returns Query result with alerts data, loading state, and error
 */
export function useDashboardAlerts() {
  const { user } = useAuth();

  return useQuery<DashboardAlert[], Error>({
    queryKey: ['dashboard-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return fetchDashboardAlerts(user.id);
    },
    enabled: !!user?.id, // Only run query if user is authenticated
    staleTime: 3 * 60 * 1000, // 3 minutes - moderate freshness for alerts
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet connection is restored
  });
}
