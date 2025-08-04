/**
 * Enhanced Location Types for Detailed Establishment Information
 * Supports comprehensive location data with facilities, contact info, and status
 */

export type LocationStatus = 'ativo' | 'temporariamente_fechado' | 'manutencao';

export type FacilityType = 
  | 'estacionamento' 
  | 'acessibilidade' 
  | 'farmacia' 
  | 'laboratorio' 
  | 'wifi' 
  | 'ar_condicionado'
  | 'elevador'
  | 'cafe'
  | 'banheiro_adaptado'
  | 'sala_espera_criancas';

export type CostType = 'gratuito' | 'pago' | 'nao_informado';

export type DataSource = 'manual' | 'api' | 'scraping' | 'user_report';

export type ConsultationType = 'presencial' | 'telemedicina' | 'hibrida';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  precisao: 'exata' | 'aproximada';
}

export interface LocationFacility {
  type: FacilityType;
  available: boolean;
  details?: string;
  cost?: CostType;
  observacoes?: string;
}

export interface OperatingHours {
  abertura: string;
  fechamento: string;
  fechado: boolean;
  almoco?: {
    inicio: string;
    fim: string;
  };
}

export interface WeeklySchedule {
  segunda: OperatingHours;
  terca: OperatingHours;
  quarta: OperatingHours;
  quinta: OperatingHours;
  sexta: OperatingHours;
  sabado: OperatingHours;
  domingo: OperatingHours;
}

export interface EnhancedTimeSlot {
  time: string;
  available: boolean;
  location_id: string;
  location_name: string;
  duration_minutes: number;
  tipo_consulta: ConsultationType;
  valor?: number;
  observacoes?: string;
  medico_id: string;
}

export interface EnhancedLocation {
  // Basic Info
  id: string;
  nome_local: string;
  endereco_completo: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  
  // Contact Information
  telefone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  
  // Geographic Data
  coordenadas?: LocationCoordinates;
  
  // Operating Schedule
  horario_funcionamento: WeeklySchedule;
  
  // Facilities and Services
  facilidades: LocationFacility[];
  
  // Status and Availability
  status: LocationStatus;
  motivo_fechamento?: string;
  previsao_reabertura?: string;
  
  // Available Time Slots
  horarios_disponiveis: EnhancedTimeSlot[];
  
  // Metadata
  ultima_atualizacao: string;
  verificado_em: string;
  fonte_dados: DataSource;
  
  // Additional Info
  descricao?: string;
  instrucoes_acesso?: string;
  observacoes_especiais?: string;
}

export interface LocationWithTimeSlots extends EnhancedLocation {
  available_slots_count: number;
  next_available_slot?: string;
  is_open_now: boolean;
  distance_km?: number;
}

// Utility Types
export type LocationSummary = Pick<
  EnhancedLocation, 
  'id' | 'nome_local' | 'endereco_completo' | 'telefone' | 'status'
>;

export type LocationContact = Pick<
  EnhancedLocation,
  'telefone' | 'whatsapp' | 'email' | 'website'
>;

export type LocationBasicInfo = Pick<
  EnhancedLocation,
  'id' | 'nome_local' | 'endereco_completo' | 'bairro' | 'cidade' | 'estado' | 'cep'
>;

// Filter and Search Types
export interface LocationFilters {
  status?: LocationStatus[];
  facilidades?: FacilityType[];
  cidade?: string;
  bairro?: string;
  has_parking?: boolean;
  is_accessible?: boolean;
  max_distance_km?: number;
  open_now?: boolean;
}

export interface LocationSearchParams {
  query?: string;
  filters?: LocationFilters;
  sort_by?: 'distance' | 'name' | 'availability' | 'rating';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// API Response Types
export interface LocationApiResponse {
  locations: EnhancedLocation[];
  total_count: number;
  has_more: boolean;
  last_updated: string;
}

export interface LocationUpdateRequest {
  location_id: string;
  updates: Partial<EnhancedLocation>;
  source: DataSource;
  updated_by?: string;
}

// Error Types
export interface LocationError {
  code: 'LOCATION_NOT_FOUND' | 'INVALID_COORDINATES' | 'OUTDATED_INFO' | 'SERVICE_UNAVAILABLE';
  message: string;
  location_id?: string;
  details?: Record<string, any>;
}

// Event Types for Location Updates
export interface LocationStatusChangeEvent {
  location_id: string;
  old_status: LocationStatus;
  new_status: LocationStatus;
  reason?: string;
  affected_appointments?: string[];
  timestamp: string;
}

export interface LocationDataUpdateEvent {
  location_id: string;
  updated_fields: (keyof EnhancedLocation)[];
  source: DataSource;
  timestamp: string;
}

// Validation Types
export interface LocationValidationResult {
  is_valid: boolean;
  errors: {
    field: keyof EnhancedLocation;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }[];
  warnings: string[];
}

// Map Integration Types
export interface MapLocation {
  id: string;
  name: string;
  coordinates: LocationCoordinates;
  address: string;
  marker_color?: string;
  is_selected?: boolean;
}

export interface DirectionsRequest {
  from: LocationCoordinates;
  to: LocationCoordinates;
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
}

// Sharing Types
export interface LocationShareData {
  location: LocationBasicInfo;
  appointment_time?: string;
  share_method: 'whatsapp' | 'sms' | 'email' | 'system';
  custom_message?: string;
}

// Analytics Types
export interface LocationAnalytics {
  location_id: string;
  views: number;
  selections: number;
  appointments_booked: number;
  average_rating?: number;
  last_30_days: {
    views: number;
    selections: number;
    appointments: number;
  };
}

// User Preferences
export interface LocationPreferences {
  user_id: string;
  preferred_locations: string[];
  max_distance_km: number;
  required_facilities: FacilityType[];
  preferred_times: string[];
  avoid_locations: string[];
}

export default EnhancedLocation;