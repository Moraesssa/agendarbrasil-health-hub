/**
 * Tipos unificados para o sistema de agendamento
 */

export interface Medico {
  id: string;
  display_name: string;
  especialidades: string[];
  crm?: string;
  foto_perfil_url?: string;
  rating?: number;
  total_avaliacoes?: number;
  aceita_teleconsulta?: boolean;
  aceita_consulta_presencial?: boolean;
  valor_consulta_presencial?: number;
  valor_consulta_teleconsulta?: number;
}

export interface LocalAtendimento {
  id: number;
  nome_local: string;
  endereco: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  horarios_disponiveis: HorarioDisponivel[];
}

export interface HorarioDisponivel {
  time: string;
  available: boolean;
  tipo?: 'presencial' | 'teleconsulta';
}

export interface Consulta {
  id: number;
  medico_id: string;
  paciente_id: string;
  consultation_date: string;
  consultation_type: string;
  status: string;
  status_pagamento?: string;
  patient_name?: string;
  notes?: string;
}

export interface CriarConsultaInput {
  medico_id: string;
  paciente_id: string;
  consultation_date: string;
  consultation_type: string;
  local_id?: number;
  notes?: string;
}
