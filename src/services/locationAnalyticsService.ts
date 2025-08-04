// Location Analytics Service Implementation
// replaced by kiro @2025-02-08T19:30:00Z

import { supabase } from '@/lib/supabase';
import {
  LocationAnalytics,
  LocationFeedback,
  LocationCorrection,
  LocationInteraction,
  LocationPopularityIndicator,
  FeedbackSubmission,
  AnalyticsFilters,
  LocationAnalyticsService
} from '@/types/locationAnalytics';

class LocationAnalyticsServiceImpl implements LocationAnalyticsService {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID for anonymous tracking
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('location_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('location_session_id', sessionId);
    }
    return sessionId;
  }

  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  // Analytics tracking methods
  async trackLocationView(locationId: string, metadata?: any): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      await this.trackLocationInteraction({
        locationId,
        userId,
        sessionId: this.sessionId,
        interactionType: 'view',
        metadata: {
          ...metadata,
          device: this.getDeviceType()
        }
      });

      // Update location view count
      await supabase.rpc('increment_location_views', { location_id: locationId });
    } catch (error) {
      console.error('Erro ao rastrear visualização da localização:', error);
    }
  }

  async trackLocationSelection(locationId: string, metadata?: any): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      
      await this.trackLocationInteraction({
        locationId,
        userId,
        sessionId: this.sessionId,
        interactionType: 'select',
        metadata: {
          ...metadata,
          device: this.getDeviceType()
        }
      });

      // Update location selection count
      await supabase.rpc('increment_location_selections', { location_id: locationId });
    } catch (error) {
      console.error('Erro ao rastrear seleção da localização:', error);
    }
  }

  async trackLocationInteraction(interaction: Omit<LocationInteraction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('location_interactions')
        .insert({
          ...interaction,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao rastrear interação com localização:', error);
    }
  }

  // Analytics retrieval methods
  async getLocationAnalytics(locationId: string): Promise<LocationAnalytics> {
    try {
      const { data, error } = await supabase
        .from('location_analytics')
        .select('*')
        .eq('location_id', locationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Return default analytics if none exist
        return {
          locationId,
          totalViews: 0,
          totalSelections: 0,
          selectionRate: 0,
          averageRating: 0,
          totalRatings: 0,
          popularityScore: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      return {
        locationId: data.location_id,
        totalViews: data.total_views || 0,
        totalSelections: data.total_selections || 0,
        selectionRate: data.selection_rate || 0,
        averageRating: data.average_rating || 0,
        totalRatings: data.total_ratings || 0,
        popularityScore: data.popularity_score || 0,
        lastUpdated: data.last_updated
      };
    } catch (error) {
      console.error('Erro ao buscar analytics da localização:', error);
      throw error;
    }
  }

  async getPopularityIndicators(locationIds: string[]): Promise<LocationPopularityIndicator[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_location_popularity_indicators', { location_ids: locationIds });

      if (error) throw error;

      return data.map((item: any) => ({
        locationId: item.location_id,
        popularityLevel: this.calculatePopularityLevel(item.popularity_score),
        popularityScore: item.popularity_score,
        trendDirection: item.trend_direction,
        recentSelections: item.recent_selections,
        comparisonToAverage: item.comparison_to_average
      }));
    } catch (error) {
      console.error('Erro ao buscar indicadores de popularidade:', error);
      return [];
    }
  }

  async getLocationInteractions(locationId: string, filters?: AnalyticsFilters): Promise<LocationInteraction[]> {
    try {
      let query = supabase
        .from('location_interactions')
        .select('*')
        .eq('location_id', locationId)
        .order('timestamp', { ascending: false });

      if (filters?.dateRange) {
        query = query
          .gte('timestamp', filters.dateRange.start)
          .lte('timestamp', filters.dateRange.end);
      }

      if (filters?.interactionTypes?.length) {
        query = query.in('interaction_type', filters.interactionTypes);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        locationId: item.location_id,
        userId: item.user_id,
        sessionId: item.session_id,
        interactionType: item.interaction_type,
        timestamp: item.timestamp,
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('Erro ao buscar interações da localização:', error);
      return [];
    }
  }

  // Feedback management methods
  async submitFeedback(feedback: FeedbackSubmission): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário deve estar logado para enviar feedback');
      }

      const feedbackData = {
        location_id: feedback.locationId,
        user_id: userId,
        rating: feedback.rating,
        comment: feedback.comment,
        feedback_type: feedback.feedbackType,
        category: feedback.category,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('location_feedback')
        .insert(feedbackData)
        .select('id')
        .single();

      if (error) throw error;

      // If this is a correction, also create a correction record
      if (feedback.feedbackType === 'correction' && feedback.correctionData) {
        await this.submitCorrection({
          locationId: feedback.locationId,
          userId,
          fieldName: feedback.correctionData.fieldName,
          currentValue: feedback.correctionData.currentValue,
          suggestedValue: feedback.correctionData.suggestedValue,
          description: feedback.comment
        });
      }

      // Update location analytics
      await supabase.rpc('update_location_rating', {
        location_id: feedback.locationId,
        new_rating: feedback.rating
      });

      return data.id;
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      throw error;
    }
  }

  async getLocationFeedback(locationId: string): Promise<LocationFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('location_feedback')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        locationId: item.location_id,
        userId: item.user_id,
        rating: item.rating,
        comment: item.comment,
        feedbackType: item.feedback_type,
        category: item.category,
        isVerified: item.is_verified,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Erro ao buscar feedback da localização:', error);
      return [];
    }
  }

  async submitCorrection(correction: Omit<LocationCorrection, 'id' | 'status' | 'createdAt'>): Promise<string> {
    try {
      const correctionData = {
        location_id: correction.locationId,
        user_id: correction.userId,
        field_name: correction.fieldName,
        current_value: correction.currentValue,
        suggested_value: correction.suggestedValue,
        description: correction.description,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('location_corrections')
        .insert(correctionData)
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Erro ao enviar correção:', error);
      throw error;
    }
  }

  // Rating methods
  async getLocationRating(locationId: string): Promise<{ average: number; count: number }> {
    try {
      const { data, error } = await supabase
        .rpc('get_location_rating_summary', { location_id: locationId });

      if (error) throw error;

      return {
        average: data?.average_rating || 0,
        count: data?.total_ratings || 0
      };
    } catch (error) {
      console.error('Erro ao buscar avaliação da localização:', error);
      return { average: 0, count: 0 };
    }
  }

  async getUserLocationRating(locationId: string, userId: string): Promise<LocationFeedback | null> {
    try {
      const { data, error } = await supabase
        .from('location_feedback')
        .select('*')
        .eq('location_id', locationId)
        .eq('user_id', userId)
        .eq('feedback_type', 'rating')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        id: data.id,
        locationId: data.location_id,
        userId: data.user_id,
        rating: data.rating,
        comment: data.comment,
        feedbackType: data.feedback_type,
        category: data.category,
        isVerified: data.is_verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar avaliação do usuário:', error);
      return null;
    }
  }

  // Helper methods
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private calculatePopularityLevel(score: number): 'baixa' | 'média' | 'alta' | 'muito_alta' {
    if (score >= 80) return 'muito_alta';
    if (score >= 60) return 'alta';
    if (score >= 40) return 'média';
    return 'baixa';
  }
}

// Export singleton instance
export const locationAnalyticsService = new LocationAnalyticsServiceImpl();
export default locationAnalyticsService;