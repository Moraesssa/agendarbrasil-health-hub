import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedLocation, LocationCoordinates } from '@/types/location';
import { mapsService, MapsProvider } from '@/services/mapsService';
import { formatAddress } from '@/utils/locationUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface LocationMapProps {
  location: EnhancedLocation;
  height?: string | number;
  showControls?: boolean;
  showProviderSelector?: boolean;
  defaultProvider?: MapsProvider;
  onMapOpen?: (provider: MapsProvider) => void;
  onDirectionsOpen?: (provider: MapsProvider) => void;
  className?: string;
}

interface MapState {
  loading: boolean;
  error: string | null;
  availableProviders: MapsProvider[];
  selectedProvider: MapsProvider;
  userLocation: LocationCoordinates | null;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  height = '300px',
  showControls = true,
  showProviderSelector = false,
  defaultProvider = 'google',
  onMapOpen,
  onDirectionsOpen,
  className
}) => {
  const [state, setState] = useState<MapState>({
    loading: true,
    error: null,
    availableProviders: [],
    selectedProvider: defaultProvider,
    userLocation: null
  });

  // Initialize available providers
  useEffect(() => {
    const initializeProviders = async () => {
      try {
        const providers = await mapsService.getAvailableProviders();
        const userLocation = await mapsService.getCurrentLocation();
        
        setState(prev => ({
          ...prev,
          loading: false,
          availableProviders: providers,
          selectedProvider: providers.includes(defaultProvider) ? defaultProvider : providers[0],
          userLocation
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar provedores de mapa'
        }));
      }
    };

    initializeProviders();
  }, [defaultProvider]);

  // Handle opening map in external app
  const handleOpenMap = useCallback(async () => {
    try {
      const result = await mapsService.openLocation(location, {
        provider: state.selectedProvider,
        newWindow: true,
        fallbackOnError: true
      });

      if (result.success) {
        onMapOpen?.(result.provider);
        toast({
          title: "Mapa aberto",
          description: `Localização aberta no ${result.provider}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro ao abrir mapa",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  }, [location, state.selectedProvider, onMapOpen]);

  // Handle opening directions
  const handleOpenDirections = useCallback(async () => {
    try {
      const result = await mapsService.openDirections(location, {
        origin: state.userLocation || undefined,
        provider: state.selectedProvider,
        newWindow: true,
        fallbackOnError: true
      });

      if (result.success) {
        onDirectionsOpen?.(result.provider);
        toast({
          title: "Direções abertas",
          description: `Navegação iniciada no ${result.provider}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro ao abrir direções",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  }, [location, state.selectedProvider, state.userLocation, onDirectionsOpen]);

  // Handle provider change
  const handleProviderChange = useCallback((provider: MapsProvider) => {
    setState(prev => ({ ...prev, selectedProvider: provider }));
  }, []);

  // Retry loading providers
  const handleRetry = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const providers = await mapsService.getAvailableProviders();
      const userLocation = await mapsService.getCurrentLocation();
      
      setState(prev => ({
        ...prev,
        loading: false,
        availableProviders: providers,
        selectedProvider: providers.includes(defaultProvider) ? defaultProvider : providers[0],
        userLocation
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar provedores de mapa'
      }));
    }
  }, [defaultProvider]);

  // Generate static map URL (for preview)
  const getStaticMapUrl = useCallback(() => {
    if (!location.coordenadas) return null;
    
    // Use a simple static map service (can be replaced with Google Static Maps API if available)
    const { lat, lng } = location.coordenadas;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-hospital+ff0000(${lng},${lat})/${lng},${lat},14,0/400x300@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
  }, [location.coordenadas]);

  if (state.loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div 
            className="flex items-center justify-center bg-gray-50 rounded-lg"
            style={{ height }}
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Carregando mapa...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div 
            className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200"
            style={{ height }}
          >
            <div className="flex flex-col items-center gap-3 text-red-600">
              <AlertTriangle className="h-8 w-8" />
              <span className="text-sm text-center">{state.error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const staticMapUrl = getStaticMapUrl();
  const hasCoordinates = !!location.coordenadas;

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          {/* Map Preview */}
          <div 
            className="relative bg-gray-100 rounded-lg overflow-hidden mb-4"
            style={{ height }}
          >
            {hasCoordinates && staticMapUrl ? (
              <img
                src={staticMapUrl}
                alt={`Mapa de ${location.nome_local}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if static map fails
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            
            {/* Fallback content */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-2 text-gray-500 p-4 text-center">
                <MapPin className="h-12 w-12" />
                <div>
                  <p className="font-medium text-gray-700">{location.nome_local}</p>
                  <p className="text-sm">{formatAddress(location)}</p>
                  {!hasCoordinates && (
                    <p className="text-xs mt-2 text-amber-600">
                      Coordenadas não disponíveis
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Open in full map overlay */}
            <div className="absolute top-2 right-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleOpenMap}
                    className="bg-white/90 hover:bg-white shadow-sm"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abrir no mapa</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex flex-col gap-3">
              {/* Provider Selector */}
              {showProviderSelector && state.availableProviders.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Provedor:</span>
                  <Select
                    value={state.selectedProvider}
                    onValueChange={handleProviderChange}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.availableProviders.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider === 'google' && 'Google Maps'}
                          {provider === 'openstreetmap' && 'OpenStreetMap'}
                          {provider === 'apple' && 'Apple Maps'}
                          {provider === 'waze' && 'Waze'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleOpenMap}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no Mapa
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleOpenDirections}
                  className="flex-1"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Como Chegar
                </Button>
              </div>

              {/* Location Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>📍 {formatAddress(location)}</p>
                {hasCoordinates && (
                  <p>🗺️ {location.coordenadas!.lat.toFixed(6)}, {location.coordenadas!.lng.toFixed(6)}</p>
                )}
                {state.userLocation && hasCoordinates && (
                  <p>📏 Distância será calculada no aplicativo de mapas</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

// Compact version for smaller spaces
export const LocationMapCompact: React.FC<Omit<LocationMapProps, 'height' | 'showControls'>> = (props) => (
  <LocationMap 
    {...props} 
    height="200px" 
    showControls={false}
  />
);

// Full-featured version with all controls
export const LocationMapFull: React.FC<LocationMapProps> = (props) => (
  <LocationMap 
    {...props} 
    showControls={true}
    showProviderSelector={true}
  />
);

export default LocationMap;