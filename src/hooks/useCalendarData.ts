
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
        
        // Get medication doses for the entire month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Create promises for all days in the month
        const medicationPromises = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dateString = date.toISOString().split('T')[0];
          return medicationService.getDosesForDate(dateString);
        });

        // Wait for all medication queries to complete
        const medicationResults = await Promise.all(medicationPromises);
        
        // Build calendar data
        const newCalendarData: CalendarDay[] = Array.from({ length: 35 }, (_, i) => {
          const day = i - 6; // Adjust for calendar grid
          
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
          const dayMedications = medicationResults[day - 1] || [];
          
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
