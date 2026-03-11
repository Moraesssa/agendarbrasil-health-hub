import { describe, expect, it } from 'vitest';
import { isValidUUID, validateUUID, sanitizeUUID } from '@/utils/uuidValidation';

describe('isValidUUID', () => {
  it('accepts valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidUUID(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects string "undefined"', () => {
    expect(isValidUUID('undefined')).toBe(false);
  });

  it('rejects string "null"', () => {
    expect(isValidUUID('null')).toBe(false);
  });

  it('rejects malformed UUID', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
  });
});

describe('validateUUID', () => {
  it('returns the UUID when valid', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(validateUUID(uuid)).toBe(uuid);
  });

  it('throws for invalid UUID', () => {
    expect(() => validateUUID('bad')).toThrow('ID inválido');
  });

  it('includes custom field name in error', () => {
    expect(() => validateUUID(null, 'Médico ID')).toThrow('Médico ID inválido');
  });
});

describe('sanitizeUUID', () => {
  it('returns valid UUID as-is', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(sanitizeUUID(uuid)).toBe(uuid);
  });

  it('returns null for invalid UUID', () => {
    expect(sanitizeUUID('bad')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(sanitizeUUID(null)).toBeNull();
  });

  it('returns null for "undefined" string', () => {
    expect(sanitizeUUID('undefined')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(sanitizeUUID('')).toBeNull();
  });
});
