
export interface MedicalService {
  id: string;
  name: string;
  category: 'consultation' | 'exam' | 'vaccine' | 'triage' | 'telemedicine';
  description?: string;
  requires_preparation: boolean;
  preparation_instructions?: string;
  typical_duration: number;
  is_active: boolean;
  created_at: string;
}

export interface MedicalTriage {
  id: string;
  patient_id: string;
  created_by: string;
  symptoms: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  recommended_specialties?: string[];
  initial_guidance?: string;
  status: 'pending' | 'reviewed' | 'scheduled';
  created_at: string;
  updated_at: string;
}

export interface VaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_name: string;
  vaccine_type: 'routine' | 'travel' | 'special';
  dose_number?: number;
  total_doses?: number;
  administered_date?: string;
  next_dose_date?: string;
  healthcare_provider?: string;
  batch_number?: string;
  adverse_reactions?: string;
  status: 'scheduled' | 'administered' | 'overdue' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalExam {
  id: string;
  patient_id: string;
  exam_type: 'laboratory' | 'imaging' | 'cardio' | 'other';
  exam_name: string;
  scheduled_date?: string;
  completed_date?: string;
  healthcare_provider?: string;
  preparation_required: boolean;
  preparation_instructions?: string;
  results_available: boolean;
  results_summary?: string;
  urgent: boolean;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending_results';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyNotification {
  id: string;
  user_id: string;
  patient_id: string;
  notification_type: 'appointment_reminder' | 'vaccine_due' | 'exam_result' | 'emergency';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  action_required: boolean;
  action_url?: string;
  scheduled_for: string;
  created_at: string;
}

export interface FamilyActivity {
  activity_type: 'consultation' | 'vaccine' | 'exam';
  patient_name: string;
  patient_id: string;
  title: string;
  scheduled_date: string;
  urgency: 'normal' | 'medium' | 'high';
  status: string;
}

export interface CreateTriageData {
  patient_id: string;
  symptoms: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  initial_guidance?: string;
}

export interface CreateVaccineData {
  patient_id: string;
  vaccine_name: string;
  vaccine_type: 'routine' | 'travel' | 'special';
  dose_number?: number;
  total_doses?: number;
  next_dose_date?: string;
  healthcare_provider?: string;
}

export interface CreateExamData {
  patient_id: string;
  exam_type: 'laboratory' | 'imaging' | 'cardio' | 'other';
  exam_name: string;
  scheduled_date?: string;
  healthcare_provider?: string;
  preparation_required: boolean;
  preparation_instructions?: string;
  urgent: boolean;
}
