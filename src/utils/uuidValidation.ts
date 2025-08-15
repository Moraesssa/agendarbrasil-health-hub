/**
 * Utilitários para validação de UUID
 * Previne erros críticos de "invalid input syntax for type uuid"
 */

export const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // Verificar se não é um valor inválido
  if (uuid === 'undefined' || uuid === 'null' || uuid === '') return false;
  
  // Regex para validar UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateUUID = (uuid: string | null | undefined, fieldName = 'ID'): string => {
  if (!isValidUUID(uuid)) {
    throw new Error(`${fieldName} inválido: ${uuid}`);
  }
  return uuid!;
};

export const sanitizeUUID = (uuid: string | null | undefined): string | null => {
  if (!uuid || typeof uuid !== 'string') return null;
  if (uuid === 'undefined' || uuid === 'null' || uuid === '') return null;
  return isValidUUID(uuid) ? uuid : null;
};

export const logUUIDError = (context: string, uuid: string | null | undefined, additionalInfo?: any) => {
  console.error(`🚨 UUID Error in ${context}:`, {
    uuid,
    type: typeof uuid,
    length: uuid?.length,
    additionalInfo
  });
};