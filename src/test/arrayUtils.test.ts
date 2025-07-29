import { describe, it, expect, vi } from 'vitest';
import {
  isValidArray,
  safeArrayAccess,
  safeArrayLength,
  isEmptyOrUndefined,
  safeArrayFirst,
  safeArrayMap
} from '../utils/arrayUtils';

describe('arrayUtils', () => {
  describe('isValidArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray(['a', 'b'])).toBe(true);
      expect(isValidArray([{ id: 1 }])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isValidArray([])).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidArray(undefined)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidArray(null)).toBe(false);
    });

    it('should return false for non-array values', () => {
      expect(isValidArray('string' as any)).toBe(false);
      expect(isValidArray(123 as any)).toBe(false);
      expect(isValidArray({} as any)).toBe(false);
    });
  });

  describe('safeArrayAccess', () => {
    it('should return the original array if valid', () => {
      const testArray = [1, 2, 3];
      expect(safeArrayAccess(testArray)).toBe(testArray);
    });

    it('should return empty array for undefined', () => {
      expect(safeArrayAccess(undefined)).toEqual([]);
    });

    it('should return empty array for null', () => {
      expect(safeArrayAccess(null)).toEqual([]);
    });

    it('should return empty array for non-array values', () => {
      expect(safeArrayAccess('string' as any)).toEqual([]);
      expect(safeArrayAccess(123 as any)).toEqual([]);
      expect(safeArrayAccess({} as any)).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(safeArrayAccess([])).toEqual([]);
    });
  });

  describe('safeArrayLength', () => {
    it('should return correct length for valid arrays', () => {
      expect(safeArrayLength([1, 2, 3])).toBe(3);
      expect(safeArrayLength(['a'])).toBe(1);
      expect(safeArrayLength([])).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(safeArrayLength(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(safeArrayLength(null)).toBe(0);
    });

    it('should return 0 for non-array values', () => {
      expect(safeArrayLength('string' as any)).toBe(0);
      expect(safeArrayLength(123 as any)).toBe(0);
      expect(safeArrayLength({} as any)).toBe(0);
    });
  });

  describe('isEmptyOrUndefined', () => {
    it('should return true for undefined', () => {
      expect(isEmptyOrUndefined(undefined)).toBe(true);
    });

    it('should return true for null', () => {
      expect(isEmptyOrUndefined(null)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(isEmptyOrUndefined([])).toBe(true);
    });

    it('should return false for non-empty arrays', () => {
      expect(isEmptyOrUndefined([1, 2, 3])).toBe(false);
      expect(isEmptyOrUndefined(['a'])).toBe(false);
    });

    it('should return true for non-array values', () => {
      expect(isEmptyOrUndefined('string' as any)).toBe(true);
      expect(isEmptyOrUndefined(123 as any)).toBe(true);
      expect(isEmptyOrUndefined({} as any)).toBe(true);
    });
  });

  describe('safeArrayFirst', () => {
    it('should return first element for non-empty arrays', () => {
      expect(safeArrayFirst([1, 2, 3])).toBe(1);
      expect(safeArrayFirst(['a', 'b'])).toBe('a');
      expect(safeArrayFirst([{ id: 1 }, { id: 2 }])).toEqual({ id: 1 });
    });

    it('should return undefined for empty arrays', () => {
      expect(safeArrayFirst([])).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(safeArrayFirst(undefined)).toBeUndefined();
    });

    it('should return undefined for null', () => {
      expect(safeArrayFirst(null)).toBeUndefined();
    });

    it('should return undefined for non-array values', () => {
      expect(safeArrayFirst('string' as any)).toBeUndefined();
      expect(safeArrayFirst(123 as any)).toBeUndefined();
      expect(safeArrayFirst({} as any)).toBeUndefined();
    });
  });

  describe('safeArrayMap', () => {
    it('should map over valid arrays', () => {
      const result = safeArrayMap([1, 2, 3], (x) => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should return empty array for undefined', () => {
      const result = safeArrayMap(undefined, (x) => x);
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = safeArrayMap(null, (x) => x);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array values', () => {
      const result = safeArrayMap('string' as any, (x) => x);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty arrays', () => {
      const result = safeArrayMap([], (x) => x);
      expect(result).toEqual([]);
    });

    it('should pass correct parameters to callback', () => {
      const callback = vi.fn((item, index, array) => `${item}-${index}`);
      const testArray = ['a', 'b', 'c'];
      
      safeArrayMap(testArray, callback);
      
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 'a', 0, testArray);
      expect(callback).toHaveBeenNthCalledWith(2, 'b', 1, testArray);
      expect(callback).toHaveBeenNthCalledWith(3, 'c', 2, testArray);
    });
  });
});