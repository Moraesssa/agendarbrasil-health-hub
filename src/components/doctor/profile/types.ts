// Temporary types file for deleted profile components

export interface DoctorProfileData {
  id: string;
  nome?: string;
  especialidades?: string[];
  rating?: number;
  total_avaliacoes?: number;
}

export interface ConsultaData {
  id: string;
  patient_name?: string;
  consultation_date: string;
  consultation_type?: string;
  status?: string;
}

export interface DoctorAppointment {
  id: string;
  patientName: string;
  type: string;
  start: Date | string;
  end?: Date | string;
  location?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'confirmada' | 'pendente' | 'cancelada';
}

export interface DoctorNotification {
  id: string;
  type: 'appointment' | 'system' | 'message' | 'info' | 'warning' | 'success';
  title: string;
  description: string;
  time: string;
}

export interface DoctorQuickLink {
  id: string;
  label: string;
  description: string;
  icon: any;
  onClick: () => void;
}

export interface DoctorStat {
  label: string;
  value: string;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon: any;
}

export interface DoctorStatusBadge {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
}