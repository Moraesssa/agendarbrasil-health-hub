import { useQuery, useQueryClient } from '@tanstack/react-query';
import { medicoProfileService } from '@/services/medicoProfileService';
import type {
  MedicoMetrics,
  UpcomingAppointment,
  CalendarAppointment,
  MedicoNotification
} from '@/services/medicoProfileService';

export const useDoctorProfileData = (medicoId?: string) => {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<MedicoMetrics>({
    queryKey: ['medico-metrics', medicoId],
    queryFn: () => medicoProfileService.getMedicoMetrics(medicoId!),
    enabled: !!medicoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (cache)
    refetchOnWindowFocus: true,
  });
  
  const { data: upcomingAppointments = [], isLoading: appointmentsLoading } = useQuery<UpcomingAppointment[]>({
    queryKey: ['medico-upcoming', medicoId],
    queryFn: () => medicoProfileService.getUpcomingConsultas(medicoId!),
    enabled: !!medicoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
  
  const { data: calendarAppointments = [], isLoading: calendarLoading } = useQuery<CalendarAppointment[]>({
    queryKey: ['medico-calendar', medicoId, new Date().getMonth()],
    queryFn: () => medicoProfileService.getConsultasByMonth(medicoId!, new Date()),
    enabled: !!medicoId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<MedicoNotification[]>({
    queryKey: ['medico-notifications', medicoId],
    queryFn: () => medicoProfileService.getMedicoNotifications(medicoId!),
    enabled: !!medicoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh a cada 2 minutos
  });

  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['medico-metrics', medicoId] }),
      queryClient.invalidateQueries({ queryKey: ['medico-upcoming', medicoId] }),
      queryClient.invalidateQueries({ queryKey: ['medico-calendar', medicoId] }),
      queryClient.invalidateQueries({ queryKey: ['medico-notifications', medicoId] }),
    ]);
  };
  
  return {
    metrics: metrics || {
      totalConsultations: 0,
      todaysConsultations: 0,
      upcomingConsultations: 0,
      uniquePatients: 0,
      occupancyRate: 0,
      satisfactionRate: 0
    },
    upcomingAppointments,
    calendarAppointments,
    notifications,
    loading: metricsLoading || appointmentsLoading || calendarLoading || notificationsLoading,
    error: metricsError ? (metricsError as Error).message : null,
    refetch
  };
};
