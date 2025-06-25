
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
  timezone?: string;
  bufferMinutos?: number; // Buffer entre consultas
}

export interface ExistingAppointment {
  data_consulta: string;
  duracao_minutos: number;
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

// Normalize date to start of day in UTC to avoid timezone issues
export const normalizeToStartOfDay = (dateString: string): Date => {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date;
};

// Convert appointment datetime to time string in consistent timezone
export const extractTimeFromAppointment = (appointment: ExistingAppointment): { startTime: string; endTime: string } => {
  const appointmentDate = new Date(appointment.data_consulta);
  
  // Extract time in HH:MM format
  const startTime = `${appointmentDate.getUTCHours().toString().padStart(2, '0')}:${appointmentDate.getUTCMinutes().toString().padStart(2, '0')}`;
  
  // Calculate end time based on duration
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + appointment.duracao_minutos;
  const endTime = minutesToTime(endMinutes);
  
  return { startTime, endTime };
};

// Check if a time slot conflicts with existing appointments considering duration
export const hasTimeConflict = (
  slotTime: string,
  slotDuration: number,
  existingAppointments: ExistingAppointment[]
): boolean => {
  const slotStartMinutes = timeToMinutes(slotTime);
  const slotEndMinutes = slotStartMinutes + slotDuration;
  
  return existingAppointments.some(appointment => {
    const { startTime, endTime } = extractTimeFromAppointment(appointment);
    const appointmentStartMinutes = timeToMinutes(startTime);
    const appointmentEndMinutes = timeToMinutes(endTime);
    
    // Check for overlap: slot starts before appointment ends AND slot ends after appointment starts
    return (
      slotStartMinutes < appointmentEndMinutes && 
      slotEndMinutes > appointmentStartMinutes
    );
  });
};

// Generate time slots based on doctor's working hours and consultation duration
export const generateTimeSlots = (
  doctorConfig: DoctorConfig,
  selectedDate: Date,
  existingAppointments: ExistingAppointment[] = []
): TimeSlot[] => {
  const dayName = getDayName(selectedDate);
  const workingHours = doctorConfig.horarioAtendimento;
  const consultationDuration = doctorConfig.duracaoConsulta || 30;
  const bufferMinutes = doctorConfig.bufferMinutos || 0;
  
  // If no working hours configured or day is not active, return empty array
  if (!workingHours || !workingHours[dayName] || !workingHours[dayName].ativo) {
    return [];
  }
  
  const { inicio, fim } = workingHours[dayName];
  const startMinutes = timeToMinutes(inicio);
  const endMinutes = timeToMinutes(fim);
  
  const slots: TimeSlot[] = [];
  
  // Generate slots from start to end time with consultation duration + buffer intervals
  const slotInterval = consultationDuration + bufferMinutes;
  
  for (let minutes = startMinutes; minutes + consultationDuration <= endMinutes; minutes += slotInterval) {
    const timeString = minutesToTime(minutes);
    
    // Check for conflicts with existing appointments
    const hasConflict = hasTimeConflict(timeString, consultationDuration, existingAppointments);
    
    // Only add slot if it doesn't conflict and there's enough time for the full consultation
    if (minutes + consultationDuration <= endMinutes) {
      slots.push({
        time: timeString,
        available: !hasConflict
      });
    }
  }
  
  return slots;
};

// Validate doctor configuration
export const validateDoctorConfig = (config: DoctorConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.horarioAtendimento) {
    errors.push('Horários de atendimento não configurados');
  }
  
  if (!config.duracaoConsulta || config.duracaoConsulta < 15 || config.duracaoConsulta > 180) {
    errors.push('Duração da consulta deve estar entre 15 e 180 minutos');
  }
  
  // Validate working hours
  if (config.horarioAtendimento) {
    Object.entries(config.horarioAtendimento).forEach(([day, hours]) => {
      if (hours.ativo) {
        const startMinutes = timeToMinutes(hours.inicio);
        const endMinutes = timeToMinutes(hours.fim);
        
        if (startMinutes >= endMinutes) {
          errors.push(`Horário inválido para ${day}: início deve ser antes do fim`);
        }
        
        if (endMinutes - startMinutes < (config.duracaoConsulta || 30)) {
          errors.push(`Horário insuficiente para ${day}: período menor que duração da consulta`);
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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
