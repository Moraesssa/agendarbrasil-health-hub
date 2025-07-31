
// --- Interfaces e Tipos ---
export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DayWorkingHours {
  inicio: string;
  fim: string;
  ativo: boolean;
  inicioAlmoco?: string;
  fimAlmoco?: string;
}

export interface WorkingHours {
  [key: string]: DayWorkingHours[];
}

export interface DoctorConfig {
  duracaoConsulta?: number;
  horarioAtendimento?: WorkingHours;
  bufferMinutos?: number;
}

export interface ExistingAppointment {
  data_consulta: string;
  duracao_minutos: number;
}


// --- Funções Auxiliares de Tempo ---
export const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getDayName = (date: Date): string => {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[date.getUTCDay()];
};

export const normalizeToStartOfDay = (dateString: string): Date => {
  return new Date(`${dateString}T00:00:00.000Z`);
};

export const extractTimeFromAppointment = (appointment: ExistingAppointment): { startMinutes: number; endMinutes: number } => {
  const appointmentDate = new Date(appointment.data_consulta);
  const startMinutes = appointmentDate.getUTCHours() * 60 + appointmentDate.getUTCMinutes();
  const endMinutes = startMinutes + (appointment.duracao_minutos || 30);
  return { startMinutes, endMinutes };
};


// --- Validação e Lógica Principal ---

export const validateDoctorConfig = (config: DoctorConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!config.horarioAtendimento) {
        errors.push('Horários de atendimento não configurados.');
    }
    if (!config.duracaoConsulta || config.duracaoConsulta < 15) {
        errors.push('Duração da consulta deve ser de pelo menos 15 minutos.');
    }
    return { isValid: errors.length === 0, errors };
};

export const getDefaultWorkingHours = (): WorkingHours => ({
  segunda: [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
  terca:   [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
  quarta:  [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
  quinta:  [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
  sexta:   [{ inicio: '08:00', fim: '18:00', ativo: true, inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
  sabado:  [{ inicio: '08:00', fim: '12:00', ativo: false }],
  domingo: [{ inicio: '08:00', fim: '12:00', ativo: false }]
});

export const generateTimeSlots = (
  doctorConfig: DoctorConfig,
  selectedDate: Date,
  existingAppointments: ExistingAppointment[] = []
): TimeSlot[] => {
  const dayName = getDayName(selectedDate);
  const workingHoursBlocks = doctorConfig.horarioAtendimento?.[dayName] || [];

  console.log("🔧 generateTimeSlots - Entrada:", {
    dayName,
    workingHoursBlocksCount: workingHoursBlocks.length,
    workingHoursBlocks,
    selectedDate: selectedDate.toISOString(),
    existingAppointmentsCount: existingAppointments.length
  });

  if (!workingHoursBlocks.length) {
    console.log("❌ generateTimeSlots - Nenhum bloco de horário encontrado para", dayName);
    return [];
  }

  const consultationDuration = doctorConfig.duracaoConsulta || 30;
  const bufferMinutes = doctorConfig.bufferMinutos || 0;
  const slotInterval = consultationDuration + bufferMinutes;

  const occupiedSlots = existingAppointments.map(extractTimeFromAppointment);
  const slots: TimeSlot[] = [];

  // Processar cada bloco de horário
  for (const workingHours of workingHoursBlocks) {
    if (!workingHours.ativo) continue;

    const startMinutes = timeToMinutes(workingHours.inicio);
    const endMinutes = timeToMinutes(workingHours.fim);
    const lunchStartMinutes = workingHours.inicioAlmoco ? timeToMinutes(workingHours.inicioAlmoco) : null;
    const lunchEndMinutes = workingHours.fimAlmoco ? timeToMinutes(workingHours.fimAlmoco) : null;

    for (let minutes = startMinutes; (minutes + consultationDuration) <= endMinutes; minutes += slotInterval) {
      const slotStart = minutes;
      const slotEnd = slotStart + consultationDuration;

      // Pula os horários que caem dentro do intervalo de almoço
      if (lunchStartMinutes && lunchEndMinutes && slotStart < lunchEndMinutes && slotEnd > lunchStartMinutes) {
        continue;
      }
      
      // Verifica conflitos com agendamentos existentes
      const isOccupied = occupiedSlots.some(
        ({ startMinutes, endMinutes }) => slotStart < endMinutes && slotEnd > startMinutes
      );

      if (!isOccupied) {
        slots.push({
          time: minutesToTime(minutes),
          available: true
        });
      }
    }
  }

  console.log("✅ generateTimeSlots - Resultado:", {
    slotsCount: slots.length,
    sampleSlots: slots.slice(0, 5)
  });

  return slots;
};
