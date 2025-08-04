/**
 * Enhanced Location Service with Data Management
 * Provides comprehensive location data fetching, caching, validation, and real-time updates
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  EnhancedLocation, 
  LocationWithTimeSlots, 
  LocationSearchParams, 
  LocationApiResponse,
  LocationUpdateRequest,
  LocationError,
  LocationValidationResult,
  LocationStatus,
  LocationStatusChangeEvent,
  LocationDataUpdateEvent
} from '@/types/location';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const STALE_DATA_THRESHOLD = 30 * 60 * 1000; // 30 minutes

interface CachedLocationData {
  data: EnhancedLocation[];
  timestamp: number;
  version: string;
}

class EnhancedLocationService {
  private cache = new Map<string, CachedLocationData>();
  private subscriptions = new Map<string, any>();
  private validationRules = new Map<string, (value: any) => boolean>();

  constructor() {
    this.initializeValidationRules();
    this.setupRealtimeSubscriptions();
  }

  /**
   * Initialize validation rules for location data
   */
  private initializeValidationRules(): void {
    this.validationRules.set('nome_local', (value: string) => 
      typeof value === 'string' && value.trim().length >= 2
    );
    
    this.validationRules.set('endereco_completo', (value: string) => 
      typeof value === 'string' && value.trim().length >= 10
    );
    
    this.validationRules.set('telefone', (value?: string) => 
      !value || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value)
    );
    
    this.validationRules.set('coordenadas', (value?: any) => 
      !value || (
        typeof value.lat === 'number' && 
        typeof value.lng === 'number' &&
        value.lat >= -90 && value.lat <= 90 &&
        value.lng >= -180 && value.lng <= 180
      )
    );
  }

  /**
   * Setup real-time subscriptions for location updates
   */
  private setupRealtimeSubscriptions(): void {
    // Subscribe to location status changes
    const statusSubscription = supabase
      .channel('location_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'locais_atendimento',
          filter: 'status=neq.ativo'
        },
        (payload) => this.handleLocationStatusChange(payload)
      )
      .subscribe();

    this.subscriptions.set('status_changes', statusSubscription);

    // Subscribe to location data updates
    const dataSubscription = supabase
      .channel('location_data_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locais_atendimento'
        },
        (payload) => this.handleLocationDataUpdate(payload)
      )
      .subscribe();

    this.subscriptions.set('data_updates', dataSubscription);
  }

  /**
   * Handle real-time location status changes
   */
  private handleLocationStatusChange(payload: any): void {
    const event: LocationStatusChangeEvent = {
      location_id: payload.new.id,
      old_status: payload.old.status,
      new_status: payload.new.status,
      reason: payload.new.motivo_fechamento,
      timestamp: new Date().toISOString()
    };

    logger.info('Location status changed', 'enhancedLocationService', event);
    
    // Invalidate cache for affected location
    this.invalidateLocationCache(event.location_id);
    
    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('locationStatusChange', { detail: event }));
  }

  /**
   * Handle real-time location data updates
   */
  private handleLocationDataUpdate(payload: any): void {
    const event: LocationDataUpdateEvent = {
      location_id: payload.new.id,
      updated_fields: Object.keys(payload.new).filter(
        key => payload.old[key] !== payload.new[key]
      ) as (keyof EnhancedLocation)[],
      source: 'api',
      timestamp: new Date().toISOString()
    };

    logger.info('Location data updated', 'enhancedLocationService', event);
    
    // Invalidate cache for affected location
    this.invalidateLocationCache(event.location_id);
    
    // Emit custom event for components to listen
    window.dispatchEvent(new CustomEvent('locationDataUpdate', { detail: event }));
  }

  /**
   * Fetch enhanced locations with caching and validation
   */
  async getEnhancedLocations(params?: LocationSearchParams): Promise<LocationApiResponse> {
    const cacheKey = this.generateCacheKey(params);
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if valid and not stale
    if (cached && this.isCacheValid(cached)) {
      logger.info('Returning cached location data', 'enhancedLocationService', { cacheKey });
      return {
        locations: cached.data,
        total_count: cached.data.length,
        has_more: false,
        last_updated: new Date(cached.timestamp).toISOString()
      };
    }

    try {
      logger.info('Fetching fresh location data', 'enhancedLocationService', { params });
      
      let query = supabase
        .from('locais_atendimento_enhanced')
        .select(`
          *,
          facilidades:location_facilities(*),
          horarios_disponiveis:available_time_slots(*)
        `);

      // Apply filters
      if (params?.filters) {
        query = this.applyFilters(query, params.filters);
      }

      // Apply sorting
      if (params?.sort_by) {
        const order = params.sort_order || 'asc';
        query = query.order(params.sort_by, { ascending: order === 'asc' });
      }

      // Apply pagination
      if (params?.limit) {
        query = query.limit(params.limit);
        if (params.offset) {
          query = query.range(params.offset, params.offset + params.limit - 1);
        }
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to fetch enhanced locations', 'enhancedLocationService', error);
        throw this.createLocationError('SERVICE_UNAVAILABLE', error.message);
      }

      // Transform and validate data
      const locations = await this.transformAndValidateLocations(data || []);
      
      // Cache the results
      this.cacheLocationData(cacheKey, locations);

      return {
        locations,
        total_count: count || locations.length,
        has_more: (count || 0) > (params?.limit || locations.length),
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error fetching enhanced locations', 'enhancedLocationService', error);
      
      // Return stale cache data if available
      if (cached) {
        logger.warn('Returning stale cached data due to error', 'enhancedLocationService');
        return {
          locations: cached.data,
          total_count: cached.data.length,
          has_more: false,
          last_updated: new Date(cached.timestamp).toISOString()
        };
      }
      
      throw error;
    }
  }

  /**
   * Get location with time slots for appointment booking
   */
  async getLocationWithTimeSlots(locationId: string, date: string): Promise<LocationWithTimeSlots> {
    try {
      logger.info('Fetching location with time slots', 'enhancedLocationService', { locationId, date });

      const { data, error } = await supabase
        .from('locais_atendimento_enhanced')
        .select(`
          *,
          facilidades:location_facilities(*),
          horarios_disponiveis:available_time_slots!inner(*)
        `)
        .eq('id', locationId)
        .eq('horarios_disponiveis.date', date)
        .single();

      if (error) {
        logger.error('Failed to fetch location with time slots', 'enhancedLocationService', error);
        throw this.createLocationError('LOCATION_NOT_FOUND', `Location ${locationId} not found`);
      }

      const location = await this.transformToLocationWithTimeSlots(data);
      return location;

    } catch (error) {
      logger.error('Error fetching location with time slots', 'enhancedLocationService', error);
      throw error;
    }
  }

  /**
   * Validate location data integrity
   */
  async validateLocationData(location: Partial<EnhancedLocation>): Promise<LocationValidationResult> {
    const errors: LocationValidationResult['errors'] = [];
    const warnings: string[] = [];

    // Validate required fields
    const requiredFields: (keyof EnhancedLocation)[] = [
      'nome_local', 'endereco_completo', 'cidade', 'estado'
    ];

    for (const field of requiredFields) {
      if (!location[field]) {
        errors.push({
          field,
          message: `Campo obrigatório: ${field}`,
          severity: 'error'
        });
      }
    }

    // Validate field formats using validation rules
    for (const [field, validator] of this.validationRules.entries()) {
      const value = location[field as keyof EnhancedLocation];
      if (value !== undefined && !validator(value)) {
        errors.push({
          field: field as keyof EnhancedLocation,
          message: `Formato inválido para ${field}`,
          severity: 'error'
        });
      }
    }

    // Check data freshness
    if (location.ultima_atualizacao) {
      const lastUpdate = new Date(location.ultima_atualizacao);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdate.getTime();
      
      if (timeDiff > STALE_DATA_THRESHOLD) {
        warnings.push('Dados podem estar desatualizados');
      }
    }

    // Validate operating hours
    if (location.horario_funcionamento) {
      const hasValidHours = Object.values(location.horario_funcionamento).some(
        hours => !hours.fechado && hours.abertura && hours.fechamento
      );
      
      if (!hasValidHours) {
        warnings.push('Nenhum horário de funcionamento definido');
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Refresh location data and clear cache
   */
  async refreshLocationData(locationId?: string): Promise<void> {
    try {
      logger.info('Refreshing location data', 'enhancedLocationService', { locationId });

      if (locationId) {
        // Refresh specific location
        this.invalidateLocationCache(locationId);
        
        // Force refresh from database
        const { error } = await supabase
          .from('locais_atendimento')
          .update({ ultima_atualizacao: new Date().toISOString() })
          .eq('id', locationId);

        if (error) {
          logger.error('Failed to refresh location data', 'enhancedLocationService', error);
          throw error;
        }
      } else {
        // Clear all cache
        this.cache.clear();
        logger.info('All location cache cleared', 'enhancedLocationService');
      }

    } catch (error) {
      logger.error('Error refreshing location data', 'enhancedLocationService', error);
      throw error;
    }
  }

  /**
   * Update location information
   */
  async updateLocationData(request: LocationUpdateRequest): Promise<void> {
    try {
      logger.info('Updating location data', 'enhancedLocationService', request);

      // Validate updates
      const validation = await this.validateLocationData(request.updates);
      if (!validation.is_valid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Dados inválidos: ${errorMessages}`);
      }

      const { error } = await supabase
        .from('locais_atendimento')
        .update({
          ...request.updates,
          ultima_atualizacao: new Date().toISOString(),
          fonte_dados: request.source
        })
        .eq('id', request.location_id);

      if (error) {
        logger.error('Failed to update location data', 'enhancedLocationService', error);
        throw error;
      }

      // Invalidate cache
      this.invalidateLocationCache(request.location_id);
      
      logger.info('Location data updated successfully', 'enhancedLocationService', { 
        locationId: request.location_id 
      });

    } catch (error) {
      logger.error('Error updating location data', 'enhancedLocationService', error);
      throw error;
    }
  }

  /**
   * Check if location data is outdated
   */
  isLocationDataOutdated(location: EnhancedLocation): boolean {
    if (!location.ultima_atualizacao) return true;
    
    const lastUpdate = new Date(location.ultima_atualizacao);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();
    
    return timeDiff > STALE_DATA_THRESHOLD;
  }

  /**
   * Get location status with real-time updates
   */
  async getLocationStatus(locationId: string): Promise<{
    status: LocationStatus;
    is_open_now: boolean;
    next_opening?: string;
    last_updated: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('locais_atendimento')
        .select('status, horario_funcionamento, ultima_atualizacao')
        .eq('id', locationId)
        .single();

      if (error) {
        throw this.createLocationError('LOCATION_NOT_FOUND', `Location ${locationId} not found`);
      }

      const now = new Date();
      const currentDay = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const todayHours = data.horario_funcionamento?.[currentDay];
      const isOpenNow = todayHours && 
        !todayHours.fechado && 
        currentTime >= todayHours.abertura && 
        currentTime <= todayHours.fechamento;

      return {
        status: data.status,
        is_open_now: isOpenNow || false,
        last_updated: data.ultima_atualizacao
      };

    } catch (error) {
      logger.error('Error getting location status', 'enhancedLocationService', error);
      throw error;
    }
  }

  // Private helper methods

  private generateCacheKey(params?: LocationSearchParams): string {
    return `locations_${JSON.stringify(params || {})}`;
  }

  private isCacheValid(cached: CachedLocationData): boolean {
    const now = Date.now();
    return (now - cached.timestamp) < CACHE_DURATION;
  }

  private cacheLocationData(key: string, data: EnhancedLocation[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version: '1.0'
    });
  }

  private invalidateLocationCache(locationId?: string): void {
    if (locationId) {
      // Remove cache entries that might contain this location
      for (const [key] of this.cache.entries()) {
        this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  private applyFilters(query: any, filters: any): any {
    // Implementation would depend on actual database schema
    // This is a placeholder for filter application logic
    return query;
  }

  private async transformAndValidateLocations(rawData: any[]): Promise<EnhancedLocation[]> {
    const locations: EnhancedLocation[] = [];
    
    for (const item of rawData) {
      try {
        const location = await this.transformToEnhancedLocation(item);
        const validation = await this.validateLocationData(location);
        
        if (validation.is_valid) {
          locations.push(location);
        } else {
          logger.warn('Invalid location data skipped', 'enhancedLocationService', {
            locationId: item.id,
            errors: validation.errors
          });
        }
      } catch (error) {
        logger.error('Error transforming location data', 'enhancedLocationService', error);
      }
    }
    
    return locations;
  }

  private async transformToEnhancedLocation(data: any): Promise<EnhancedLocation> {
    // Transform raw database data to EnhancedLocation format
    // This would need to be implemented based on actual database schema
    return {
      id: data.id,
      nome_local: data.nome_local,
      endereco_completo: data.endereco_completo || '',
      bairro: data.bairro || '',
      cidade: data.cidade || '',
      estado: data.estado || '',
      cep: data.cep || '',
      telefone: data.telefone,
      whatsapp: data.whatsapp,
      email: data.email,
      website: data.website,
      coordenadas: data.coordenadas,
      horario_funcionamento: data.horario_funcionamento || {},
      facilidades: data.facilidades || [],
      status: data.status || 'ativo',
      motivo_fechamento: data.motivo_fechamento,
      previsao_reabertura: data.previsao_reabertura,
      horarios_disponiveis: data.horarios_disponiveis || [],
      ultima_atualizacao: data.ultima_atualizacao || new Date().toISOString(),
      verificado_em: data.verificado_em || new Date().toISOString(),
      fonte_dados: data.fonte_dados || 'manual',
      descricao: data.descricao,
      instrucoes_acesso: data.instrucoes_acesso,
      observacoes_especiais: data.observacoes_especiais
    } as EnhancedLocation;
  }

  private async transformToLocationWithTimeSlots(data: any): Promise<LocationWithTimeSlots> {
    const baseLocation = await this.transformToEnhancedLocation(data);
    
    return {
      ...baseLocation,
      available_slots_count: data.horarios_disponiveis?.length || 0,
      next_available_slot: data.horarios_disponiveis?.[0]?.time,
      is_open_now: false, // Would be calculated based on current time and operating hours
      distance_km: data.distance_km
    };
  }

  private createLocationError(code: LocationError['code'], message: string): LocationError {
    return {
      code,
      message,
      details: {}
    };
  }

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    for (const [key, subscription] of this.subscriptions.entries()) {
      subscription.unsubscribe();
      logger.info(`Unsubscribed from ${key}`, 'enhancedLocationService');
    }
    this.subscriptions.clear();
    this.cache.clear();
  }
}

// Export singleton instance
export const enhancedLocationService = new EnhancedLocationService();
export default enhancedLocationService;