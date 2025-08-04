import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LocationActions } from '@/components/location/LocationActions';
import { LocationMap } from '@/components/location/LocationMap';
import { mapsService } from '@/services/mapsService';
import { EnhancedLocation } from '@/types/location';

// Mock the maps service
vi.mock('@/services/mapsService', () => ({
  mapsService: {
    openLocationInMaps: vi.fn(),
    getDirections: vi.fn(),
    shareLocation: vi.fn(),
    isMapServiceAvailable: vi.fn(),
    initializeMap: vi.fn(),
    addMarker: vi.fn(),
    setCenter: vi.fn(),
    getDistance: vi.fn()
  }
}));

// Mock Google Maps API
const mockGoogleMaps = {
  Map: vi.fn().mockImplementation(() => ({
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    addListener: vi.fn()
  })),
  Marker: vi.fn().mockImplementation(() => ({
    setMap: vi.fn(),
    setPosition: vi.fn(),
    addListener: vi.fn()
  })),
  InfoWindow: vi.fn().mockImplementation(() => ({
    setContent: vi.fn(),
    open: vi.fn(),
    close: vi.fn()
  })),
  DirectionsService: vi.fn().mockImplementation(() => ({
    route: vi.fn()
  })),
  DirectionsRenderer: vi.fn().mockImplementation(() => ({
    setDirections: vi.fn(),
    setMap: vi.fn()
  })),
  LatLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
  places: {
    PlacesService: vi.fn().mockImplementation(() => ({
      nearbySearch: vi.fn(),
      getDetails: vi.fn()
    }))
  }
};

// Mock global google object
Object.defineProperty(window, 'google', {
  value: {
    maps: mockGoogleMaps
  },
  writable: true
});

const mockLocation: EnhancedLocation = {
  id: '1',
  nome_local: 'Clínica Teste',
  endereco_completo: 'Rua Teste, 123, Centro, São Paulo, SP',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  coordenadas: { lat: -23.5505, lng: -46.6333, precisao: 'exata' },
  horario_funcionamento: {
    segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
    terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
    quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
    domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
  },
  facilidades: [],
  status: 'ativo',
  horarios_disponiveis: [],
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual'
};

