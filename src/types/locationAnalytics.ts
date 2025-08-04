// Location Analytics and Feedback Types
// replaced by kiro @2025-02-08T19:30:00Z

export interface LocationAnalytics {
  locationId: string;
  totalViews: number;
  totalSelections: number;
  selectionRate: number; // selections / views
  averageRating: number;
  totalRatings: number;
  popularityScore: number; // calculated score based on various factors
  lastUpdated: string;
}

export interface LocationFeedback {
  id: string;
  locationId: string;
  userId: string;
  rating: number; // 1-5 stars
  comment?: string;
  feedbackType: 'rating' | 'correction' | 'suggestion';
  category?: 'facilities' | 'contact' | 'hours' | 'accessibility' | 'general';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCorrection {
  id: string;
  locationId: string;
  userId: string;
  fieldName: string; // which field needs correction
  currentValue: string;
  suggestedValue: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LocationInteraction {
  id: string;
  locationId: string;
  userId?: string; // optional for anonymous tracking
  sessionId: string;
  interactionType: 'view' | 'select' | 'call' | 'map' | 'share' | 'compare';
  timestamp: string;
  metadata?: {
    duration?: number; // time spent viewing
    source?: string; // how they got to this location
    device?: 'mobile' | 'tablet' | 'desktop';
  };
}

export interface LocationPopularityIndicator {
  locationId: string;
  popularityLevel: 'baixa' | 'média' | 'alta' | 'muito_alta';
  popularityScore: number;
  trendDirection: 'crescendo' | 'estável' | 'decrescendo';
  recentSelections: number; // last 7 days
  comparisonToAverage: number; // percentage above/below average
}

export interface FeedbackSubmission {
  locationId: string;
  rating?: number;
  comment?: string;
  feedbackType: 'rating' | 'correction' | 'suggestion';
  category?: string;
  correctionData?: {
    fieldName: string;
    currentValue: string;
    suggestedValue: string;
  };
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  locationIds?: string[];
  interactionTypes?: string[];
  deviceTypes?: string[];
}

export interface LocationAnalyticsService {
  // Analytics tracking
  trackLocationView: (locationId: string, metadata?: any) => Promise<void>;
  trackLocationSelection: (locationId: string, metadata?: any) => Promise<void>;
  trackLocationInteraction: (interaction: Omit<LocationInteraction, 'id' | 'timestamp'>) => Promise<void>;
  
  // Analytics retrieval
  getLocationAnalytics: (locationId: string) => Promise<LocationAnalytics>;
  getPopularityIndicators: (locationIds: string[]) => Promise<LocationPopularityIndicator[]>;
  getLocationInteractions: (locationId: string, filters?: AnalyticsFilters) => Promise<LocationInteraction[]>;
  
  // Feedback management
  submitFeedback: (feedback: FeedbackSubmission) => Promise<string>;
  getLocationFeedback: (locationId: string) => Promise<LocationFeedback[]>;
  submitCorrection: (correction: Omit<LocationCorrection, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  
  // Ratings
  getLocationRating: (locationId: string) => Promise<{ average: number; count: number }>;
  getUserLocationRating: (locationId: string, userId: string) => Promise<LocationFeedback | null>;
}ort interface LocationAnalytics {
  locationId: string;
  totalViews: number;
  totalSelections: number;
  selectionRate: number; // selections / views
  averageRating: number;
  totalRatings: number;
  popularityScore: number; // calculated score based on various factors
  lastUpdated: string;
}

export interface LocationFeedback {
  id: string;
  locationId: string;
  userId: string;
  rating: number; // 1-5 stars
  comment?: string;
  feedbackType: 'rating' | 'correction' | 'suggestion';
  category?: 'facilities' | 'contact' | 'hours' | 'accessibility' | 'general';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCorrection {
  id: string;
  locationId: string;
  userId: string;
  fieldName: string; // which field needs correction
  currentValue: string;
  suggestedValue: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LocationInteraction {
  id: string;
  locationId: string;
  userId?: string; // optional for anonymous tracking
  sessionId: string;
  interactionType: 'view' | 'select' | 'call' | 'map' | 'share' | 'compare';
  timestamp: string;
  metadata?: {
    duration?: number; // time spent viewing
    source?: string; // how they got to this location
    device?: 'mobile' | 'tablet' | 'desktop';
  };
}

export interface LocationPopularityIndicator {
  locationId: string;
  popularityLevel: 'baixa' | 'média' | 'alta' | 'muito_alta';
  popularityScore: number;
  trendDirection: 'crescendo' | 'estável' | 'decrescendo';
  recentSelections: number; // last 7 days
  comparisonToAverage: number; // percentage above/below average
}

export interface FeedbackSubmission {
  locationId: string;
  rating?: number;
  comment?: string;
  feedbackType: 'rating' | 'correction' | 'suggestion';
  category?: string;
  correctionData?: {
    fieldName: string;
    currentValue: string;
    suggestedValue: string;
  };
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  locationIds?: string[];
  interactionTypes?: string[];
  deviceTypes?: string[];
}

export interface LocationAnalyticsService {
  // Analytics tracking
  trackLocationView: (locationId: string, metadata?: any) => Promise<void>;
  trackLocationSelection: (locationId: string, metadata?: any) => Promise<void>;
  trackLocationInteraction: (interaction: Omit<LocationInteraction, 'id' | 'timestamp'>) => Promise<void>;
  
  // Analytics retrieval
  getLocationAnalytics: (locationId: string) => Promise<LocationAnalytics>;
  getPopularityIndicators: (locationIds: string[]) => Promise<LocationPopularityIndicator[]>;
  getLocationInteractions: (locationId: string, filters?: AnalyticsFilters) => Promise<LocationInteraction[]>;
  
  // Feedback management
  submitFeedback: (feedback: FeedbackSubmission) => Promise<string>;
  getLocationFeedback: (locationId: string) => Promise<LocationFeedback[]>;
  submitCorrection: (correction: Omit<LocationCorrection, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  
  // Ratings
  getLocationRating: (locationId: string) => Promise<{ average: number; count: number }>;
  getUserLocationRating: (locationId: string, userId: string) => Promise<LocationFeedback | null>;
}