export interface ExternalDataSource {
  id: string;
  name: string;
  description: string;
  data_types: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserConsent {
  id: string;
  patient_id: string;
  source_id: string;
  status: 'granted' | 'revoked';
  granted_at: string;
  revoked_at?: string;
  consent_version: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  source_id: string;
  patient_id?: string;
  action: string;
  status: 'success' | 'failed' | 'rejected';
  payload?: any;
  error_message?: string;
  ip_address?: string;
  created_at: string;
}

export interface ConsentRequest {
  source_id: string;
  consent_version: string;
  ip_address?: string;
  user_agent?: string;
}

export const DATA_TYPE_LABELS = {
  lab_results: 'Resultados de Exames Laboratoriais',
  blood_tests: 'Exames de Sangue',
  imaging: 'Exames de Imagem',
  radiology: 'Radiologia',
  medications: 'Histórico de Medicamentos',
  prescriptions: 'Receitas Médicas',
  vaccines: 'Registros de Vacinação',
  consultations: 'Histórico de Consultas'
} as const;