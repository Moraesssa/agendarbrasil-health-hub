// TEMPORARY: Type augmentations to fix build errors immediately
// This file adds missing properties to existing types to prevent build failures
// TODO: Remove after proper schema consolidation

declare module '@/types' {
  interface Doctor {
    usuario_id?: string;
    foto_perfil_url?: string;
    rating?: number;
    total_avaliacoes?: number;
    bio_perfil?: string;
    duracao_consulta_inicial?: number;
  }

  interface Patient {
    usuario_id?: string;
  }

  interface Appointment {
    prioridade?: string;
    observacoes_medico?: string;
  }

  interface SearchFilters {
    rating_minimo?: number;
  }
}

export {};