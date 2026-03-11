import { describe, expect, it, beforeEach } from 'vitest';
import {
  validateCPF,
  validatePhone,
  sanitizeInput,
  validateEmail,
  validateDate,
  validateCEP,
  validateNumericRange,
  validateTimeFormat,
  sanitizeNumericInput,
  validateUF,
  checkRateLimit,
  rateLimitMap,
  createSecureErrorResponse,
  validateAppointmentData,
  validatePaymentData,
  validateProfileData,
} from '@/utils/validation';

// ==================== CPF ====================
describe('validateCPF', () => {
  it('accepts a valid CPF', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('accepts CPF without formatting', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('rejects CPF with all same digits', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
    expect(validateCPF('000.000.000-00')).toBe(false);
  });

  it('rejects CPF with wrong length', () => {
    expect(validateCPF('1234')).toBe(false);
    expect(validateCPF('123456789012')).toBe(false);
  });

  it('rejects CPF with invalid check digits', () => {
    expect(validateCPF('529.982.247-26')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateCPF('')).toBe(false);
  });
});

// ==================== Phone ====================
describe('validatePhone', () => {
  it('accepts 10-digit phone (landline)', () => {
    expect(validatePhone('1133334444')).toBe(true);
  });

  it('accepts 11-digit phone (mobile)', () => {
    expect(validatePhone('11999998888')).toBe(true);
  });

  it('accepts formatted phone', () => {
    expect(validatePhone('(11) 99999-8888')).toBe(true);
  });

  it('rejects phone with wrong length', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('123456789012')).toBe(false);
  });
});

// ==================== sanitizeInput ====================
describe('sanitizeInput', () => {
  it('removes script tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('removes angle brackets', () => {
    expect(sanitizeInput('<div>text</div>')).toBe('divtext/div');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

// ==================== Email ====================
describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

// ==================== Date ====================
describe('validateDate', () => {
  it('accepts valid past date', () => {
    expect(validateDate('2020-01-01')).toBe(true);
  });

  it('rejects future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(validateDate(futureDate.toISOString())).toBe(false);
  });

  it('rejects invalid date string', () => {
    expect(validateDate('not-a-date')).toBe(false);
  });
});

// ==================== CEP ====================
describe('validateCEP', () => {
  it('accepts valid CEP', () => {
    expect(validateCEP('01001-000')).toBe(true);
    expect(validateCEP('01001000')).toBe(true);
  });

  it('rejects CEP with wrong length', () => {
    expect(validateCEP('1234')).toBe(false);
    expect(validateCEP('123456789')).toBe(false);
  });
});

// ==================== Numeric Range ====================
describe('validateNumericRange', () => {
  it('accepts value within range', () => {
    expect(validateNumericRange(5, 1, 10)).toBe(true);
  });

  it('accepts boundary values', () => {
    expect(validateNumericRange(1, 1, 10)).toBe(true);
    expect(validateNumericRange(10, 1, 10)).toBe(true);
  });

  it('rejects value outside range', () => {
    expect(validateNumericRange(0, 1, 10)).toBe(false);
    expect(validateNumericRange(11, 1, 10)).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateNumericRange(NaN, 1, 10)).toBe(false);
  });
});

// ==================== Time Format ====================
describe('validateTimeFormat', () => {
  it('accepts HH:MM format', () => {
    expect(validateTimeFormat('08:30')).toBe(true);
    expect(validateTimeFormat('23:59')).toBe(true);
    expect(validateTimeFormat('0:00')).toBe(true);
  });

  it('rejects invalid hours', () => {
    expect(validateTimeFormat('25:00')).toBe(false);
  });

  it('rejects invalid minutes', () => {
    expect(validateTimeFormat('12:60')).toBe(false);
  });

  it('rejects non-time strings', () => {
    expect(validateTimeFormat('hello')).toBe(false);
  });
});

// ==================== sanitizeNumericInput ====================
describe('sanitizeNumericInput', () => {
  it('keeps digits, commas and dots', () => {
    expect(sanitizeNumericInput('R$ 1.234,56')).toBe('1.234,56');
  });

  it('removes letters and symbols', () => {
    expect(sanitizeNumericInput('abc!@#123')).toBe('123');
  });
});

// ==================== UF ====================
describe('validateUF', () => {
  it('accepts valid UFs', () => {
    expect(validateUF('SP')).toBe(true);
    expect(validateUF('RJ')).toBe(true);
    expect(validateUF('MG')).toBe(true);
  });

  it('accepts lowercase UF', () => {
    expect(validateUF('sp')).toBe(true);
  });

  it('rejects invalid UF', () => {
    expect(validateUF('XX')).toBe(false);
    expect(validateUF('')).toBe(false);
  });
});

// ==================== Rate Limiting ====================
describe('checkRateLimit', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it('allows first request', () => {
    expect(checkRateLimit('user1', 3, 60000)).toBe(true);
  });

  it('allows requests under limit', () => {
    expect(checkRateLimit('user2', 3, 60000)).toBe(true);
    expect(checkRateLimit('user2', 3, 60000)).toBe(true);
    expect(checkRateLimit('user2', 3, 60000)).toBe(true);
  });

  it('blocks requests over limit', () => {
    checkRateLimit('user3', 2, 60000);
    checkRateLimit('user3', 2, 60000);
    expect(checkRateLimit('user3', 2, 60000)).toBe(false);
  });
});

