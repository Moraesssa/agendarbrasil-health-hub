// Utility functions for calculating available time slots

export interface TimeSlot {
  time: string;
  available: boolean;
}

// **MODIFICADO:** Adicionado suporte para intervalo de almoço
export interface DayWorkingHours {
  inicio: string;
  fim: string;
  ativo: boolean;
  inicioAlmoco?: string;
  fimAlmoco?: string;
}

export interface WorkingHours {
  [key: string]: DayWorkingHours;
}

export interface DoctorConfig {
  duracaoConsulta?: number;
  horarioAtendimento?: WorkingHours;
  timezone?: string;
  bufferMinutos?: number;
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
  const startTime = `${appointmentDate.getUTCHours().toString().padStart(2, '0')}:${appointmentDate.getUTCMinutes().toString().padStart(2, '0')}`;
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
    
    return (
      slotStartMinutes < appointmentEndMinutes && 
      slotEndMinutes > appointmentStartMinutes
    );
  });
};

// **MODIFICADO:** A lógica agora suporta intervalos de almoço
export const generateTimeSlots = (
  doctorConfig: DoctorConfig,
  selectedDate: Date,
  existingAppointments: ExistingAppointment[] = []
): TimeSlot[] => {
  const dayName = getDayName(selectedDate);
  const workingHours = doctorConfig.horarioAtendimento;
  const consultationDuration = doctorConfig.duracaoConsulta || 30;
  const bufferMinutes = doctorConfig.bufferMinutos || 0;
  
  if (!workingHours || !workingHours[dayName] || !workingHours[dayName].ativo) {
    return [];
  }
  
  const { inicio, fim, inicioAlmoco, fimAlmoco } = workingHours[dayName];
  const startMinutes = timeToMinutes(inicio);
  const endMinutes = timeToMinutes(fim);
  const lunchStartMinutes = inicioAlmoco ? timeToMinutes(inicioAlmoco) : null;
  const lunchEndMinutes = fimAlmoco ? timeToMinutes(fimAlmoco) : null;

  const slots: TimeSlot[] = [];
  const slotInterval = consultationDuration + bufferMinutes;

  for (let minutes = startMinutes; minutes + consultationDuration <= endMinutes; minutes += slotInterval) {
    // Pula os horários que caem dentro do intervalo de almoço
    if (lunchStartMinutes && lunchEndMinutes && minutes >= lunchStartMinutes && minutes < lunchEndMinutes) {
      continue;
    }

    const timeString = minutesToTime(minutes);
    const hasConflict = hasTimeConflict(timeString, consultationDuration, existingAppointments);
    
    slots.push({
      time: timeString,
      available: !hasConflict
    });
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
  return {
    isValid: errors.length === 0,
    errors
  };
};

// **MODIFICADO:** Horários padrão agora vão até 18:00 com intervalo de almoço
export const getDefaultWorkingHours = (): WorkingHours => ({
  segunda: { inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '14:00' },
  terca:   { inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '14:00' },
  quarta:  { inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '14:00' },
  quinta:  { inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '14:00' },
  sexta:   { inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '14:00' },
  sabado:  { inicio: '08:00', fim: '12:00', ativo: true },
  domingo: { inicio: '08:00', fim: '12:00', ativo: false }
});