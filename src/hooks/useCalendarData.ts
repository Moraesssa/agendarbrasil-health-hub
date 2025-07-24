
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultas } from '@/hooks/useConsultas';

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
  const { consultas: consultasDoMes, loading: consultasLoading } = useConsultas({
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
        
        // Build calendar data (35 days for calendar grid) - focusing only on appointments for now
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
          
          return {
            day,
            hasAppointment: dayAppointments.length > 0,
            hasMedication: false, // Temporarily disabled to fix loading issues
            appointmentStatus: dayAppointments.length > 0 ? dayAppointments[0].status : undefined,
            appointmentCount: dayAppointments.length
          };
        });

        setCalendarData(newCalendarData);
      } catch (error) {
        console.error('Error loading calendar data:', error);
        // Create fallback calendar with just basic structure
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const fallbackCalendarData: CalendarDay[] = Array.from({ length: 35 }, (_, i) => {
          const day = i - 6;
          
          return {
            day,
            hasAppointment: false,
            hasMedication: false,
            appointmentCount: 0
          };
        });
        
        setCalendarData(fallbackCalendarData);
      } finally {
        setLoading(false);
      }
    };

    // Only load calendar data when consultas are ready or failed to load
    if (!consultasLoading) {
      loadCalendarData();
    }

    // Listen for consultation updates
    const handleConsultaUpdate = () => {
      if (!consultasLoading) {
        loadCalendarData();
      }
    };

    window.addEventListener('consultaUpdated', handleConsultaUpdate);
    return () => window.removeEventListener('consultaUpdated', handleConsultaUpdate);
  }, [user, consultasDoMes, consultasLoading, currentDate]);

  return {
    calendarData,
    loading: loading || consultasLoading
  };
};
