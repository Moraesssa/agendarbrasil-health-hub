// Centralized type conversion utilities to handle database/app type mismatches
import { safeStringId, safeNumberId } from './idUtils';

// Convert database records with number IDs to app types with string IDs
export const convertDatabaseRecord = <T extends { id: any }>(record: T): T & { id: string } => {
  if (!record) return record as T & { id: string };
  
  return {
    ...record,
    id: safeStringId(record.id)
  };
};

// Convert array of database records
export const convertDatabaseArray = <T extends { id: any }>(records: T[]): (T & { id: string })[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map(convertDatabaseRecord);
};

// Convert app IDs to database IDs when needed
export const toDatabaseId = (id: string | number): number => {
  return safeNumberId(id);
};

// Safe property access with fallback
export const safeProperty = <T>(obj: any, prop: string, fallback: T): T => {
  if (!obj || typeof obj !== 'object') return fallback;
  return obj[prop] ?? fallback;
};