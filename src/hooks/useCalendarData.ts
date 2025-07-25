
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { medicationService } from '@/services/medicationService';
import { useConsultas } from '@/hooks/useConsultas';
import { MedicationDose } from '@/types/medication';

export interface CalendarDay {
  day: number;
  hasAppointment: boolean;
  hasMedication: boolean;
  appointmentStatus?: string;
  appointmentCount: number;
}

export const useCalendarData = () => {
  const { user } = useAuth();
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const { consultas: consultasDoMes } = useConsultas({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  });

  useEffect(() => {
    const loadCalendarData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get all medication doses for the current month in a single optimized query
        let monthlyMedications: { [key: string]: MedicationDose[] } = {};
        
        try {
          // Create a map of dates to medication doses for efficient lookup
          const startDate = new Date(year, month, 1).toISOString().split('T')[0];
          const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
          
          // Get all doses for the month (we'll need to modify medicationService for this)
          const monthDoses = await getMedicationDosesForMonth(startDate, endDate);
          
          // Group doses by date
          monthDoses.forEach(dose => {
            if (!monthlyMedications[dose.scheduled_date]) {
              monthlyMedications[dose.scheduled_date] = [];
            }
            monthlyMedications[dose.scheduled_date].push(dose);
          });
        } catch (medicationError) {
          console.warn('Failed to load medication data, calendar will show without medications:', medicationError);
          // Continue without medication data - don't let this break the calendar
        }
        
        // Build calendar data (35 days for calendar grid)
        const newCalendarData: CalendarDay[] = Array.from({ length: 35 }, (_, i) => {
          const day = i - 6; // Adjust for calendar grid starting position
          
          if (day < 1 || day > daysInMonth) {
            return {
              day,
              hasAppointment: false,
              hasMedication: false,
              appointmentCount: 0
            };
          }

          // Check appointments for this day
          const dayAppointments = consultasDoMes.filter(consulta => {
            const consultaDate = new Date(consulta.data_consulta);
            return consultaDate.getDate() === day;
          });

          // Check medications for this day
          const dateString = new Date(year, month, day).toISOString().split('T')[0];
          const dayMedications = monthlyMedications[dateString] || [];
          
          return {
            day,
            hasAppointment: dayAppointments.length > 0,
            hasMedication: dayMedications.length > 0,
            appointmentStatus: dayAppointments.length > 0 ? dayAppointments[0].status : undefined,
            appointmentCount: dayAppointments.length
          };
        });

        setCalendarData(newCalendarData);
      } catch (error) {
        console.error('Error loading calendar data:', error);
        // Even if there's an error, show calendar with just appointments
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const fallbackCalendarData: CalendarDay[] = Array.from({ length: 35 }, (_, i) => {
          const day = i - 6;
          
          if (day < 1 || day > daysInMonth) {
            return {
              day,
              hasAppointment: false,
              hasMedication: false,
              appointmentCount: 0
            };
          }

          // Only show appointments, skip medications on error
          const dayAppointments = consultasDoMes.filter(consulta => {
            const consultaDate = new Date(consulta.data_consulta);
            return consultaDate.getDate() === day;
          });
          
          return {
            day,
            hasAppointment: dayAppointments.length > 0,
            hasMedication: false, // Skip medications on error
            appointmentStatus: dayAppointments.length > 0 ? dayAppointments[0].status : undefined,
            appointmentCount: dayAppointments.length
          };
        });
        
        setCalendarData(fallbackCalendarData);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [user, consultasDoMes, currentDate]);

  return {
    calendarData,
    loading
  };
};

// Helper function to get medication doses for a month range
async function getMedicationDosesForMonth(startDate: string, endDate: string): Promise<MedicationDose[]> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('medication_doses')
    .select(`
      *,
      medication_reminders!inner(
        user_id,
        medication_name,
        dosage,
        is_active
      )
    `)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .eq('medication_reminders.user_id', user.id)
    .eq('medication_reminders.is_active', true)
    .order('scheduled_date')
    .order('scheduled_time');

  if (error) {
    console.error('Error fetching monthly medication doses:', error);
    throw error;
  }

  return (data || []).map((dose: any) => ({
    ...dose,
    status: dose.status as MedicationDose['status']
  }));
}
