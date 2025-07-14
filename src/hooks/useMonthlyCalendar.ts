import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CalendarEvent {
  id: string;
  date: Date;
  type: 'consultation' | 'medication';
  title: string;
  description?: string;
  time?: string;
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  hasConsultation: boolean;
  hasMedication: boolean;
  events: CalendarEvent[];
}

export const useMonthlyCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Buscar consultas do mês
      const { data: consultations, error: consultError } = await supabase
        .from('consultas')
        .select(`
          id,
          data_consulta,
          tipo_consulta,
          status,
          doctor_profile:profiles!consultas_medico_id_fkey (display_name)
        `)
        .eq('paciente_id', user.id)
        .gte('data_consulta', monthStart.toISOString())
        .lte('data_consulta', monthEnd.toISOString())
        .in('status', ['agendada', 'confirmada']);

      if (consultError) throw consultError;

      // Buscar lembretes de medicamentos ativos do mês
      const { data: medications, error: medError } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('start_date', monthEnd.toISOString().split('T')[0])
        .or(`end_date.is.null,end_date.gte.${monthStart.toISOString().split('T')[0]}`);

      if (medError) throw medError;

      // Processar eventos
      const calendarEvents: CalendarEvent[] = [];

      // Adicionar consultas
      consultations?.forEach(consultation => {
        const consultDate = new Date(consultation.data_consulta);
        calendarEvents.push({
          id: consultation.id,
          date: consultDate,
          type: 'consultation',
          title: consultation.tipo_consulta || 'Consulta Médica',
          description: consultation.doctor_profile?.display_name || 'Médico',
          time: format(consultDate, 'HH:mm')
        });
      });

      // Adicionar medicamentos (apenas para cada dia do mês)
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      medications?.forEach(medication => {
        const medStartDate = new Date(medication.start_date);
        const medEndDate = medication.end_date ? new Date(medication.end_date) : null;

        monthDays.forEach(day => {
          if (day >= medStartDate && (!medEndDate || day <= medEndDate)) {
            // Verificar se já não existe um evento de medicamento para este dia
            const existingMedEvent = calendarEvents.find(
              event => event.type === 'medication' && isSameDay(event.date, day)
            );

            if (!existingMedEvent) {
              calendarEvents.push({
                id: `${medication.id}-${format(day, 'yyyy-MM-dd')}`,
                date: day,
                type: 'medication',
                title: 'Lembrete de Medicamento',
                description: medication.medication_name
              });
            }
          }
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Erro ao buscar dados do calendário:', error);
      setError('Erro ao carregar dados da agenda');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados da agenda'
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentDate, toast]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  const generateCalendarDays = useCallback((): CalendarDay[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay()); // Começar no domingo

    const days: CalendarDay[] = [];
    const totalDays = 42; // 6 semanas × 7 dias

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayEvents = events.filter(event => isSameDay(event.date, date));
      const hasConsultation = dayEvents.some(event => event.type === 'consultation');
      const hasMedication = dayEvents.some(event => event.type === 'medication');

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        hasConsultation,
        hasMedication,
        events: dayEvents
      });
    }

    return days;
  }, [currentDate, events]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthYear = () => {
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  };

  return {
    currentDate,
    events,
    loading,
    error,
    calendarDays: generateCalendarDays(),
    navigateMonth,
    goToToday,
    getMonthYear,
    refetch: fetchMonthData
  };
};