import { describe, it, expect } from 'vitest';
import { validateField, validateSchedulingStep } from '@/components/scheduling/FieldValidation';

describe('validateField', () => {
  it('should return error for null/undefined values', () => {
    expect(validateField('nome', null)).toEqual({
      field: 'nome',
      message: 'nome é obrigatório',
      type: 'error',
    });
    expect(validateField('email', undefined)).toEqual({
      field: 'email',
      message: 'email é obrigatório',
      type: 'error',
    });
  });

  it('should return error for empty strings', () => {
    expect(validateField('campo', '')).toBeTruthy();
    expect(validateField('campo', '   ')).toBeTruthy();
  });

  it('should return null for valid values', () => {
    expect(validateField('nome', 'João')).toBeNull();
    expect(validateField('id', 123)).toBeNull();
    expect(validateField('active', true)).toBeNull();
  });
});

describe('validateSchedulingStep', () => {
  it('should require specialty on step 1', () => {
    const errors = validateSchedulingStep(1, {});
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('specialty');
  });

  it('should pass step 1 when specialty is selected', () => {
    const errors = validateSchedulingStep(1, { selectedSpecialty: 'Cardiologia' });
    expect(errors).toHaveLength(0);
  });

  it('should require state on step 2', () => {
    const errors = validateSchedulingStep(2, {});
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('state');
  });

  it('should require city on step 3', () => {
    const errors = validateSchedulingStep(3, {});
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('city');
  });

  it('should require doctor on step 4', () => {
    const errors = validateSchedulingStep(4, {});
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('doctor');
  });

  it('should require date on step 5', () => {
    const errors = validateSchedulingStep(5, {});
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('date');
  });

  it('should require time on step 6', () => {
    const errors = validateSchedulingStep(6, {});
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('time');
  });

  it('should return no errors for unknown steps', () => {
    const errors = validateSchedulingStep(99, {});
    expect(errors).toHaveLength(0);
  });

  it('should pass all steps with complete data', () => {
    const fullData = {
      selectedSpecialty: 'Cardiologia',
      selectedState: 'SP',
      selectedCity: 'São Paulo',
      selectedDoctor: 'doc-1',
      selectedDate: '2026-04-01',
      selectedTime: '10:00',
    };
    for (let step = 1; step <= 6; step++) {
      expect(validateSchedulingStep(step, fullData)).toHaveLength(0);
    }
  });
});
