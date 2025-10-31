// Legacy stub
export const safeAccess = (obj: any, prop: string, fallback: any = null): any => obj?.[prop] ?? fallback;
export const safeArray = (arr: any): any[] => Array.isArray(arr) ? arr : [];
export const safeObject = (obj: any): Record<string, any> => obj && typeof obj === 'object' ? obj : {};
export const safeString = (str: any): string => typeof str === 'string' ? str : String(str || '');
export const safeNumber = (num: any): number => {
  const parsed = typeof num === 'string' ? parseFloat(num) : Number(num);
  return isNaN(parsed) ? 0 : parsed;
};
export const fixComponentProps = <T extends Record<string, any>>(props: T): T => props;