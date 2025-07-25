
export interface MedicalCertificate {
  id: string;
  patient_id: string;
  doctor_id: string;
  certificate_type: 'medical_leave' | 'fitness_certificate' | 'vaccination_certificate' | 'medical_report';
  title: string;
  content: string;
  start_date?: string;
  end_date?: string;
  diagnosis?: string;
  recommendations?: string;
  certificate_number: string;
  validation_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Related data
  doctor_name?: string;
  patient_name?: string;
}

export interface CreateCertificateData {
  patient_id: string;
  certificate_type: 'medical_leave' | 'fitness_certificate' | 'vaccination_certificate' | 'medical_report';
  title: string;
  content: string;
  start_date?: string;
  end_date?: string;
  diagnosis?: string;
  recommendations?: string;
}

export interface DocumentValidation {
  id: string;
  document_id: string;
  document_type: 'prescription' | 'certificate';
  validation_code: string;
  accessed_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ValidationResult {
  valid: boolean;
  document?: MedicalCertificate | any;
  error?: string;
}

export interface PDFGenerationOptions {
  includeQRCode?: boolean;
  watermark?: string;
  fontSize?: number;
  margin?: number;
}
