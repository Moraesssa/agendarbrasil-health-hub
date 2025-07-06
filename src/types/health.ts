export interface HealthMetric {
  id: string;
  patient_id: string;
  metric_type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'weight' | 'height' | 'glucose' | 'oxygen_saturation';
  value: {
    systolic?: number;
    diastolic?: number;
    numeric?: number;
    text?: string;
  };
  unit: string;
  recorded_at: string;
  created_at: string;
  appointment_id?: string;
}

export interface CreateHealthMetricData {
  patient_id: string;
  metric_type: HealthMetric['metric_type'];
  value: HealthMetric['value'];
  unit: string;
  recorded_at?: string;
  appointment_id?: string;
}

export interface HealthMetricDisplay {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'attention' | 'critical' | 'ideal';
  icon: React.ComponentType<{ className?: string }>;
  lastRecorded?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface HealthScore {
  score: number;
  category: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  recommendations: string[];
}