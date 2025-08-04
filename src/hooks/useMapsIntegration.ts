/**
 * Maps Integration Hook
 * Provides comprehensive maps functionality with state management
 */

import { useState, useCallback, useEffect } from 'react';
import { EnhancedLocation, LocationCoordinates } from '@/types/location';
import { mapsService, MapsProvider } from '@/services/mapsService';
import { toast } from '@/hooks/use-toast';

interface MapsState {
  loading: boolean;
  error: string | null;
  availableProviders: MapsProvider[];
  selectedProvider: MapsProvider;
  userLocation: LocationCoordinates | null;
  lastAction: string | null;
}

interface MapsActionResult {
  success: boolean;
  provider: MapsProvider;
  action: string;
  error?: string;
}

interface UseMapsIntegrationOptions {
  defaultProvider?: MapsProvider;
  enableUserLocation?: boolean;
  onActionComplete?: (result: MapsActionResult) => void;
}

export const useMapsIntegration = (options: UseMapsIntegrationOptions = {}) => {
  const {
    defaultProvider = 'google',
    enableUserLocation = true,
    onActionComplete
  } = options;

  const [state, setState] = useState<MapsState>({
    loading: true,
    error: null,
    availableProviders: [],
    selectedProvider: defaultProvider,
    userLocation: null,
    lastAction: null
  });

  // Initialize maps service
  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const providers = await mapsService.getAvailableProviders();
        let userLocation: LocationCoordinates | null = null;

        if (enableUserLocation) {
          userLocation = await mapsService.getCurrentLocation();
        }

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
          error: error instanceof Error ? error.message : 'Erro ao inicializar mapas'
        }));
      }
    };

    initialize();
  }, [defaultProvider, enableUserLocation]);

  // Open location in maps
  const openLocation = useCallback(async (
    location: EnhancedLocation,
    options: {
      provider?: MapsProvider;
      newWindow?: boolean;
      showToast?: boolean;
    } = {}
  ) => {
    const {
      provider = state.selectedProvider,
      newWindow = true,
      showToast = true
    } = options;

    try {
      setState(prev => ({ ...prev, lastAction: 'open_location' }));

      const result = await mapsService.openLocation(location, {
        provider,
        newWindow,
        fallbackOnError: true
      });

      const actionResult: MapsActionResult = {
        success: result.success,
        provider: result.provider,
        action: 'open_location',
        error: result.error
      };

      if (result.success) {
        if (showToast) {
          toast({
            title: "Mapa aberto",
            description: `Localização aberta no ${result.provider}`,
          });
        }
      } else {
        if (showToast) {
          toast({
            title: "Erro ao abrir mapa",
            description: result.error || "Tente novamente",
            variant: "destructive",
          });
        }
      }

      onActionComplete?.(actionResult);
      return actionResult;

    } catch (error) {
      const actionResult: MapsActionResult = {
        success: false,
        provider: state.selectedProvider,
        action: 'open_location',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };

      if (options.showToast !== false) {
        toast({
          title: "Erro ao abrir mapa",
          description: actionResult.error,
          variant: "destructive",
        });
      }

      onActionComplete?.(actionResult);
      return actionResult;
    }
  }, [state.selectedProvider, onActionComplete]);

  // Open directions to location
  const openDirections = useCallback(async (
    location: EnhancedLocation,
    options: {
      origin?: LocationCoordinates | string;
      provider?: MapsProvider;
      newWindow?: boolean;
      showToast?: boolean;
    } = {}
  ) => {
    const {
      origin = state.userLocation || undefined,
      provider = state.selectedProvider,
      newWindow = true,
      showToast = true
    } = options;

    try {
      setState(prev => ({ ...prev, lastAction: 'open_directions' }));

      const result = await mapsService.openDirections(location, {
        origin,
        provider,
        newWindow,
        fallbackOnError: true
      });

      const actionResult: MapsActionResult = {
        success: result.success,
        provider: result.provider,
        action: 'open_directions',
        error: result.error
      };

      if (result.success) {
        if (showToast) {
          toast({
            title: "Direções abertas",
            description: `Navegação iniciada no ${result.provider}`,
          });
        }
      } else {
        if (showToast) {
          toast({
            title: "Erro ao abrir direções",
            description: result.error || "Tente novamente",
            variant: "destructive",
          });
        }
      }

      onActionComplete?.(actionResult);
      return actionResult;

    } catch (error) {
      const actionResult: MapsActionResult = {
        success: false,
        provider: state.selectedProvider,
        action: 'open_directions',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };

      if (options.showToast !== false) {
        toast({
          title: "Erro ao abrir direções",
          description: actionResult.error,
          variant: "destructive",
        });
      }

      onActionComplete?.(actionResult);
      return actionResult;
    }
  }, [state.selectedProvider, state.userLocation, onActionComplete]);

  // Share location
  const shareLocation = useCallback(async (
    location: EnhancedLocation,
    method: 'system' | 'whatsapp' | 'sms' | 'email' | 'copy',
    options: {
      message?: string;
      includeDirections?: boolean;
      provider?: MapsProvider;
      showToast?: boolean;
    } = {}
  ) => {
    const {
      message,
      includeDirections = true,
      provider = state.selectedProvider,
      showToast = true
    } = options;

    try {
      setState(prev => ({ ...prev, lastAction: `share_${method}` }));

      const result = await mapsService.shareLocation(location, method, {
        message,
        includeDirections,
        provider
      });

      const actionResult: MapsActionResult = {
        success: result.success,
        provider,
        action: `share_${method}`,
        error: result.error
      };

      if (result.success) {
        if (showToast) {
          const methodLabels = {
            system: 'Compartilhado',
            whatsapp: 'WhatsApp aberto',
            sms: 'SMS aberto',
            email: 'Email aberto',
            copy: 'Copiado para área de transferência'
          };

          toast({
            title: "Localização compartilhada",
            description: methodLabels[method],
          });
        }
      } else {
        if (showToast) {
          toast({
            title: "Erro ao compartilhar",
            description: result.error || "Tente novamente",
            variant: "destructive",
          });
        }
      }

      onActionComplete?.(actionResult);
      return actionResult;

    } catch (error) {
      const actionResult: MapsActionResult = {
        success: false,
        provider: state.selectedProvider,
        action: `share_${method}`,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };

      if (options.showToast !== false) {
        toast({
          title: "Erro ao compartilhar",
          description: actionResult.error,
          variant: "destructive",
        });
      }

      onActionComplete?.(actionResult);
      return actionResult;
    }
  }, [state.selectedProvider, onActionComplete]);

  // Change provider
  const setProvider = useCallback((provider: MapsProvider) => {
    if (state.availableProviders.includes(provider)) {
      setState(prev => ({ ...prev, selectedProvider: provider }));
    }
  }, [state.availableProviders]);

  // Refresh user location
  const refreshUserLocation = useCallback(async () => {
    if (!enableUserLocation) return null;

    try {
      const location = await mapsService.getCurrentLocation();
      setState(prev => ({ ...prev, userLocation: location }));
      return location;
    } catch (error) {
      console.warn('Erro ao atualizar localização do usuário:', error);
      return null;
    }
  }, [enableUserLocation]);

  // Retry initialization
  const retry = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const providers = await mapsService.getAvailableProviders();
      let userLocation: LocationCoordinates | null = null;

      if (enableUserLocation) {
        userLocation = await mapsService.getCurrentLocation();
      }

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
        error: error instanceof Error ? error.message : 'Erro ao inicializar mapas'
      }));
    }
  }, [defaultProvider, enableUserLocation]);

  // Generate map URLs
  const generateMapUrl = useCallback((location: EnhancedLocation, provider?: MapsProvider) => {
    return mapsService.generateMapViewUrl(location, provider || state.selectedProvider);
  }, [state.selectedProvider]);

  const generateDirectionsUrl = useCallback((
    location: EnhancedLocation,
    origin?: LocationCoordinates | string,
    provider?: MapsProvider
  ) => {
    return mapsService.generateDirectionsUrl(
      location,
      origin || state.userLocation || undefined,
      provider || state.selectedProvider
    );
  }, [state.selectedProvider, state.userLocation]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    availableProviders: state.availableProviders,
    selectedProvider: state.selectedProvider,
    userLocation: state.userLocation,
    lastAction: state.lastAction,

    // Actions
    openLocation,
    openDirections,
    shareLocation,
    setProvider,
    refreshUserLocation,
    retry,

    // Utilities
    generateMapUrl,
    generateDirectionsUrl,

    // Computed
    isReady: !state.loading && !state.error && state.availableProviders.length > 0,
    hasUserLocation: !!state.userLocation,
    canUseDirections: !!state.userLocation || state.availableProviders.length > 0
  };
};

export type { MapsActionResult, MapsState };
export default useMapsIntegration;