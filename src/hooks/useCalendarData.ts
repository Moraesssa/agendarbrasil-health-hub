

import { useState, useEffect, useMemo } from 'react';
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
  
  // Memoize current date to prevent infinite re-renders
  const currentDate = useMemo(() => new Date(), []);
  
  // Stabilize the consultas filters to prevent infinite loops
  const consultasFilters = useMemo(() => ({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  }), [currentDate]);
  
  const { consultas: consultasDoMes, loading: consultasLoading } = useConsultas(consultasFilters);

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
          const dayAppointments = Array.isArray(consultasDoMes) 
            ? consultasDoMes.filter(consulta => {
                if (!consulta || !consulta.consultation_date) return false;
                try {
                  const consultaDate = new Date(consulta.consultation_date);
                  return consultaDate.getDate() === day;
                } catch (error) {
                  console.error('Error parsing consultation date:', error);
                  return false;
                }
              })
            : [];
          
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
  }, [user, consultasLoading, consultasDoMes, currentDate]); // Added consultasDoMes back as stable dependency

  return {
    calendarData,
    loading: loading || consultasLoading
  };
};

