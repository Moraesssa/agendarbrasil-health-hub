/**
 * Safe utility functions to prevent undefined property access errors
 * These functions provide robust error handling and safe data access
 */

/**
 * Safely access a nested property with optional chaining fallback
 * @param obj - The object to access
 * @param path - Dot notation path to the property
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or default value
 */
export const safeGet = <T = any>(
  obj: any,
  path: string,
  defaultValue: T | null = null
): T | null => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result?.[key] !== undefined) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    
    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Safe string access with fallback
 * @param value - The value to check
 * @param fallback - Fallback string value
 * @returns Safe string value
 */
export const safeString = (value: any, fallback: string = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

/**
 * Safe number access with fallback
 * @param value - The value to check
 * @param fallback - Fallback number value
 * @returns Safe number value
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return fallback;
  }
  return Number(value);
};

/**
 * Safe date access with fallback
 * @param value - The value to check
 * @param fallback - Fallback date value
 * @returns Safe date value
 */
export const safeDate = (value: any, fallback: Date = new Date()): Date => {
  if (!value) return fallback;
  
  const date = new Date(value);
  return isNaN(date.getTime()) ? fallback : date;
};

/**
 * Safe array map with fallback to empty array
 * @param array - Array to map over
 * @param mapFn - Mapping function
 * @param fallback - Fallback array
 * @returns Mapped array or fallback
 */
export const safeMap = <T, R>(
  array: T[] | undefined | null,
  mapFn: (item: T, index: number) => R,
  fallback: R[] = []
): R[] => {
  if (!Array.isArray(array)) return fallback;
  
  try {
    return array.map(mapFn);
  } catch {
    return fallback;
  }
};

/**
 * Safe array filter with fallback
 * @param array - Array to filter
 * @param filterFn - Filter function
 * @param fallback - Fallback array
 * @returns Filtered array or fallback
 */
export const safeFilter = <T>(
  array: T[] | undefined | null,
  filterFn: (item: T, index: number) => boolean,
  fallback: T[] = []
): T[] => {
  if (!Array.isArray(array)) return fallback;
  
  try {
    return array.filter(filterFn);
  } catch {
    return fallback;
  }
};

/**
 * Safe object key access
 * @param obj - Object to check
 * @param key - Key to access
 * @param fallback - Fallback value
 * @returns Property value or fallback
 */
export const safeAccess = <T = any>(
  obj: any,
  key: string | number | symbol,
  fallback: T | null = null
): T | null => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  try {
    const value = obj[key];
    return value !== undefined ? value : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safe JSON parse with fallback
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value
 * @returns Parsed object or fallback
 */
export const safeJsonParse = <T = any>(
  jsonString: string,
  fallback: T | null = null
): T | null => {
  if (!jsonString || typeof jsonString !== 'string') return fallback;
  
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

/**
 * Safe function call with error handling
 * @param fn - Function to call
 * @param fallback - Fallback value
 * @param args - Function arguments
 * @returns Function result or fallback
 */
export const safeCall = <T = any>(
  fn: (...args: any[]) => T,
  fallback: T | null = null,
  ...args: any[]
): T | null => {
  if (typeof fn !== 'function') return fallback;
  
  try {
    return fn(...args);
  } catch {
    return fallback;
  }
};

/**
 * Check if value is defined and not null
 * @param value - Value to check
 * @returns Boolean indicating if value is defined
 */
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

/**
 * Check if array has items
 * @param array - Array to check
 * @returns Boolean indicating if array has items
 */
export const hasItems = <T>(array: T[] | undefined | null): array is T[] => {
  return Array.isArray(array) && array.length > 0;
};

/**
 * Safe render function for conditional rendering
 * @param condition - Condition to check
 * @param renderFn - Function to render if condition is true
 * @param fallback - Fallback to render if condition is false
 * @returns Rendered content or fallback
 */
export const safeRender = <T = any>(
  condition: any,
  renderFn: () => T,
  fallback: T | null = null
): T | null => {
  if (!condition) return fallback;
  
  try {
    return renderFn();
  } catch {
    return fallback;
  }
};