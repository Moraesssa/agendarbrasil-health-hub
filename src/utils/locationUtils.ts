/**
 * Location Utility Functions
 * Provides validation, formatting, and helper functions for location data
 */

import { 
  EnhancedLocation, 
  LocationStatus, 
  LocationFacility, 
  FacilityType,
  LocationValidationResult,
  LocationCoordinates,
  OperatingHours,
  WeeklySchedule,
  LocationWithTimeSlots
} from '@/types/location';

// Validation Functions
export function validateLocation(location: Partial<EnhancedLocation>): LocationValidationResult {
  const errors: LocationValidationResult['errors'] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!location.nome_local?.trim()) {
    errors.push({
      field: 'nome_local',
      message: 'Nome do local é obrigatório',
      severity: 'error'
    });
  }

  if (!location.endereco_completo?.trim()) {
    errors.push({
      field: 'endereco_completo',
      message: 'Endereço completo é obrigatório',
      severity: 'error'
    });
  }

  // Phone validation
  if (location.telefone && !isValidPhoneNumber(location.telefone)) {
    errors.push({
      field: 'telefone',
      message: 'Formato de telefone inválido',
      severity: 'error'
    });
  }

  // Email validation
  if (location.email && !isValidEmail(location.email)) {
    errors.push({
      field: 'email',
      message: 'Formato de email inválido',
      severity: 'error'
    });
  }

  // Coordinates validation
  if (location.coordenadas && !isValidCoordinates(location.coordenadas)) {
    errors.push({
      field: 'coordenadas',
      message: 'Coordenadas inválidas',
      severity: 'error'
    });
  }

  // CEP validation
  if (location.cep && !isValidCEP(location.cep)) {
    errors.push({
      field: 'cep',
      message: 'Formato de CEP inválido',
      severity: 'warning'
    });
  }

  // Operating hours validation
  if (location.horario_funcionamento) {
    const hoursValidation = validateOperatingHours(location.horario_funcionamento);
    if (!hoursValidation.isValid) {
      errors.push({
        field: 'horario_funcionamento',
        message: hoursValidation.error || 'Horários de funcionamento inválidos',
        severity: 'warning'
      });
    }
  }

  // Data freshness warning
  if (location.ultima_atualizacao) {
    const daysSinceUpdate = getDaysSinceUpdate(location.ultima_atualizacao);
    if (daysSinceUpdate > 30) {
      warnings.push(`Dados não atualizados há ${daysSinceUpdate} dias`);
    }
  }

  return {
    is_valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings
  };
}

// Phone number validation (Brazilian format)
export function isValidPhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Brazilian phone: 10 or 11 digits (with area code)
  return /^(\d{10}|\d{11})$/.test(cleanPhone);
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// CEP validation (Brazilian postal code)
export function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return /^\d{8}$/.test(cleanCEP);
}

// Coordinates validation
export function isValidCoordinates(coords: LocationCoordinates): boolean {
  return (
    coords.lat >= -90 && coords.lat <= 90 &&
    coords.lng >= -180 && coords.lng <= 180
  );
}

// Operating hours validation
export function validateOperatingHours(schedule: WeeklySchedule): { isValid: boolean; error?: string } {
  const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
  
  for (const day of days) {
    const hours = schedule[day];
    if (!hours.fechado) {
      if (!isValidTimeFormat(hours.abertura) || !isValidTimeFormat(hours.fechamento)) {
        return { isValid: false, error: `Formato de horário inválido para ${day}` };
      }
      
      if (hours.almoco) {
        if (!isValidTimeFormat(hours.almoco.inicio) || !isValidTimeFormat(hours.almoco.fim)) {
          return { isValid: false, error: `Formato de horário de almoço inválido para ${day}` };
        }
      }
    }
  }
  
  return { isValid: true };
}

// Time format validation (HH:MM)
export function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

// Formatting Functions
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  
  return phone;
}

export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length === 8) {
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
  }
  return cep;
}

export function formatAddress(location: EnhancedLocation): string {
  const parts = [
    location.endereco_completo,
    location.bairro,
    location.cidade,
    location.estado
  ].filter(Boolean);
  
  return parts.join(', ');
}

// Status Functions
export function getLocationStatusLabel(status: LocationStatus): string {
  const labels = {
    ativo: 'Ativo',
    temporariamente_fechado: 'Temporariamente Fechado',
    manutencao: 'Em Manutenção'
  };
  
  return labels[status] || status;
}

export function getLocationStatusColor(status: LocationStatus): string {
  const colors = {
    ativo: 'green',
    temporariamente_fechado: 'yellow',
    manutencao: 'red'
  };
  
  return colors[status] || 'gray';
}

