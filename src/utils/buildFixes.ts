// TEMPORARY build fixes - Emergency type conversions to get deployment working
// These functions handle ID mismatches and missing properties during schema transition

// ID conversion utilities
export const safeStringId = (id: any): string => {
  if (id === null || id === undefined) return '';
  return String(id);
};

export const safeNumberId = (id: any): number => {
  if (id === null || id === undefined) return 0;
  const parsed = typeof id === 'string' ? parseInt(id, 10) : Number(id);
  return isNaN(parsed) ? 0 : parsed;
};

// Object property fixes
export const addMissingProps = (obj: any, defaults: any = {}): any => ({
  ...defaults,
  ...obj,
  id: safeStringId(obj?.id),
  usuario_id: obj?.usuario_id || obj?.user_id,
  foto_perfil_url: obj?.foto_perfil_url || obj?.photo_url,
  rating: obj?.rating || 0,
  total_avaliacoes: obj?.total_avaliacoes || 0,
  bio_perfil: obj?.bio_perfil || '',
  duracao_consulta_inicial: obj?.duracao_consulta_inicial || 30,
  prioridade: obj?.prioridade || 'normal',
  observacoes_medico: obj?.observacoes_medico || '',
  status_pagamento: obj?.status_pagamento || 'pendente'
});

// Safe database operations
export const safeDbInsert = (data: any): any => {
  const cleaned = { ...data };
  // Remove undefined values that cause database errors
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// Type conversion for components
export const asAny = (obj: any): any => obj;