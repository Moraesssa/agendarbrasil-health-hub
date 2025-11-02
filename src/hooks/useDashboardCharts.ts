import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchConsultasChartData,
  fetchConsultationTypeData,
  ChartDataPoint,
  ConsultationTypeData,
} from '@/services/dashboardService';

/**
 * Hook to fetch consultation chart data (bar chart)
 * 
 * @param days - Number of days to fetch data for (default: 7)
 * @returns Query result with chart data points
 */
export function useConsultasChartData(days: number = 7) {
  const { user } = useAuth();

  return useQuery<ChartDataPoint[], Error>({
    queryKey: ['consultas-chart', user?.id, days],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return fetchConsultasChartData(user.id, days);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook to fetch consultation type distribution data (donut chart)
 * 
 * @param period - Time period for data ('month' | 'year')
 * @returns Query result with consultation type data
 */
export function useConsultationTypeData(period: 'month' | 'year' = 'month') {
  const { user } = useAuth();

  return useQuery<ConsultationTypeData[], Error>({
    queryKey: ['consultation-type', user?.id, period],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return fetchConsultationTypeData(user.id, period);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
