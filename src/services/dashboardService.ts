import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Dashboard Service
 * 
 * Centralized service for fetching dashboard data from Supabase
 */

export interface DashboardMetrics {
  totalConsultas: number;
  consultasChange: number;
  receitaTotal: number;
  receitaChange: number;
  taxaOcupacao: number;
  ocupacaoChange: number;
  pacientesUnicos: number;
  pacientesChange: number;
}

export interface DashboardAppointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  scheduledTime: Date;
  type: 'presencial' | 'teleconsulta';
  status: 'confirmed' | 'pending' | 'agendada';
  isUrgent: boolean;
  pacienteId: string;
}

export interface DashboardAlert {
  id: string;
  type: 'payment' | 'confirmation' | 'document' | 'message';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionUrl: string;
  count?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface ConsultationTypeData {
  type: 'presencial' | 'teleconsulta';
  count: number;
  percentage: number;
  color: string;
}

/**
 * Fetch dashboard metrics for a specific period
 */
export async function fetchDashboardMetrics(
  userId: string,
  period: 'today' | 'week' | 'month' | 'year' = 'month'
): Promise<DashboardMetrics> {
  try {
    const { startDate, endDate } = getPeriodDates(period);
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodDates(period);

    // Fetch current period consultations
    const { data: currentConsultas, error: currentError } = await supabase
      .from('consultas')
      .select('id, consultation_date, consultation_type, status, paciente_id')
      .eq('medico_id', userId)
      .gte('consultation_date', startDate.toISOString())
      .lte('consultation_date', endDate.toISOString());

    if (currentError) throw currentError;

    // Fetch previous period consultations for comparison
    const { data: prevConsultas, error: prevError } = await supabase
      .from('consultas')
      .select('id, consultation_date, consultation_type, status, paciente_id')
      .eq('medico_id', userId)
      .gte('consultation_date', prevStartDate.toISOString())
      .lte('consultation_date', prevEndDate.toISOString());

    if (prevError) throw prevError;

    // Calculate metrics
    const totalConsultas = currentConsultas?.length || 0;
    const prevTotalConsultas = prevConsultas?.length || 0;
    const consultasChange = calculatePercentageChange(totalConsultas, prevTotalConsultas);

    // Note: consultas table doesn't have valor column, using placeholder
    const receitaTotal = 0;
    const prevReceitaTotal = 0;
    const receitaChange = 0;

    const pacientesUnicos = new Set(currentConsultas?.map(c => c.paciente_id)).size;
    const prevPacientesUnicos = new Set(prevConsultas?.map(c => c.paciente_id)).size;
    const pacientesChange = calculatePercentageChange(pacientesUnicos, prevPacientesUnicos);

    // Calculate occupation rate (simplified - would need schedule data for accurate calculation)
    const taxaOcupacao = totalConsultas > 0 ? Math.min((totalConsultas / 100) * 100, 100) : 0;
    const prevTaxaOcupacao = prevTotalConsultas > 0 ? Math.min((prevTotalConsultas / 100) * 100, 100) : 0;
    const ocupacaoChange = calculatePercentageChange(taxaOcupacao, prevTaxaOcupacao);

    return {
      totalConsultas,
      consultasChange,
      receitaTotal,
      receitaChange,
      taxaOcupacao,
      ocupacaoChange,
      pacientesUnicos,
      pacientesChange,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}

/**
 * Fetch upcoming appointments
 */
export async function fetchUpcomingAppointments(
  userId: string,
  limit: number = 5
): Promise<DashboardAppointment[]> {
  try {
    const now = new Date();
    const endOfToday = endOfDay(now);

    const { data, error } = await supabase
      .from('consultas')
      .select(`
        id,
        consultation_date,
        consultation_type,
        status,
        paciente_id,
        patient_name
      `)
      .eq('medico_id', userId)
      .gte('consultation_date', now.toISOString())
      .lte('consultation_date', endOfToday.toISOString())
      .in('status', ['agendada', 'confirmada', 'confirmed', 'pending'])
      .order('consultation_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(appointment => {
      const scheduledTime = new Date(appointment.consultation_date);
      const minutesUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));

      return {
        id: String(appointment.id),
        patientName: appointment.patient_name || 'Paciente',
        patientAvatar: undefined,
        scheduledTime,
        type: appointment.consultation_type === 'teleconsulta' ? 'teleconsulta' : 'presencial',
        status: appointment.status === 'confirmada' || appointment.status === 'confirmed' ? 'confirmed' : 'pending',
        isUrgent: minutesUntil <= 15 && minutesUntil >= 0,
        pacienteId: appointment.paciente_id,
      };
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
}

/**
 * Fetch dashboard alerts
 */
export async function fetchDashboardAlerts(userId: string): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];

  try {
    // Check for pending payments
    const { data: pendingPayments, error: paymentError } = await supabase
      .from('consultas')
      .select('id')
      .eq('medico_id', userId)
      .eq('status_pagamento', 'pendente')
      .gte('consultation_date', new Date().toISOString());

    if (!paymentError && pendingPayments && pendingPayments.length > 0) {
      alerts.push({
        id: 'pending-payments',
        type: 'payment',
        priority: 'high',
        title: 'Pagamentos Pendentes',
        description: `${pendingPayments.length} consulta(s) com pagamento pendente`,
        actionUrl: '/financeiro',
        count: pendingPayments.length,
      });
    }

    // Check for unconfirmed appointments
    const { data: unconfirmed, error: unconfirmedError } = await supabase
      .from('consultas')
      .select('id')
      .eq('medico_id', userId)
      .eq('status', 'pending')
      .gte('consultation_date', new Date().toISOString());

    if (!unconfirmedError && unconfirmed && unconfirmed.length > 0) {
      alerts.push({
        id: 'unconfirmed-appointments',
        type: 'confirmation',
        priority: 'medium',
        title: 'Consultas Aguardando Confirmação',
        description: `${unconfirmed.length} consulta(s) aguardando sua confirmação`,
        actionUrl: '/agenda-medico',
        count: unconfirmed.length,
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error fetching dashboard alerts:', error);
    return alerts;
  }
}

/**
 * Fetch chart data for consultations over time
 */
export async function fetchConsultasChartData(
  userId: string,
  days: number = 7
): Promise<ChartDataPoint[]> {
  try {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    const { data, error } = await supabase
      .from('consultas')
      .select('consultation_date')
      .eq('medico_id', userId)
      .gte('consultation_date', startOfDay(startDate).toISOString())
      .lte('consultation_date', endOfDay(endDate).toISOString());

    if (error) throw error;

    // Group by date
    const dateMap = new Map<string, number>();
    
    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - 1 - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Count consultations per date
    data?.forEach(consulta => {
      const dateStr = consulta.consultation_date.split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    // Convert to array
    return Array.from(dateMap.entries()).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    }));
  } catch (error) {
    console.error('Error fetching consultas chart data:', error);
    throw error;
  }
}

/**
 * Fetch consultation type distribution
 */
export async function fetchConsultationTypeData(
  userId: string,
  period: 'month' | 'year' = 'month'
): Promise<ConsultationTypeData[]> {
  try {
    const { startDate, endDate } = getPeriodDates(period);

    const { data, error } = await supabase
      .from('consultas')
      .select('consultation_type')
      .eq('medico_id', userId)
      .gte('consultation_date', startDate.toISOString())
      .lte('consultation_date', endDate.toISOString());

    if (error) throw error;

    const total = data?.length || 0;
    const presencialCount = data?.filter(c => c.consultation_type === 'presencial').length || 0;
    const teleconsultaCount = total - presencialCount;

    return [
      {
        type: 'presencial',
        count: presencialCount,
        percentage: total > 0 ? Math.round((presencialCount / total) * 100) : 0,
        color: '#3b82f6', // blue
      },
      {
        type: 'teleconsulta',
        count: teleconsultaCount,
        percentage: total > 0 ? Math.round((teleconsultaCount / total) * 100) : 0,
        color: '#10b981', // green
      },
    ];
  } catch (error) {
    console.error('Error fetching consultation type data:', error);
    throw error;
  }
}

/**
 * Helper functions
 */

function getPeriodDates(period: 'today' | 'week' | 'month' | 'year') {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
    case 'week':
      return {
        startDate: subDays(now, 7),
        endDate: now,
      };
    case 'month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case 'year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      };
  }
}

function getPreviousPeriodDates(period: 'today' | 'week' | 'month' | 'year') {
  const now = new Date();
  
  switch (period) {
    case 'today':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    case 'week':
      return {
        startDate: subDays(now, 14),
        endDate: subDays(now, 7),
      };
    case 'month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      };
    case 'year':
      const lastYear = now.getFullYear() - 1;
      return {
        startDate: new Date(lastYear, 0, 1),
        endDate: new Date(lastYear, 11, 31),
      };
  }
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}