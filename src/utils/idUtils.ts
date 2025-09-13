// Safe ID conversion utilities to handle number/string ID mismatches

export const safeStringId = (id: string | number | null | undefined): string => {
  if (id === null || id === undefined) return '';
  return String(id);
};

export const safeNumberId = (id: string | number | null | undefined): number => {
  if (id === null || id === undefined) return 0;
  if (typeof id === 'number') return id;
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Convert arrays with mixed ID types
export const convertArrayToStringIds = <T extends { id: string | number }>(
  array: T[]
): (Omit<T, 'id'> & { id: string })[] => {
  return array.map(item => ({
    ...item,
    id: safeStringId(item.id)
  }));
};

export const convertArrayToNumberIds = <T extends { id: string | number }>(
  array: T[]
): (Omit<T, 'id'> & { id: number })[] => {
  return array.map(item => ({
    ...item,
    id: safeNumberId(item.id)
  }));
};