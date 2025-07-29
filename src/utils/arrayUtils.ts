/**
 * Utility functions for safe array operations
 * These functions help prevent "Cannot read properties of undefined" errors
 * when working with arrays that might be undefined or null
 */

/**
 * Type guard to check if a value is a valid non-empty array
 * @param arr - The value to check
 * @returns true if the value is an array with at least one element
 */
export const isValidArray = <T>(arr: T[] | undefined | null): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

/**
 * Safely access an array, returning an empty array if the input is undefined or null
 * @param arr - The array to access safely
 * @returns The original array if valid, or an empty array if undefined/null
 */
export const safeArrayAccess = <T>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

/**
 * Get the length of an array safely, returning 0 if the array is undefined or null
 * @param arr - The array to get the length from
 * @returns The length of the array, or 0 if undefined/null
 */
export const safeArrayLength = <T>(arr: T[] | undefined | null): number => {
  return Array.isArray(arr) ? arr.length : 0;
};

/**
 * Check if an array is empty or undefined/null
 * @param arr - The array to check
 * @returns true if the array is undefined, null, or empty
 */
export const isEmptyOrUndefined = <T>(arr: T[] | undefined | null): boolean => {
  return !Array.isArray(arr) || arr.length === 0;
};

/**
 * Safely get the first element of an array
 * @param arr - The array to get the first element from
 * @returns The first element or undefined if array is empty/undefined
 */
export const safeArrayFirst = <T>(arr: T[] | undefined | null): T | undefined => {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
};

/**
 * Safely map over an array, returning empty array if input is undefined/null
 * @param arr - The array to map over
 * @param callback - The mapping function
 * @returns Mapped array or empty array if input is invalid
 */
export const safeArrayMap = <T, U>(
  arr: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => U
): U[] => {
  return Array.isArray(arr) ? arr.map(callback) : [];
};