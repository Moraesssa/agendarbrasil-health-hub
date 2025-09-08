/**
 * Real-Time Medical Scheduler - Types & Interfaces
 * Algoritmo revolucionário de otimização de agenda médica em tempo real
 */

export type PriorityLevel = 'emergency' | 'high' | 'normal' | 'low';
export type EventType = 'patient_arrival' | 'traffic_update' | 'consultation_end' | 'emergency_insert' | 'no_show';
export type TransportMode = 'driving' | 'walking' | 'transit' | 'bicycling';

// Distribuições de probabilidade para predições
export interface QuantileDistribution {
  p50: number;  // mediana
  p80: number;  // conservador
  p95: number;  // muito conservador
}

// Dados do paciente para otimização
export interface SchedulerPatient {
  id: string;
  priority: PriorityLevel;
  reason: string;
  doctor_id: string;
  
  // Predições de chegada
  scheduled_time: Date;
  origin_coordinates?: { lat: number; lng: number };
  distance_km: number;
  eta_distribution: QuantileDistribution; // em minutos de offset do scheduled_time
  
  // Predições de duração
  duration_distribution: QuantileDistribution; // em minutos
  
  // Características do paciente
  no_show_probability: number;
  punctuality_score: number; // histórico de pontualidade (0-1)
  
  // Janelas de disponibilidade
  availability_window?: {
    earliest: Date;
    latest: Date;
  };
  
  // Metadados
  locked?: boolean; // não pode ser remarcado
  max_reschedules_today?: number;
  current_reschedules?: number;
}

// Estado atual do sistema
export interface SchedulerState {
  current_time: Date;
  doctor_id: string;
  
  // Consulta em andamento
  current_consultation?: {
    patient_id: string;
    started_at: Date;
    estimated_end: Date;
    actual_duration_so_far: number;
  };
  
  // Fila de pacientes
  waiting_queue: SchedulerPatient[];
  scheduled_queue: SchedulerPatient[];
  
  // Configurações do médico
  doctor_config: {
    clinic_start: Date;
    clinic_end: Date;
    break_times: Array<{ start: Date; end: Date }>;
    emergency_buffer_minutes: number;
    max_overtime_minutes: number;
  };
}

// Eventos que disparam reotimização
export interface SchedulerEvent {
  type: EventType;
  timestamp: Date;
  patient_id?: string;
  data: {
    // Para patient_arrival
    actual_arrival_time?: Date;
    
    // Para traffic_update
    new_eta?: Date;
    traffic_delay_minutes?: number;
    
    // Para consultation_end
    actual_duration?: number;
    
    // Para emergency_insert
    emergency_patient?: SchedulerPatient;
    
    // Para no_show
    confirmed_no_show?: boolean;
  };
}

// Resultado da otimização
export interface OptimizedSchedule {
  sequence: SchedulerPatient[];
  timeline: Array<{
    patient_id: string;
    planned_start: Date;
    planned_end: Date;
    buffer_minutes: number;
    confidence_level: number;
  }>;
  
  metrics: {
    expected_total_delay: number;
    expected_idle_time: number;
    expected_overtime: number;
    emergency_sla_compliance: number;
    total_cost: number;
  };
  
  changes_from_previous: Array<{
    patient_id: string;
    old_time?: Date;
    new_time: Date;
    reason: string;
  }>;
}

// Parâmetros de configuração do algoritmo
export interface SchedulerParams {
  // Pesos da função de custo
  alpha_priority: Record<PriorityLevel, number>;
  beta_idle: number;
  delta_overtime: number;
  gamma_reschedule: number;
  
  // Quantis para predições
  eta_quantile: number; // ex: 0.8 para p80
  duration_quantile: number; // ex: 0.8 para p80
  
  // Limites operacionais
  max_reschedules_per_patient_per_day: number;
  min_minutes_before_reschedule: number; // janela quieta
  emergency_sla_minutes: number;
  
  // Buffers probabilísticos
  buffer_multiplier: number;
  min_buffer_minutes: number;
  max_buffer_minutes: number;
  
  // Controle de reotimização
  reoptimize_threshold_minutes: number;
  max_reoptimizations_per_hour: number;
}

// Predições históricas para calibração
export interface HistoricalData {
  patient_arrivals: Array<{
    scheduled_time: Date;
    actual_arrival: Date;
    distance_km: number;
    traffic_conditions: string;
    weather?: string;
  }>;
  
  consultation_durations: Array<{
    reason: string;
    doctor_id: string;
    planned_duration: number;
    actual_duration: number;
    patient_characteristics: Record<string, any>;
  }>;
  
  no_shows: Array<{
    patient_id: string;
    scheduled_time: Date;
    reason?: string;
    advance_notice_minutes?: number;
  }>;
}

// Interface para APIs externas
export interface ExternalAPIs {
  traffic: {
    getETA(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, mode: TransportMode): Promise<{
      duration_minutes: number;
      duration_in_traffic_minutes: number;
      confidence: number;
    }>;
  };
  
  weather: {
    getCurrentConditions(location: { lat: number; lng: number }): Promise<{
      condition: string;
      temperature: number;
      precipitation_probability: number;
    }>;
  };
}

// Resultado de simulação Monte Carlo
export interface SimulationResult {
  scenarios_run: number;
  metrics: {
    avg_delay_minutes: number;
    p95_delay_minutes: number;
    avg_idle_time: number;
    overtime_probability: number;
    emergency_sla_violations: number;
  };
  
  risk_assessment: {
    high_risk_periods: Array<{ start: Date; end: Date; risk_factor: number }>;
    bottleneck_patients: string[];
    recommended_actions: string[];
  };
}