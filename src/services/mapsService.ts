/**
 * Maps Service
 * Provides integration with various mapping services (Google Maps, OpenStreetMap, etc.)
 * Handles map display, directions, and location sharing functionality
 */

import { LocationCoordinates, EnhancedLocation } from '@/types/location';
import { formatAddress } from '@/utils/locationUtils';

// Maps provider types
export type MapsProvider = 'google' | 'openstreetmap' | 'apple' | 'waze';

// Maps service configuration
interface MapsConfig {
  defaultProvider: MapsProvider;
  fallbackProviders: MapsProvider[];
  googleMapsApiKey?: string;
}

// Maps URL generators for different providers
const MAPS_URLS = {
  google: {
    view: (coords: LocationCoordinates, address?: string) => {
      if (coords) {
        return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
      }
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
    },
    directions: (from: LocationCoordinates | string, to: LocationCoordinates | string) => {
      const origin = typeof from === 'string' ? encodeURIComponent(from) : `${from.lat},${from.lng}`;
      const destination = typeof to === 'string' ? encodeURIComponent(to) : `${to.lat},${to.lng}`;
      return `https://www.google.com/maps/dir/${origin}/${destination}`;
    }
  },
  openstreetmap: {
    view: (coords: LocationCoordinates, address?: string) => {
      if (coords) {
        return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}&zoom=16`;
      }
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address || '')}`;
    },
    directions: (from: LocationCoordinates | string, to: LocationCoordinates | string) => {
      const fromCoords = typeof from === 'string' ? null : from;
      const toCoords = typeof to === 'string' ? null : to;
      
      if (fromCoords && toCoords) {
        return `https://www.openstreetmap.org/directions?from=${fromCoords.lat}%2C${fromCoords.lng}&to=${toCoords.lat}%2C${toCoords.lng}`;
      }
      
      // Fallback to search if coordinates not available
      const query = typeof to === 'string' ? to : `${toCoords?.lat},${toCoords?.lng}`;
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
    }
  },
  apple: {
    view: (coords: LocationCoordinates, address?: string) => {
      if (coords) {
        return `http://maps.apple.com/?q=${coords.lat},${coords.lng}`;
      }
      return `http://maps.apple.com/?q=${encodeURIComponent(address || '')}`;
    },
    directions: (from: LocationCoordinates | string, to: LocationCoordinates | string) => {
      const destination = typeof to === 'string' ? encodeURIComponent(to) : `${to.lat},${to.lng}`;
      return `http://maps.apple.com/?daddr=${destination}`;
    }
  },
  waze: {
    view: (coords: LocationCoordinates, address?: string) => {
      if (coords) {
        return `https://waze.com/ul?ll=${coords.lat}%2C${coords.lng}&navigate=yes`;
      }
      return `https://waze.com/ul?q=${encodeURIComponent(address || '')}&navigate=yes`;
    },
    directions: (from: LocationCoordinates | string, to: LocationCoordinates | string) => {
      const destination = typeof to === 'string' ? encodeURIComponent(to) : `${to.lat},${to.lng}`;
      return `https://waze.com/ul?ll=${destination}&navigate=yes`;
    }
  }
};

// Default configuration
const DEFAULT_CONFIG: MapsConfig = {
  defaultProvider: 'google',
  fallbackProviders: ['openstreetmap', 'apple', 'waze']
};

class MapsService {
  private config: MapsConfig;

  constructor(config: Partial<MapsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect the best maps provider based on user agent and platform
   */
  private detectBestProvider(): MapsProvider {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // iOS devices prefer Apple Maps
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'apple';
    }
    
    // Android devices might prefer Google Maps
    if (/android/.test(userAgent)) {
      return 'google';
    }
    
    // Default to configured provider
    return this.config.defaultProvider;
  }

