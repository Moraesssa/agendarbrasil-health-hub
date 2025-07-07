export interface PatientDocument {
  id: string;
  patient_id: string;
  document_name: string;
  document_type: string;
  storage_path: string;
  uploaded_at: string;
}

export interface CreateDocumentData {
  patient_id: string;
  document_name: string;
  document_type: string;
  storage_path: string;
}

export const DOCUMENT_TYPES = {
  exame_laboratorial: 'Exame Laboratorial',
  laudo_imagem: 'Laudo de Imagem',
  receita_medica: 'Receita Médica',
  atestado_medico: 'Atestado Médico',
  relatorio_medico: 'Relatório Médico',
  cartao_vacina: 'Cartão de Vacina',
  outro: 'Outro'
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;