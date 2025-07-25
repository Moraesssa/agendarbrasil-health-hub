export interface MedicalPrescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  prescribed_date: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Novos campos adicionados
  prescription_number?: string;
  validation_hash?: string;
  pdf_generated?: boolean;
  pdf_path?: string;
  // Related data
  doctor_name?: string;
  patient_name?: string;
}

export interface PrescriptionRenewal {
  id: string;
  prescription_id: string;
  patient_id: string;
  doctor_id: string;
  request_date: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requested_duration_days?: number;
  doctor_notes?: string;
  patient_notes?: string;
  processed_date?: string;
  created_at: string;
  updated_at: string;
  // Related data
  prescription?: MedicalPrescription;
  doctor_name?: string;
}

export interface CreatePrescriptionData {
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  valid_until?: string;
}

export interface CreateRenewalRequest {
  prescription_id: string;
  requested_duration_days?: number;
  patient_notes?: string;
}

export interface PrescriptionWithRenewals extends MedicalPrescription {
  renewals?: PrescriptionRenewal[];
  latest_renewal?: PrescriptionRenewal;
}
