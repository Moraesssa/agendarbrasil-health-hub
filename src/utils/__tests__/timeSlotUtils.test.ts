import { describe, expect, it } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  getDayName,
  normalizeToStartOfDay,
  extractTimeFromAppointment,
  validateDoctorConfig,
  getDefaultWorkingHours,
  generateTimeSlots,
  type DoctorConfig,
  type ExistingAppointment,
} from '@/utils/timeSlotUtils';

// ==================== timeToMinutes ====================
describe('timeToMinutes', () => {
  it('converts 00:00 to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('converts 08:30 to 510', () => {
    expect(timeToMinutes('08:30')).toBe(510);
  });

  it('converts 23:59 to 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('returns 0 for empty string', () => {
    expect(timeToMinutes('')).toBe(0);
  });

  it('returns 0 for invalid string', () => {
    expect(timeToMinutes('not-a-time')).toBe(0);
  });
});

// ==================== minutesToTime ====================
describe('minutesToTime', () => {
  it('converts 0 to 00:00', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('converts 510 to 08:30', () => {
    expect(minutesToTime(510)).toBe('08:30');
  });

  it('converts 1439 to 23:59', () => {
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('pads single digit hours and minutes', () => {
    expect(minutesToTime(65)).toBe('01:05');
  });
});

// ==================== getDayName ====================
describe('getDayName', () => {
  it('returns domingo for Sunday', () => {
    // 2024-01-07 is a Sunday
    expect(getDayName(new Date('2024-01-07T12:00:00Z'))).toBe('domingo');
  });

  it('returns segunda for Monday', () => {
    expect(getDayName(new Date('2024-01-08T12:00:00Z'))).toBe('segunda');
  });

  it('returns sexta for Friday', () => {
    expect(getDayName(new Date('2024-01-12T12:00:00Z'))).toBe('sexta');
  });

  it('returns sabado for Saturday', () => {
    expect(getDayName(new Date('2024-01-13T12:00:00Z'))).toBe('sabado');
  });
});

// ==================== normalizeToStartOfDay ====================
describe('normalizeToStartOfDay', () => {
  it('normalizes to midnight UTC', () => {
    const result = normalizeToStartOfDay('2024-01-15');
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });
});

// ==================== extractTimeFromAppointment ====================
describe('extractTimeFromAppointment', () => {
  it('extracts start and end minutes from appointment', () => {
    const appointment: ExistingAppointment = {
      data_consulta: '2024-01-15T10:30:00Z',
      duracao_minutos: 30,
    };
    const result = extractTimeFromAppointment(appointment);
    expect(result.startMinutes).toBe(630); // 10*60 + 30
    expect(result.endMinutes).toBe(660);   // 630 + 30
  });

  it('uses default 30 min duration when not specified', () => {
    const appointment: ExistingAppointment = {
      data_consulta: '2024-01-15T08:00:00Z',
      duracao_minutos: 0,
    };
    const result = extractTimeFromAppointment(appointment);
    expect(result.startMinutes).toBe(480);
    expect(result.endMinutes).toBe(510); // 480 + 30 (default)
  });
});

// ==================== validateDoctorConfig ====================
describe('validateDoctorConfig', () => {
  it('passes with valid config', () => {
    const config: DoctorConfig = {
      duracaoConsulta: 30,
      horarioAtendimento: getDefaultWorkingHours(),
    };
    const result = validateDoctorConfig(config);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails without horarioAtendimento', () => {
    const config: DoctorConfig = { duracaoConsulta: 30 };
    const result = validateDoctorConfig(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Horários de atendimento não configurados.');
  });

  it('fails with consultation duration under 15 min', () => {
    const config: DoctorConfig = {
      duracaoConsulta: 10,
      horarioAtendimento: getDefaultWorkingHours(),
    };
    const result = validateDoctorConfig(config);
    expect(result.isValid).toBe(false);
  });

  it('fails with zero consultation duration', () => {
    const config: DoctorConfig = {
      duracaoConsulta: 0,
      horarioAtendimento: getDefaultWorkingHours(),
    };
    expect(validateDoctorConfig(config).isValid).toBe(false);
  });
});

// ==================== getDefaultWorkingHours ====================
describe('getDefaultWorkingHours', () => {
  it('returns all 7 days', () => {
    const hours = getDefaultWorkingHours();
    expect(Object.keys(hours)).toHaveLength(7);
    expect(hours).toHaveProperty('segunda');
    expect(hours).toHaveProperty('domingo');
  });

  it('weekdays are active', () => {
    const hours = getDefaultWorkingHours();
    expect(hours.segunda[0].ativo).toBe(true);
    expect(hours.sexta[0].ativo).toBe(true);
  });

  it('weekends are inactive', () => {
    const hours = getDefaultWorkingHours();
    expect(hours.sabado[0].ativo).toBe(false);
    expect(hours.domingo[0].ativo).toBe(false);
  });
});

// ==================== generateTimeSlots ====================
describe('generateTimeSlots', () => {
  const baseConfig: DoctorConfig = {
    duracaoConsulta: 30,
    horarioAtendimento: {
      segunda: [{ inicio: '08:00', fim: '12:00', ativo: true }],
      terca: [{ inicio: '08:00', fim: '12:00', ativo: true }],
      quarta: [{ inicio: '08:00', fim: '12:00', ativo: true }],
      quinta: [{ inicio: '08:00', fim: '12:00', ativo: true }],
      sexta: [{ inicio: '08:00', fim: '12:00', ativo: true }],
      sabado: [{ inicio: '08:00', fim: '12:00', ativo: false }],
      domingo: [{ inicio: '08:00', fim: '12:00', ativo: false }],
    },
  };

  // Monday 2024-01-08
  const monday = new Date('2024-01-08T00:00:00Z');

  it('generates correct number of 30-min slots for 4-hour window', () => {
    const slots = generateTimeSlots(baseConfig, monday);
    // 08:00-12:00 = 8 slots of 30 min
    expect(slots).toHaveLength(8);
  });

  it('all generated slots are marked available', () => {
    const slots = generateTimeSlots(baseConfig, monday);
    expect(slots.every(s => s.available)).toBe(true);
  });

  it('returns empty for inactive day', () => {
    // Sunday 2024-01-07
    const sunday = new Date('2024-01-07T00:00:00Z');
    const slots = generateTimeSlots(baseConfig, sunday);
    expect(slots).toHaveLength(0);
  });

  it('excludes slots conflicting with existing appointments', () => {
    const existing: ExistingAppointment[] = [
      { data_consulta: '2024-01-08T09:00:00Z', duracao_minutos: 30 },
    ];
    const slots = generateTimeSlots(baseConfig, monday, existing);
    const nineOClock = slots.find(s => s.time === '09:00');
    expect(nineOClock).toBeUndefined();
  });

  it('skips lunch break slots', () => {
    const configWithLunch: DoctorConfig = {
      duracaoConsulta: 30,
      horarioAtendimento: {
        segunda: [{
          inicio: '08:00', fim: '14:00', ativo: true,
          inicioAlmoco: '12:00', fimAlmoco: '13:00',
        }],
        terca: [{ inicio: '08:00', fim: '12:00', ativo: true }],
        quarta: [{ inicio: '08:00', fim: '12:00', ativo: true }],
        quinta: [{ inicio: '08:00', fim: '12:00', ativo: true }],
        sexta: [{ inicio: '08:00', fim: '12:00', ativo: true }],
        sabado: [{ inicio: '08:00', fim: '12:00', ativo: false }],
        domingo: [{ inicio: '08:00', fim: '12:00', ativo: false }],
      },
    };
    const slots = generateTimeSlots(configWithLunch, monday);
    const lunchSlot = slots.find(s => s.time === '12:00' || s.time === '12:30');
    expect(lunchSlot).toBeUndefined();
  });

  it('uses buffer minutes between slots', () => {
    const configWithBuffer: DoctorConfig = {
      ...baseConfig,
      bufferMinutos: 10,
    };
    const slots = generateTimeSlots(configWithBuffer, monday);
    // 30+10=40 min interval: 08:00, 08:40, 09:20, 10:00, 10:40, 11:20
    expect(slots).toHaveLength(6);
  });

  it('returns empty when no config exists', () => {
    const emptyConfig: DoctorConfig = { duracaoConsulta: 30 };
    const slots = generateTimeSlots(emptyConfig, monday);
    expect(slots).toHaveLength(0);
  });
});