// ==================== Secure Error Response ====================
describe('createSecureErrorResponse', () => {
  it('returns generic message in production', () => {
    const result = createSecureErrorResponse(new Error('database crashed'), false);
    expect(result).toBe('An unexpected error occurred');
  });

  it('returns actual message in development', () => {
    const result = createSecureErrorResponse(new Error('database crashed'), true);
    expect(result).toBe('database crashed');
  });

  it('categorizes validation errors', () => {
    const result = createSecureErrorResponse(new Error('validation failed'), false);
    expect(result).toBe('Invalid input provided');
  });

  it('categorizes auth errors', () => {
    const result = createSecureErrorResponse(new Error('auth token expired'), false);
    expect(result).toBe('Authentication failed');
  });

  it('categorizes permission errors', () => {
    const result = createSecureErrorResponse(new Error('permission denied'), false);
    expect(result).toBe('Access denied');
  });
});

// ==================== Appointment Validation ====================
describe('validateAppointmentData', () => {
  it('accepts valid appointment data', () => {
    const result = validateAppointmentData({
      patient_id: '123',
      doctor_id: '456',
      scheduled_datetime: '2020-01-01T10:00:00Z',
      appointment_type: 'teleconsulta',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing required fields', () => {
    const result = validateAppointmentData({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('rejects invalid datetime', () => {
    const result = validateAppointmentData({
      patient_id: '1',
      doctor_id: '2',
      scheduled_datetime: 'not-a-date',
      appointment_type: 'presencial',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid scheduled datetime format');
  });
});

// ==================== Payment Validation ====================
describe('validatePaymentData', () => {
  it('accepts valid payment data', () => {
    const result = validatePaymentData({
      amount: 150.0,
      currency: 'BRL',
      status: 'pending',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects zero or negative amount', () => {
    const result = validatePaymentData({ amount: 0, currency: 'BRL', status: 'pending' });
    expect(result.valid).toBe(false);
  });

  it('rejects amount out of range', () => {
    const result = validatePaymentData({ amount: 1000000, currency: 'BRL', status: 'pending' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing currency', () => {
    const result = validatePaymentData({ amount: 100, status: 'pending' });
    expect(result.valid).toBe(false);
  });
});

// ==================== Profile Validation ====================
describe('validateProfileData', () => {
  const validProfile = {
    user_id: 'uid-123',
    full_name: 'João Silva',
    email: 'joao@test.com',
    role: 'patient',
  };

  it('accepts valid profile data', () => {
    expect(validateProfileData(validProfile).valid).toBe(true);
  });

  it('rejects short name', () => {
    const result = validateProfileData({ ...validProfile, full_name: 'J' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = validateProfileData({ ...validProfile, role: 'superadmin' });
    expect(result.valid).toBe(false);
  });

  it('requires CRM for doctors', () => {
    const result = validateProfileData({ ...validProfile, role: 'doctor' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('CRM is required for doctors');
  });

  it('validates optional CPF when provided', () => {
    const result = validateProfileData({ ...validProfile, cpf: '000.000.000-00' });
    expect(result.valid).toBe(false);
  });

  it('validates optional phone when provided', () => {
    const result = validateProfileData({ ...validProfile, phone: '123' });
    expect(result.valid).toBe(false);
  });
});
