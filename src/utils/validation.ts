// Input validation utilities for security

export const validateCPF = (cpf: string): boolean => {
  // Remove formatting
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  
  return parseInt(cleanCPF.charAt(10)) === secondDigit;
};

export const validatePhone = (phone: string): boolean => {
  // Brazilian phone format validation
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

export const validateCRM = (crm: string): boolean => {
  // Basic CRM validation (number + state)
  const cleanCRM = crm.replace(/[^\w]/g, '');
  return cleanCRM.length >= 4 && cleanCRM.length <= 10;
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/[<>]/g, '')
              .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj <= new Date();
};

export const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
};

export const validateNumericRange = (value: number, min: number, max: number): boolean => {
  return !isNaN(value) && value >= min && value <= max;
};

export const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const sanitizeNumericInput = (input: string): string => {
  return input.replace(/[^\d.,]/g, '');
};

export const validateUF = (uf: string): boolean => {
  const validUFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  return validUFs.includes(uf.toUpperCase());
};

export const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier);
  
  if (!userRequests) {
    rateLimitMap.set(identifier, { count: 1, lastRequest: now });
    return true;
  }
  
  if (now - userRequests.lastRequest > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastRequest: now });
    return true;
  }
  
  if (userRequests.count >= maxRequests) {
    return false;
  }
  
  userRequests.count++;
  userRequests.lastRequest = now;
  return true;
};

export const createSecureErrorResponse = (error: any, isDevelopment: boolean = false): string => {
  if (isDevelopment) {
    return error?.message || 'An error occurred';
  }
  
  // Generic error messages for production
  const genericMessages = {
    validation: 'Invalid input provided',
    authentication: 'Authentication failed',
    authorization: 'Access denied',
    network: 'Service temporarily unavailable',
    default: 'An unexpected error occurred'
  };
  
  // Determine error type and return appropriate generic message
  const errorMessage = error?.message?.toLowerCase() || '';
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return genericMessages.validation;
  }
  if (errorMessage.includes('auth') || errorMessage.includes('token')) {
    return genericMessages.authentication;
  }
  if (errorMessage.includes('permission') || errorMessage.includes('access')) {
    return genericMessages.authorization;
  }
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return genericMessages.network;
  }
  
  return genericMessages.default;
};