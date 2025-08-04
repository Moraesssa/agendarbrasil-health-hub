import React, { useState, useCallback } from 'react';
import { 
  X, 
  Navigation, 
  Share2, 
  MapPin,
  ExternalLink,
  Settings,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedLocation } from '@/types/location';
import { MapsProvider } from '@/services/mapsService';
import { useMapsIntegration } from '@/hooks/useMapsIntegration';
import { formatAddress } from '@/utils/locationUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocationMap } from './LocationMap';
import { toast } from '@/hooks/use-toast';

interface LocationMapModalProps {
  location: EnhancedLocation;
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: MapsProvider;
  className?: string;
}

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  location,
  isOpen,
  onClose,
  defaultProvider = 'google',
  className
}) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    loading,
    error,
    availableProviders,
    selectedProvider,
    userLocation,
    openLocation,
    openDirections,
    shareLocation,
    setProvider,
    isReady
  } = useMapsIntegration({
    defaultProvider,
    enableUserLocation: true
  });

  // Handle opening in external maps app
  const handleOpenExternal = useCallback(async () => {
    const result = await openLocation(location, {
      newWindow: true,
      showToast: true
    });

    if (result.success) {
      onClose();
    }
  }, [openLocation, location, onClose]);

  // Handle directions
  const handleDirections = useCallback(async () => {
    const result = await openDirections(location, {
      showToast: true
    });

    if (result.success) {
      onClose();
    }
  }, [openDirections, location, onClose]);

  // Handle sharing
  const handleShare = useCallback(async (method: 'system' | 'whatsapp' | 'copy' | 'email') => {
    await shareLocation(location, method, {
      includeDirections: true,
      showToast: true
    });
  }, [shareLocation, location]);

  // Provider labels
  const getProviderLabel = (provider: MapsProvider): string => {
    const labels = {
      google: 'Google Maps',
      openstreetmap: 'OpenStreetMap',
      apple: 'Apple Maps',
      waze: 'Waze'
    };
    return labels[provider] || provider;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl h-[80vh] p-0", className)}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-gray-900 truncate">
                {location.nome_local}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {formatAddress(location)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {/* Settings */}
              <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-700">
                    Provedor de Mapas
                  </div>
                  <DropdownMenuSeparator />
                  {availableProviders.map((provider) => (
                    <DropdownMenuItem
                      key={provider}
                      onClick={() => setProvider(provider)}
                      className={cn(
                        "cursor-pointer",
                        selectedProvider === provider && "bg-blue-50 text-blue-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{getProviderLabel(provider)}</span>
                        {selectedProvider === provider && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Close */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Map Content */}
        <div className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm text-gray-600">Carregando mapa...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200">
              <div className="text-center">
                <p className="text-red-600 font-medium">Erro ao carregar mapa</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <LocationMap
              location={location}
              height="100%"
              showControls={false}
              className="h-full"
            />
          )}
        </div>

        {/* Action Bar */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Location Info */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {location.coordenadas 
                  ? `${location.coordenadas.lat.toFixed(6)}, ${location.coordenadas.lng.toFixed(6)}`
                  : 'Coordenadas não disponíveis'
                }
              </span>
              {userLocation && (
                <>
                  <span>•</span>
                  <span>Sua localização detectada</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Share */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {navigator.share && (
                    <>
                      <DropdownMenuItem onClick={() => handleShare('system')}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => handleShare('copy')}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Copiar localização
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('email')}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Directions */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDirections}
                disabled={!isReady}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Como Chegar
              </Button>

              {/* Open External */}
              <Button
                onClick={handleOpenExternal}
                disabled={!isReady}
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no {getProviderLabel(selectedProvider)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing modal state
export const useLocationMapModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<EnhancedLocation | null>(null);

  const openModal = useCallback((loc: EnhancedLocation) => {
    setLocation(loc);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Keep location for a moment to avoid flickering
    setTimeout(() => setLocation(null), 300);
  }, []);

  return {
    isOpen,
    location,
    openModal,
    closeModal
  };
};

export default LocationMapModal;