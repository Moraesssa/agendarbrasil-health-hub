// EMERGENCY TYPE FIXES - Remove after schema consolidation
// This file provides type-safe accessors for problematic data structures

export const safeAccess = (obj: any, prop: string, fallback: any = null): any => {
  try {
    return obj?.[prop] ?? fallback;
  } catch {
    return fallback;
  }
};

export const safeArray = (arr: any): any[] => {
  return Array.isArray(arr) ? arr : [];
};

export const safeObject = (obj: any): Record<string, any> => {
  return obj && typeof obj === 'object' ? obj : {};
};

export const safeString = (str: any): string => {
  return typeof str === 'string' ? str : String(str || '');
};

export const safeNumber = (num: any): number => {
  const parsed = typeof num === 'string' ? parseFloat(num) : Number(num);
  return isNaN(parsed) ? 0 : parsed;
};

// Emergency component props fixes
export const fixComponentProps = <T extends Record<string, any>>(props: T): T => {
  if (!props || typeof props !== 'object') {
    return {} as T;
  }
  
  const fixed = { ...props };
  
  // Convert any 'unknown' typed arrays to proper arrays
  Object.keys(fixed).forEach(key => {
    if (Array.isArray(fixed[key]) || (fixed[key] && typeof fixed[key] === 'object' && fixed[key].length !== undefined)) {
      fixed[key] = safeArray(fixed[key]);
    }
  });
  
  return fixed;
};

console.warn('🚨 EMERGENCY TYPE FIXES ACTIVE - Remove after schema normalization');