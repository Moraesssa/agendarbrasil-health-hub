/**
 * Dashboard Hooks - Centralized exports
 * 
 * All dashboard-related React Query hooks for easy importing
 */

export { useDashboardMetrics } from '../useDashboardMetrics';
export { useDashboardAppointments } from '../useDashboardAppointments';
export { useDashboardAlerts } from '../useDashboardAlerts';
export { useConsultasChartData, useConsultationTypeData } from '../useDashboardCharts';

// Re-export types from service for convenience
export type {
  DashboardMetrics,
  DashboardAppointment,
  DashboardAlert,
  ChartDataPoint,
  ConsultationTypeData,
} from '@/services/dashboardService';
