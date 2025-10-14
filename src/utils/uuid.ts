/**
 * Utilitários para validação de UUID
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value === 'undefined' || value === 'null' || value === '') return false;
  return UUID_REGEX.test(value);
}

export function validateUUID(value: unknown, fieldName: string = 'UUID'): string {
  if (!isValidUUID(value)) {
    throw new Error(`${fieldName} inválido: ${value}`);
  }
  return value as string;
}

export function safeUUID(value: unknown): string | null {
  return isValidUUID(value) ? (value as string) : null;
}
