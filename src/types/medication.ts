export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  times: string[]; // Array of time strings like ["08:00", "20:00"]
  start_date: string;
  end_date?: string;
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

export interface PendingDoseDisplay {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: 'pendente' | 'tomado' | 'atrasado';
  frequency: string;
  nextDose: string;
  reminderId: string;
}

export interface CreateMedicationData {
  medication_name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  times: string[];
  start_date: string;
  end_date?: string;
}

export interface MedicationWithDoses extends MedicationReminder {
  nextDose?: MedicationDose;
  todayDoses?: MedicationDose[];
}