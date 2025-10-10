// Shared types for scheduling system
export interface Doctor {
  id: string;
  user_id: string;
  display_name: string;
  nome: string;
  email: string;
  crm?: string;
  uf_crm?: string;
  especialidade?: string;
  especialidades?: string[];
  foto_perfil_url?: string;
  bio_perfil?: string;
  rating?: number;
  total_avaliacoes?: number;
  telefone?: string;
  valor_consulta_presencial?: number;
  valor_consulta_teleconsulta?: number;
  duracao_consulta_padrao?: number;
  duracao_consulta_inicial?: number;
  aceita_teleconsulta?: boolean;
  aceita_consulta_presencial?: boolean;
  ativo?: boolean;
  cidade?: string;
  estado?: string;
  created_at?: string;
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
  endereco: any;
  horarios_disponiveis: Array<{ time: string; available: boolean }>;
}