  /**
   * Check if a maps provider is available/supported
   */
  private async isProviderAvailable(provider: MapsProvider): Promise<boolean> {
    try {
      switch (provider) {
        case 'google':
          // Check if Google Maps is accessible
          return true; // Google Maps web is generally available
          
        case 'apple':
          // Apple Maps only works on iOS/macOS
          return /iphone|ipad|ipod|macintosh/.test(navigator.userAgent.toLowerCase());
          
        case 'waze':
          // Waze web is generally available
          return true;
          
        case 'openstreetmap':
          // OpenStreetMap is always available
          return true;
          
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get the URL for viewing a location on a map
   */
  public generateMapViewUrl(
    location: EnhancedLocation,
    provider?: MapsProvider
  ): string {
    const selectedProvider = provider || this.detectBestProvider();
    const urlGenerator = MAPS_URLS[selectedProvider];
    
    if (!urlGenerator) {
      throw new Error(`Provedor de mapas não suportado: ${selectedProvider}`);
    }
    
    const address = formatAddress(location);
    return urlGenerator.view(location.coordenadas!, address);
  }

  /**
   * Get the URL for directions to a location
   */
  public generateDirectionsUrl(
    destination: EnhancedLocation,
    origin?: LocationCoordinates | string,
    provider?: MapsProvider
  ): string {
    const selectedProvider = provider || this.detectBestProvider();
    const urlGenerator = MAPS_URLS[selectedProvider];
    
    if (!urlGenerator) {
      throw new Error(`Provedor de mapas não suportado: ${selectedProvider}`);
    }
    
    const destinationCoords = destination.coordenadas || formatAddress(destination);
    const originCoords = origin || 'current+location';
    
    return urlGenerator.directions(originCoords, destinationCoords);
  }

  /**
   * Open location in maps app with fallback handling
   */
  public async openLocation(
    location: EnhancedLocation,
    options: {
      provider?: MapsProvider;
      newWindow?: boolean;
      fallbackOnError?: boolean;
    } = {}
  ): Promise<{ success: boolean; provider: MapsProvider; error?: string }> {
    const {
      provider,
      newWindow = true,
      fallbackOnError = true
    } = options;

    const providersToTry = provider 
      ? [provider, ...this.config.fallbackProviders.filter(p => p !== provider)]
      : [this.detectBestProvider(), ...this.config.fallbackProviders];

    for (const currentProvider of providersToTry) {
      try {
        const isAvailable = await this.isProviderAvailable(currentProvider);
        if (!isAvailable) continue;

        const url = this.generateMapViewUrl(location, currentProvider);
        
        if (newWindow) {
          const opened = window.open(url, '_blank');
          if (!opened) {
            throw new Error('Popup bloqueado');
          }
        } else {
          window.location.href = url;
        }

        return {
          success: true,
          provider: currentProvider
        };

      } catch (error) {
        console.warn(`Falha ao abrir ${currentProvider}:`, error);
        
        if (!fallbackOnError) {
          return {
            success: false,
            provider: currentProvider,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
        
        // Continue to next provider
        continue;
      }
    }

    return {
      success: false,
      provider: providersToTry[0],
      error: 'Nenhum provedor de mapas disponível'
    };
  }

  /**
   * Open directions to location with fallback handling
   */
  public async openDirections(
    destination: EnhancedLocation,
    options: {
      origin?: LocationCoordinates | string;
      provider?: MapsProvider;
      newWindow?: boolean;
      fallbackOnError?: boolean;
    } = {}
  ): Promise<{ success: boolean; provider: MapsProvider; error?: string }> {
    const {
      origin,
      provider,
      newWindow = true,
      fallbackOnError = true
    } = options;

    const providersToTry = provider 
      ? [provider, ...this.config.fallbackProviders.filter(p => p !== provider)]
      : [this.detectBestProvider(), ...this.config.fallbackProviders];

    for (const currentProvider of providersToTry) {
      try {
        const isAvailable = await this.isProviderAvailable(currentProvider);
        if (!isAvailable) continue;

        const url = this.generateDirectionsUrl(destination, origin, currentProvider);
        
        if (newWindow) {
          const opened = window.open(url, '_blank');
          if (!opened) {
            throw new Error('Popup bloqueado');
          }
        } else {
          window.location.href = url;
        }

        return {
          success: true,
          provider: currentProvider
        };

      } catch (error) {
        console.warn(`Falha ao abrir direções em ${currentProvider}:`, error);
        
        if (!fallbackOnError) {
          return {
            success: false,
            provider: currentProvider,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
        
        // Continue to next provider
        continue;
      }
    }

    return {
      success: false,
      provider: providersToTry[0],
      error: 'Nenhum provedor de mapas disponível'
    };
  }

  /**
   * Share location via various methods
   */
  public async shareLocation(
    location: EnhancedLocation,
    method: 'system' | 'whatsapp' | 'sms' | 'email' | 'copy',
    options: {
      message?: string;
      includeDirections?: boolean;
      provider?: MapsProvider;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    const {
      message,
      includeDirections = false,
      provider
    } = options;

    try {
      const mapUrl = this.generateMapViewUrl(location, provider);
      const directionsUrl = includeDirections 
        ? this.generateDirectionsUrl(location, undefined, provider)
        : null;

      const shareContent = this.generateShareContent(location, {
        mapUrl,
        directionsUrl,
        customMessage: message
      });

      switch (method) {
        case 'system':
          if (!navigator.share) {
            throw new Error('Compartilhamento não suportado neste navegador');
          }
          
          await navigator.share({
            title: location.nome_local,
            text: shareContent.text,
            url: shareContent.url
          });
          break;

        case 'whatsapp': {
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareContent.fullText)}`;
          window.open(whatsappUrl, '_blank');
          break;
        }

        case 'sms': {
          const smsUrl = `sms:?body=${encodeURIComponent(shareContent.fullText)}`;
          window.location.href = smsUrl;
          break;
        }

        case 'email': {
          const emailSubject = encodeURIComponent(`Localização: ${location.nome_local}`);
          const emailBody = encodeURIComponent(shareContent.fullText);
          const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
          window.open(emailUrl);
          break;
        }

        case 'copy': {
          await navigator.clipboard.writeText(shareContent.fullText);
          break;
        }

        default:
          throw new Error(`Método de compartilhamento não suportado: ${method}`);
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao compartilhar'
      };
    }
  }

  /**
   * Generate share content for location
   */
  private generateShareContent(
    location: EnhancedLocation,
    options: {
      mapUrl: string;
      directionsUrl?: string | null;
      customMessage?: string;
    }
  ): {
    text: string;
    url: string;
    fullText: string;
  } {
    const { mapUrl, directionsUrl, customMessage } = options;
    
    let text = customMessage || `📍 ${location.nome_local}`;
    text += `\n📍 ${formatAddress(location)}`;
    
    if (location.telefone) {
      text += `\n📞 ${location.telefone}`;
    }
    
    const url = mapUrl;
    
    let fullText = text;
    fullText += `\n\n🗺️ Ver no mapa: ${mapUrl}`;
    
    if (directionsUrl) {
      fullText += `\n🧭 Como chegar: ${directionsUrl}`;
    }

    return { text, url, fullText };
  }

  /**
   * Get user's current location (with permission)
   */
  public async getCurrentLocation(): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            precisao: 'exata'
          });
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Get available maps providers for the current platform
   */
  public getAvailableProviders(): Promise<MapsProvider[]> {
    return Promise.all(
      Object.keys(MAPS_URLS).map(async (provider) => {
        const isAvailable = await this.isProviderAvailable(provider as MapsProvider);
        return isAvailable ? provider as MapsProvider : null;
      })
    ).then(providers => providers.filter(Boolean) as MapsProvider[]);
  }
}

// Export singleton instance
export const mapsService = new MapsService();

// Export types and utilities
export type { MapsConfig };