describe('Location Maps Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful map service availability
    vi.mocked(mapsService.isMapServiceAvailable).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LocationActions Maps Integration', () => {
    it('opens location in external maps app', async () => {
      vi.mocked(mapsService.openLocationInMaps).mockResolvedValue(true);

      render(<LocationActions location={mockLocation} />);

      const mapButton = screen.getByText('Ver no Mapa');
      fireEvent.click(mapButton);

      await waitFor(() => {
        expect(mapsService.openLocationInMaps).toHaveBeenCalledWith(
          mockLocation.coordenadas
        );
      });
    });

    it('handles maps service unavailable', async () => {
      vi.mocked(mapsService.isMapServiceAvailable).mockResolvedValue(false);
      vi.mocked(mapsService.openLocationInMaps).mockRejectedValue(
        new Error('Maps service not available')
      );

      render(<LocationActions location={mockLocation} />);

      const mapButton = screen.getByText('Ver no Mapa');
      fireEvent.click(mapButton);

      await waitFor(() => {
        expect(screen.getByText('Serviço de mapas indisponível')).toBeInTheDocument();
      });
    });

    it('falls back to address sharing when maps fail', async () => {
      vi.mocked(mapsService.openLocationInMaps).mockRejectedValue(
        new Error('Failed to open maps')
      );

      render(<LocationActions location={mockLocation} />);

      const mapButton = screen.getByText('Ver no Mapa');
      fireEvent.click(mapButton);

      await waitFor(() => {
        expect(screen.getByText('Copiar Endereço')).toBeInTheDocument();
      });
    });

    it('gets directions to location', async () => {
      const mockDirections = {
        routes: [{
          legs: [{
            distance: { text: '2.5 km', value: 2500 },
            duration: { text: '8 min', value: 480 }
          }]
        }]
      };

      vi.mocked(mapsService.getDirections).mockResolvedValue(mockDirections);

      render(<LocationActions location={mockLocation} showDirections={true} />);

      const directionsButton = screen.getByText('Como Chegar');
      fireEvent.click(directionsButton);

      await waitFor(() => {
        expect(mapsService.getDirections).toHaveBeenCalledWith(
          expect.any(Object), // user location
          mockLocation.coordenadas,
          'driving'
        );
      });

      expect(screen.getByText('2.5 km')).toBeInTheDocument();
      expect(screen.getByText('8 min')).toBeInTheDocument();
    });

    it('handles geolocation permission denied', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementation((success, error) => {
          error({ code: 1, message: 'Permission denied' });
        })
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      render(<LocationActions location={mockLocation} showDirections={true} />);

      const directionsButton = screen.getByText('Como Chegar');
      fireEvent.click(directionsButton);

      await waitFor(() => {
        expect(screen.getByText('Localização não disponível')).toBeInTheDocument();
      });
    });
  });

  describe('LocationMap Component Integration', () => {
    it('initializes map with location marker', async () => {
      vi.mocked(mapsService.initializeMap).mockResolvedValue(true);
      vi.mocked(mapsService.addMarker).mockResolvedValue('marker-id');

      render(
        <LocationMap
          location={mockLocation}
          zoom={15}
          showDirections={false}
        />
      );

      await waitFor(() => {
        expect(mapsService.initializeMap).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          mockLocation.coordenadas,
          15
        );
      });

      expect(mapsService.addMarker).toHaveBeenCalledWith(
        mockLocation.coordenadas,
        mockLocation.nome_local,
        expect.any(Object)
      );
    });

    it('shows multiple locations on map', async () => {
      const locations = [
        mockLocation,
        {
          ...mockLocation,
          id: '2',
          nome_local: 'Hospital Norte',
          coordenadas: { lat: -23.5405, lng: -46.6233, precisao: 'exata' as const }
        }
      ];

      render(
        <LocationMap
          locations={locations}
          zoom={12}
          showDirections={false}
        />
      );

      await waitFor(() => {
        expect(mapsService.addMarker).toHaveBeenCalledTimes(2);
      });
    });

    it('handles map loading errors', async () => {
      vi.mocked(mapsService.initializeMap).mockRejectedValue(
        new Error('Failed to load map')
      );

      render(
        <LocationMap
          location={mockLocation}
          zoom={15}
          showDirections={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar mapa')).toBeInTheDocument();
      });
    });

    it('shows directions on map', async () => {
      const mockDirections = {
        routes: [{
          legs: [{
            distance: { text: '2.5 km', value: 2500 },
            duration: { text: '8 min', value: 480 }
          }]
        }]
      };

      vi.mocked(mapsService.getDirections).mockResolvedValue(mockDirections);

      render(
        <LocationMap
          location={mockLocation}
          zoom={15}
          showDirections={true}
          userLocation={{ lat: -23.5555, lng: -46.6444, precisao: 'exata' }}
        />
      );

      await waitFor(() => {
        expect(mapsService.getDirections).toHaveBeenCalled();
      });
    });

    it('updates map when location changes', async () => {
      const { rerender } = render(
        <LocationMap
          location={mockLocation}
          zoom={15}
          showDirections={false}
        />
      );

      const newLocation = {
        ...mockLocation,
        id: '2',
        coordenadas: { lat: -23.5405, lng: -46.6233, precisao: 'exata' as const }
      };

      rerender(
        <LocationMap
          location={newLocation}
          zoom={15}
          showDirections={false}
        />
      );

      await waitFor(() => {
        expect(mapsService.setCenter).toHaveBeenCalledWith(newLocation.coordenadas);
      });
    });
  });

  describe('Maps Service Error Handling', () => {
    it('handles network connectivity issues', async () => {
      vi.mocked(mapsService.openLocationInMaps).mockRejectedValue(
        new Error('Network error')
      );

      render(<LocationActions location={mockLocation} />);

      const mapButton = screen.getByText('Ver no Mapa');
      fireEvent.click(mapButton);

      await waitFor(() => {
        expect(screen.getByText('Verifique sua conexão')).toBeInTheDocument();
      });
    });

    it('provides fallback when GPS is unavailable', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      render(<LocationActions location={mockLocation} showDirections={true} />);

      const directionsButton = screen.getByText('Como Chegar');
      fireEvent.click(directionsButton);

      await waitFor(() => {
        expect(screen.getByText('Digite seu endereço')).toBeInTheDocument();
      });
    });

    it('handles invalid coordinates gracefully', async () => {
      const invalidLocation = {
        ...mockLocation,
        coordenadas: { lat: NaN, lng: NaN, precisao: 'exata' as const }
      };

      render(<LocationActions location={invalidLocation} />);

      const mapButton = screen.getByText('Ver no Mapa');
      expect(mapButton).toBeDisabled();
    });
  });

  describe('Performance and Caching', () => {
    it('caches map instances for better performance', async () => {
      render(<LocationMap location={mockLocation} zoom={15} />);
      
      // Render same location again
      render(<LocationMap location={mockLocation} zoom={15} />);

      await waitFor(() => {
        // Should only initialize once due to caching
        expect(mapsService.initializeMap).toHaveBeenCalledTimes(1);
      });
    });

    it('debounces rapid location changes', async () => {
      const { rerender } = render(
        <LocationMap location={mockLocation} zoom={15} />
      );

      // Rapid location changes
      for (let i = 0; i < 5; i++) {
        const newLocation = {
          ...mockLocation,
          coordenadas: { 
            lat: -23.5505 + i * 0.001, 
            lng: -46.6333 + i * 0.001, 
            precisao: 'exata' as const 
          }
        };
        rerender(<LocationMap location={newLocation} zoom={15} />);
      }

      await waitFor(() => {
        // Should debounce and only call setCenter once
        expect(mapsService.setCenter).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('provides keyboard navigation for map controls', async () => {
      render(<LocationMap location={mockLocation} zoom={15} />);

      const mapContainer = screen.getByRole('application', { name: 'Mapa interativo' });
      expect(mapContainer).toHaveAttribute('tabIndex', '0');
      expect(mapContainer).toHaveAttribute('aria-label', 'Mapa mostrando localização de Clínica Teste');
    });

    it('announces location changes to screen readers', async () => {
      const { rerender } = render(
        <LocationMap location={mockLocation} zoom={15} />
      );

      const newLocation = {
        ...mockLocation,
        nome_local: 'Hospital Norte'
      };

      rerender(<LocationMap location={newLocation} zoom={15} />);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Mapa atualizado para Hospital Norte');
      });
    });
  });
});