// Re-export types from main database types to avoid duplicates
export type { Doctor, Patient, Location } from '@/types/database';

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
