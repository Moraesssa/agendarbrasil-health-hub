
export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  times: string[];
  start_date: string;
  end_date?: string | null;
  instructions?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationDose {
  id: string;
  reminder_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  taken_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationWithDoses extends MedicationReminder {
  today_doses?: MedicationDose[];
  next_dose_time?: string;
  status?: 'pending' | 'taken' | 'missed' | 'overdue' | 'completed' | 'partial';
  progress?: {
    taken: number;
    total: number;
    percentage: number;
  };
}

export interface MedicationProgress {
  medicationId: string;
  medicationName: string;
  totalDoses: number;
  takenDoses: number;
  skippedDoses: number;
  pendingDoses: number;
  overdueDoses: number;
  adherencePercentage: number;
}
