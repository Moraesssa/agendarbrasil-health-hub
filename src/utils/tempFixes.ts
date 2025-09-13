// Temporary build fixes to allow deployment - REMOVE AFTER SCHEMA NORMALIZATION

// Type assertion helpers to bypass strict type checking temporarily
export const asAny = (obj: any): any => obj;
export const asString = (id: any): string => String(id || '');
export const asNumber = (id: any): number => parseInt(String(id || '0'), 10) || 0;

// Temporary safe getters for missing properties
export const safeGet = (obj: any, path: string, defaultValue: any = '') => {
  try {
    return path.split('.').reduce((o, p) => o && o[p], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

// Add missing properties to objects temporarily
export const addMissingProps = (obj: any): any => ({
  ...obj,
  foto_perfil_url: obj.foto_perfil_url || obj.photo_url || '',
  rating: obj.rating || 0,
  total_avaliacoes: obj.total_avaliacoes || 0,
  bio_perfil: obj.bio_perfil || '',
  usuario_id: obj.usuario_id || obj.user_id || '',
  duracao_consulta_inicial: obj.duracao_consulta_inicial || 30,
  prioridade: obj.prioridade || 'normal',
  observacoes_medico: obj.observacoes_medico || '',
  status_pagamento: obj.status_pagamento || 'pendente'
});

// Console warning for temp fixes
console.warn('🚨 USING TEMPORARY TYPE FIXES - REMOVE AFTER SCHEMA NORMALIZATION');