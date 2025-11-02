import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUpcomingAppointments, DashboardAppointment } from '@/services/dashboardService';

/**
 * Hook to fetch upcoming appointments using React Query
 * 
 * Features:
 * - Automatic caching (2 minutes stale time for more frequent updates)
 * - Automatic refetching on window focus
 * - Error handling and retry logic
 * - Loading states
 * 
 * @param limit - Maximum number of appointments to fetch (default: 5)
 * @returns Query result with appointments data, loading state, and error
 */
export function useDashboardAppointments(limit: number = 5) {
  const { user } = useAuth();

  return useQuery<DashboardAppointment[], Error>({
    queryKey: ['dashboard-appointments', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return fetchUpcomingAppointments(user.id, limit);
    },
    enabled: !!user?.id, // Only run query if user is authenticated
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for appointments (more time-sensitive)
    gcTime: 5 * 60 * 1000, // 5 minutes - cache time
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet connection is restored
    refetchInterval: 60 * 1000, // Refetch every minute to keep appointments fresh
  });
}
