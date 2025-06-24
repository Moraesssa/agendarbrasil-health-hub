
// Utility functions for calculating available time slots

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface WorkingHours {
  [key: string]: { inicio: string; fim: string; ativo: boolean };
}

export interface DoctorConfig {
  duracaoConsulta?: number;
  horarioAtendimento?: WorkingHours;
}

// Convert time string (HH:MM) to minutes since midnight
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert minutes since midnight to time string (HH:MM)
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Get day name in Portuguese for the given date
export const getDayName = (date: Date): string => {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[date.getDay()];
};

// Generate time slots based on doctor's working hours and consultation duration
export const generateTimeSlots = (
  doctorConfig: DoctorConfig,
  selectedDate: Date,
  existingAppointments: string[] = []
): TimeSlot[] => {
  const dayName = getDayName(selectedDate);
  const workingHours = doctorConfig.horarioAtendimento;
  const consultationDuration = doctorConfig.duracaoConsulta || 30;
  
  // If no working hours configured or day is not active, return empty array
  if (!workingHours || !workingHours[dayName] || !workingHours[dayName].ativo) {
    return [];
  }
  
  const { inicio, fim } = workingHours[dayName];
  const startMinutes = timeToMinutes(inicio);
  const endMinutes = timeToMinutes(fim);
  
  const slots: TimeSlot[] = [];
  
  // Generate slots from start to end time with consultation duration intervals
  for (let minutes = startMinutes; minutes < endMinutes; minutes += consultationDuration) {
    const timeString = minutesToTime(minutes);
    const isOccupied = existingAppointments.includes(timeString);
    
    slots.push({
      time: timeString,
      available: !isOccupied
    });
  }
  
  return slots;
};

// Default working hours if doctor hasn't configured them
export const getDefaultWorkingHours = (): WorkingHours => ({
  segunda: { inicio: '08:00', fim: '17:00', ativo: true },
  terca: { inicio: '08:00', fim: '17:00', ativo: true },
  quarta: { inicio: '08:00', fim: '17:00', ativo: true },
  quinta: { inicio: '08:00', fim: '17:00', ativo: true },
  sexta: { inicio: '08:00', fim: '17:00', ativo: true },
  sabado: { inicio: '08:00', fim: '12:00', ativo: true },
  domingo: { inicio: '08:00', fim: '12:00', ativo: false }
});
