import { describe, it, expect } from 'vitest';
import { normalizeAppointmentId } from '@/utils/appointment-id';

describe('normalizeAppointmentId', () => {
  describe('null/undefined handling', () => {
    it('should return null for null', () => {
      expect(normalizeAppointmentId(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(normalizeAppointmentId(undefined)).toBeNull();
    });
  });

  describe('number inputs', () => {
    it('should return the number for valid finite numbers', () => {
      expect(normalizeAppointmentId(42)).toBe(42);
      expect(normalizeAppointmentId(0)).toBe(0);
      expect(normalizeAppointmentId(-1)).toBe(-1);
    });

    it('should return null for Infinity', () => {
      expect(normalizeAppointmentId(Infinity)).toBeNull();
      expect(normalizeAppointmentId(-Infinity)).toBeNull();
    });

    it('should return null for NaN', () => {
      expect(normalizeAppointmentId(NaN)).toBeNull();
    });
  });

  describe('bigint inputs', () => {
    it('should convert bigint to number', () => {
      expect(normalizeAppointmentId(BigInt(123))).toBe(123);
    });
  });

  describe('string inputs', () => {
    it('should parse valid numeric strings', () => {
      expect(normalizeAppointmentId('42')).toBe(42);
      expect(normalizeAppointmentId('0')).toBe(0);
      expect(normalizeAppointmentId('999')).toBe(999);
    });

    it('should return null for empty/whitespace strings', () => {
      expect(normalizeAppointmentId('')).toBeNull();
      expect(normalizeAppointmentId('   ')).toBeNull();
    });

    it('should return null for non-numeric strings', () => {
      expect(normalizeAppointmentId('abc')).toBeNull();
      expect(normalizeAppointmentId('not-a-number')).toBeNull();
    });
  });

  describe('other types', () => {
    it('should return null for objects', () => {
      expect(normalizeAppointmentId({})).toBeNull();
      expect(normalizeAppointmentId([])).toBeNull();
    });

    it('should return null for boolean', () => {
      expect(normalizeAppointmentId(true)).toBeNull();
      expect(normalizeAppointmentId(false)).toBeNull();
    });
  });
});
