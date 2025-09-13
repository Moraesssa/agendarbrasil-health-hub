// Global type augmentations for compatibility during schema transition

declare global {
  namespace Lovable {
    // Augment existing types to include missing properties temporarily
    interface Doctor {
      id: string | number;
      display_name?: string;
      nome?: string;
      foto_perfil_url?: string;
      rating?: number;
      total_avaliacoes?: number;
      bio_perfil?: string;
      usuario_id?: string;
      duracao_consulta_inicial?: number;
      especialidades?: string[];
      especialidade?: string;
      crm?: string;
      uf_crm?: string;
      email?: string;
      [key: string]: any; // Allow any additional properties
    }

    interface Patient {
      id: string | number;
      display_name?: string;
      nome?: string;
      usuario_id?: string;
      [key: string]: any;
    }

    interface Appointment {
      id: string | number;
      medico_id?: string | number;
      paciente_id?: string | number;
      consultation_date?: string;
      consultation_type?: string;
      status?: string;
      status_pagamento?: string;
      patient_name?: string;
      patient_email?: string;
      notes?: string;
      prioridade?: string;
      observacoes_medico?: string;
      created_at?: string;
      updated_at?: string;
      [key: string]: any;
    }

    interface SearchFilters {
      specialty?: string;
      city?: string;
      state?: string;
      rating_minimo?: number;
      available_today?: boolean;
      accepts_insurance?: boolean;
      [key: string]: any;
    }

    interface Location {
      id: string | number;
      nome_local?: string;
      endereco?: any;
      cidade?: string;
      estado?: string;
      ativo?: boolean;
      [key: string]: any;
    }
  }
}

// Type utilities for safe conversion
declare module '@/types' {
  type Doctor = Lovable.Doctor;
  type Patient = Lovable.Patient;  
  type Appointment = Lovable.Appointment;
  type SearchFilters = Lovable.SearchFilters;
  type Location = Lovable.Location;
}

export {};