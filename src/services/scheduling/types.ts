// Shared types for scheduling system
export interface Doctor {
  id: string;
  display_name?: string;
  nome?: string;
  especialidades?: string[];
  crm?: string;
  duracao_consulta_padrao?: number;
  ativo?: boolean;
  foto_perfil_url?: string;
  rating?: number;
  total_avaliacoes?: number;
  especialidade?: string;
  uf_crm?: string;
  bio_perfil?: string;
  aceita_consulta_presencial?: boolean;
  aceita_teleconsulta?: boolean;
  valor_consulta_presencial?: number;
  valor_consulta_teleconsulta?: number;
  duracao_consulta_inicial?: number;
}

export interface TimeSlot {
  time: string;
  type?: 'presencial' | 'teleconsulta';
  location_id?: string;
  estimated_duration?: number;
  confidence_score?: number;
}

export interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco?: any;
  horarios_disponiveis: Array<{ time: string; available: boolean }>;
}
