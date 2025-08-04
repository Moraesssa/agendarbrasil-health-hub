/**
 * Analytics Types for Location Tracking and User Feedback
 * Supports comprehensive analytics data collection and user feedback management
 */

export type FeedbackType = 'informacao_incorreta' | 'horario_errado' | 'telefone_invalido' | 'endereco_errado' | 'facilidades_incorretas' | 'outro';

export type FeedbackStatus = 'pendente' | 'em_analise' | 'resolvido' | 'rejeitado';

export type RatingCategory = 'localizacao' | 'facilidades' | 'atendimento' | 'limpeza' | 'acessibilidade';

export interface LocationAnalytics {
  location_id: string;
  // View metrics
  total_views: number;
  unique_views: number;
  views_last_7_days: number;
  views_last_30_days: number;
  
  // Selection metrics
  total_selections: number;
  selections_last_7_days: number;
  selections_last_30_days: number;
  
  // Appointment metrics
  appointments_booked: number;
  appointments_completed: number;
  appointments_cancelled: number;
  
  // Rating metrics
  average_rating: number;
  total_ratings: number;
  rating_distribution: {
    [key: number]: number; // rating (1-5) -> count
  };
  
  // Popularity metrics
  popularity_score: number; // Calculated score based on various factors
  trending_score: number; // Recent activity score
  
  // Conversion metrics
  view_to_selection_rate: number;
  selection_to_booking_rate: number;
  
  // Last updated
  last_updated: string;
}

export interface LocationFeedback {
  id: string;
  location_id: string;
  user_id?: string; // Optional for anonymous feedback
  feedback_type: FeedbackType;
  category?: RatingCategory;
  rating?: number; // 1-5 scale
  title: string;
  description: string;
  suggested_correction?: string;
  
  // Contact info for follow-up (optional)
  contact_email?: string;
  contact_phone?: string;
  
  // Status tracking
  status: FeedbackStatus;
  admin_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  ip_address?: string;
  user_agent?: string;
  
  // Verification
  is_verified: boolean;
  verification_method?: 'email' | 'phone' | 'admin';
}

export interface LocationRating {
  id: string;
  location_id: string;
  user_id?: string;
  
  // Overall rating
  overall_rating: number; // 1-5 scale
  
  // Category ratings
  category_ratings: {
    [K in RatingCategory]?: number;
  };
  
  // Review details
  review_title?: string;
  review_text?: string;
  
  // Visit details
  visit_date?: string;
  appointment_type?: 'consulta' | 'exame' | 'procedimento';
  
  // Metadata
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  is_verified: boolean;
}

export interface LocationPopularityMetrics {
  location_id: string;
  
  // Time-based popularity
  hourly_views: { [hour: string]: number };
  daily_views: { [date: string]: number };
  weekly_views: { [week: string]: number };
  
  // Demographic insights (anonymized)
  age_groups: { [range: string]: number };
  user_types: { [type: string]: number };
  
  // Geographic insights
  user_cities: { [city: string]: number };
  user_states: { [state: string]: number };
  
  // Device insights
  device_types: { mobile: number; desktop: number; tablet: number };
  
  // Referral sources
  referral_sources: { [source: string]: number };
  
  last_updated: string;
}

export interface LocationAnalyticsEvent {
  id: string;
  location_id: string;
  user_id?: string;
  session_id: string;
  
  // Event details
  event_type: 'view' | 'selection' | 'booking' | 'rating' | 'feedback' | 'share' | 'call' | 'map_view';
  event_data?: Record<string, any>;
  
  // Context
  page_url: string;
  referrer?: string;
  user_agent: string;
  ip_address?: string;
  