export function isLocationOpen(location: EnhancedLocation, date?: Date): boolean {
  if (location.status !== 'ativo') {
    return false;
  }
  
  const checkDate = date || new Date();
  const dayName = getDayName(checkDate);
  const currentTime = formatTime(checkDate);
  
  const daySchedule = location.horario_funcionamento[dayName];
  
  if (daySchedule.fechado) {
    return false;
  }
  
  const isAfterOpening = currentTime >= daySchedule.abertura;
  const isBeforeClosing = currentTime <= daySchedule.fechamento;
  
  // Check lunch break
  if (daySchedule.almoco) {
    const isDuringLunch = currentTime >= daySchedule.almoco.inicio && currentTime <= daySchedule.almoco.fim;
    if (isDuringLunch) {
      return false;
    }
  }
  
  return isAfterOpening && isBeforeClosing;
}

// Helper Functions
export function getDayName(date: Date): keyof WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[date.getDay()];
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function getDaysSinceUpdate(dateString: string): number {
  const updateDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updateDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Facility Functions
export function getFacilityLabel(type: FacilityType): string {
  const labels: Record<FacilityType, string> = {
    estacionamento: 'Estacionamento',
    acessibilidade: 'Acessibilidade',
    farmacia: 'Farmácia',
    laboratorio: 'Laboratório',
    wifi: 'Wi-Fi',
    ar_condicionado: 'Ar Condicionado',
    elevador: 'Elevador',
    cafe: 'Café/Lanchonete',
    banheiro_adaptado: 'Banheiro Adaptado',
    sala_espera_criancas: 'Sala de Espera Infantil'
  };
  
  return labels[type] || type;
}

export function getFacilityIcon(type: FacilityType): string {
  const icons: Record<FacilityType, string> = {
    estacionamento: 'parking-circle',
    acessibilidade: 'accessibility',
    farmacia: 'pill',
    laboratorio: 'test-tube',
    wifi: 'wifi',
    ar_condicionado: 'wind',
    elevador: 'move-vertical',
    cafe: 'coffee',
    banheiro_adaptado: 'accessibility',
    sala_espera_criancas: 'baby'
  };
  
  return icons[type] || 'circle';
}

export function getAvailableFacilities(location: EnhancedLocation): LocationFacility[] {
  return location.facilidades.filter(facility => facility.available);
}

export function hasFacility(location: EnhancedLocation, facilityType: FacilityType): boolean {
  return location.facilidades.some(
    facility => facility.type === facilityType && facility.available
  );
}

// Distance and Location Functions
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

// Data Transformation Functions
export function transformToLocationWithTimeSlots(location: EnhancedLocation): LocationWithTimeSlots {
  const availableSlots = location.horarios_disponiveis.filter(slot => slot.available);
  const nextSlot = availableSlots.sort((a, b) => a.time.localeCompare(b.time))[0];
  
  return {
    ...location,
    available_slots_count: availableSlots.length,
    next_available_slot: nextSlot?.time,
    is_open_now: isLocationOpen(location)
  };
}

// Search and Filter Functions
export function filterLocationsByFacilities(
  locations: EnhancedLocation[],
  requiredFacilities: FacilityType[]
): EnhancedLocation[] {
  return locations.filter(location =>
    requiredFacilities.every(facility => hasFacility(location, facility))
  );
}

export function sortLocationsByDistance(
  locations: LocationWithTimeSlots[],
  userLocation?: LocationCoordinates
): LocationWithTimeSlots[] {
  if (!userLocation) return locations;
  
  return locations
    .map(location => ({
      ...location,
      distance_km: location.coordenadas 
        ? calculateDistance(userLocation, location.coordenadas)
        : undefined
    }))
    .sort((a, b) => {
      if (!a.distance_km) return 1;
      if (!b.distance_km) return -1;
      return a.distance_km - b.distance_km;
    });
}

// URL and Sharing Functions (deprecated - use mapsService instead)
export function generateMapsUrl(location: EnhancedLocation): string {
  console.warn('generateMapsUrl is deprecated. Use mapsService.generateMapViewUrl instead.');
  
  if (location.coordenadas) {
    return `https://www.google.com/maps?q=${location.coordenadas.lat},${location.coordenadas.lng}`;
  }
  
  const address = encodeURIComponent(formatAddress(location));
  return `https://www.google.com/maps/search/?api=1&query=${address}`;
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
}

export function generateLocationShareMessage(
  location: EnhancedLocation,
  appointmentTime?: string
): string {
  let message = `📍 *${location.nome_local}*\n`;
  message += `📍 ${formatAddress(location)}\n`;
  
  if (location.telefone) {
    message += `📞 ${formatPhoneNumber(location.telefone)}\n`;
  }
  
  if (appointmentTime) {
    message += `🕐 Consulta: ${appointmentTime}\n`;
  }
  
  if (location.coordenadas) {
    message += `🗺️ Ver no mapa: ${generateMapsUrl(location)}`;
  }
  
  return message;
}