  // Geographic context
  user_location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  
  // Timing
  timestamp: string;
  session_duration?: number;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface LocationFeedbackSummary {
  location_id: string;
  
  // Feedback counts by type
  feedback_counts: {
    [K in FeedbackType]: number;
  };
  
  // Status distribution
  status_distribution: {
    [K in FeedbackStatus]: number;
  };
  
  // Recent feedback
  recent_feedback: LocationFeedback[];
  
  // Common issues
  common_issues: {
    type: FeedbackType;
    count: number;
    percentage: number;
  }[];
  
  // Resolution metrics
  average_resolution_time_hours: number;
  resolution_rate: number;
  
  last_updated: string;
}

export interface LocationAnalyticsFilter {
  date_from?: string;
  date_to?: string;
  event_types?: LocationAnalyticsEvent['event_type'][];
  user_types?: string[];
  cities?: string[];
  states?: string[];
  device_types?: ('mobile' | 'desktop' | 'tablet')[];
}

export interface LocationAnalyticsReport {
  location_id: string;
  location_name: string;
  report_period: {
    start_date: string;
    end_date: string;
  };
  
  // Summary metrics
  summary: {
    total_views: number;
    unique_visitors: number;
    total_selections: number;
    total_bookings: number;
    average_rating: number;
    total_feedback: number;
  };
  
  // Trends
  trends: {
    views_trend: { date: string; count: number }[];
    selections_trend: { date: string; count: number }[];
    bookings_trend: { date: string; count: number }[];
    rating_trend: { date: string; average: number }[];
  };
  
  // Top insights
  insights: {
    peak_hours: string[];
    popular_days: string[];
    top_referrers: string[];
    common_feedback_types: FeedbackType[];
  };
  
  // Recommendations
  recommendations: {
    type: 'improve_info' | 'update_hours' | 'add_facilities' | 'contact_verification';
    priority: 'high' | 'medium' | 'low';
    description: string;
    suggested_action: string;
  }[];
  
  generated_at: string;
}

// API Request/Response Types
export interface TrackLocationEventRequest {
  location_id: string;
  event_type: LocationAnalyticsEvent['event_type'];
  event_data?: Record<string, any>;
  user_context?: {
    user_id?: string;
    session_id: string;
    page_url: string;
    referrer?: string;
  };
}

export interface SubmitLocationFeedbackRequest {
  location_id: string;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  rating?: number;
  category?: RatingCategory;
  suggested_correction?: string;
  contact_email?: string;
  contact_phone?: string;
  is_anonymous?: boolean;
}

export interface SubmitLocationRatingRequest {
  location_id: string;
  overall_rating: number;
  category_ratings?: { [K in RatingCategory]?: number };
  review_title?: string;
  review_text?: string;
  visit_date?: string;
  appointment_type?: string;
  is_anonymous?: boolean;
}

export interface GetLocationAnalyticsRequest {
  location_id: string;
  filters?: LocationAnalyticsFilter;
  include_demographics?: boolean;
  include_trends?: boolean;
}

export interface GetLocationFeedbackRequest {
  location_id: string;
  status?: FeedbackStatus[];
  feedback_types?: FeedbackType[];
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'rating' | 'status';
  sort_order?: 'asc' | 'desc';
}

// Utility Types
export type LocationAnalyticsMetric = keyof Omit<LocationAnalytics, 'location_id' | 'last_updated'>;

export type FeedbackTypeLabel = {
  [K in FeedbackType]: string;
};

export type RatingCategoryLabel = {
  [K in RatingCategory]: string;
};

// Constants
export const FEEDBACK_TYPE_LABELS: FeedbackTypeLabel = {
  informacao_incorreta: 'Informação Incorreta',
  horario_errado: 'Horário de Funcionamento Errado',
  telefone_invalido: 'Telefone Inválido',
  endereco_errado: 'Endereço Incorreto',
  facilidades_incorretas: 'Facilidades Incorretas',
  outro: 'Outro'
};

export const RATING_CATEGORY_LABELS: RatingCategoryLabel = {
  localizacao: 'Localização',
  facilidades: 'Facilidades',
  atendimento: 'Atendimento',
  limpeza: 'Limpeza',
  acessibilidade: 'Acessibilidade'
};

export const RATING_LABELS = {
  1: 'Muito Ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente'
};

export default LocationAnalytics;