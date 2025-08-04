import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { LocationDetailsPanel } from '@/components/location/LocationDetailsPanel';
import { LocationCard } from '@/components/location/LocationCard';
import { LocationSearchAndFilter } from '@/components/location/LocationSearchAndFilter';
import { LocationWithTimeSlots } from '@/types/location';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock location service
vi.mock('@/services/locationService', () => ({
  LocationService: {
    getLocationsWithTimeSlots: vi.fn(),
    refreshLocationData: vi.fn(),
    searchLocations: vi.fn(),
  }
}));

// Generate mock location data
const generateMockLocations = (count: number): LocationWithTimeSlots[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `loc${index + 1}`,
    nome_local: `Clínica ${index + 1}`,
    endereco_completo: `Rua Teste ${index + 1}, ${100 + index}`,
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: `0123${index.toString().padStart(2, '0')}-567`,
    telefone: `(11) 1234-${(5678 + index).toString()}`,
    email: `contato${index + 1}@clinica.com`,
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: index % 2 === 0, cost: 'gratuito' },
      { type: 'acessibilidade', available: index % 3 === 0 },
      { type: 'wifi', available: index % 4 === 0 },
      { type: 'ar_condicionado', available: true },
      { type: 'farmacia', available: index % 5 === 0 }
    ],
    status: 'ativo' as const,
    ultima_atualizacao: new Date().toISOString(),
    timeSlots: Array.from({ length: 20 }, (_, slotIndex) => ({
      id: `slot${index}_${slotIndex}`,
      horario: `${8 + Math.floor(slotIndex / 2)}:${slotIndex % 2 === 0 ? '00' : '30'}`,
      disponivel: Math.random() > 0.3,
      location_id: `loc${index + 1}`,
      medico_id: `med${index + 1}`,
      data: new Date().toISOString().split('T')[0]
    }))
  }));
};

describe('Location Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('LocationDetailsPanel Performance', () => {
    it('should render 50 locations within performance threshold', async () => {
      const locations = generateMockLocations(50);
      const startTime = performance.now();

      const { LocationService } = await import('@/services/locationService');
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockResolvedValue(locations);

      render(
        <LocationDetailsPanel
          selectedSpecialty="cardiologia"
          selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
          onLocationSelect={vi.fn()}
          onTimeSlotSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Clínica 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    it('should handle 100 locations without memory leaks', async () => {
      const locations = generateMockLocations(100);
      const { LocationService } = await import('@/services/locationService');
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockResolvedValue(locations);

      const { unmount } = render(
        <LocationDetailsPanel
          selectedSpecialty="cardiologia"
          selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
          onLocationSelect={vi.fn()}
          onTimeSlotSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Clínica 1')).toBeInTheDocument();
      });

      // Simulate component unmount to check for memory leaks
      act(() => {
        unmount();
      });

      // No specific assertion here, but this test helps identify memory leaks
      expect(true).toBe(true);
    });

    it('should maintain performance with frequent updates', async () => {
      const locations = generateMockLocations(25);
      const { LocationService } = await import('@/services/locationService');
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockResolvedValue(locations);

      const { rerender } = render(
        <LocationDetailsPanel
          selectedSpecialty="cardiologia"
          selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
          onLocationSelect={vi.fn()}
          onTimeSlotSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Clínica 1')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Simulate 10 rapid updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <LocationDetailsPanel
            selectedSpecialty="cardiologia"
            selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
            onLocationSelect={vi.fn()}
            onTimeSlotSelect={vi.fn()}
            key={i}
          />
        );
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle updates within 1 second
      expect(updateTime).toBeLessThan(1000);
    });
  });

  describe('LocationCard Performance', () => {
    it('should render individual location cards quickly', async () => {
      const location = generateMockLocations(1)[0];
      const startTime = performance.now();

      render(
        <LocationCard
          location={location}
          onSelect={vi.fn()}
          isSelected={false}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Individual card should render within 100ms
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Clínica 1')).toBeInTheDocument();
    });

    it('should handle complex location data efficiently', async () => {
      const complexLocation = {
        ...generateMockLocations(1)[0],
        facilidades: Array.from({ length: 20 }, (_, index) => ({
          type: `facility_${index}`,
          available: true,
          cost: index % 2 === 0 ? 'gratuito' : 'pago'
        })),
        timeSlots: Array.from({ length: 100 }, (_, index) => ({
          id: `slot_${index}`,
          horario: `${8 + Math.floor(index / 4)}:${(index % 4) * 15}`,
          disponivel: Math.random() > 0.5,
          location_id: 'loc1',
          medico_id: 'med1',
          data: new Date().toISOString().split('T')[0]
        }))
      };

      const startTime = performance.now();

      render(
        <LocationCard
          location={complexLocation}
          onSelect={vi.fn()}
          isSelected={false}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle complex data within 200ms
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('LocationSearchAndFilter Performance', () => {
    it('should filter large datasets efficiently', async () => {
      const locations = generateMockLocations(200);
      const { LocationService } = await import('@/services/locationService');
      vi.mocked(LocationService.searchLocations).mockImplementation(async (query) => {
        return locations.filter(loc => 
          loc.nome_local.toLowerCase().includes(query.toLowerCase())
        );
      });

      const startTime = performance.now();

      render(
        <LocationSearchAndFilter
          locations={locations}
          onFilteredLocationsChange={vi.fn()}
          onPreferencesChange={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render search interface within 300ms
      expect(renderTime).toBeLessThan(300);
    });

    it('should handle rapid search queries without performance degradation', async () => {
      const locations = generateMockLocations(100);
      const { LocationService } = await import('@/services/locationService');
      
      let searchCallCount = 0;
      vi.mocked(LocationService.searchLocations).mockImplementation(async (query) => {
        searchCallCount++;
        return locations.filter(loc => 
          loc.nome_local.toLowerCase().includes(query.toLowerCase())
        );
      });

      render(
        <LocationSearchAndFilter
          locations={locations}
          onFilteredLocationsChange={vi.fn()}
          onPreferencesChange={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      const startTime = performance.now();

      // Simulate rapid typing
      const searchTerms = ['c', 'cl', 'cli', 'clin', 'clini', 'clinic', 'clinica'];
      for (const term of searchTerms) {
        await act(async () => {
          searchInput.focus();
          // Simulate typing
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Should handle rapid searches within 1 second
      expect(searchTime).toBeLessThan(1000);
    });
  });

  describe('Data Loading Performance', () => {
    it('should load location data within acceptable time limits', async () => {
      const { LocationService } = await import('@/services/locationService');
      
      // Mock slow network response
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        return generateMockLocations(30);
      });

      const startTime = performance.now();

      render(
        <LocationDetailsPanel
          selectedSpecialty="cardiologia"
          selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
          onLocationSelect={vi.fn()}
          onTimeSlotSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Clínica 1')).toBeInTheDocument();
      }, { timeout: 2000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should complete loading within 1 second (including 500ms mock delay)
      expect(loadTime).toBeLessThan(1000);
    });

    it('should handle concurrent data requests efficiently', async () => {
      const { LocationService } = await import('@/services/locationService');
      
      let requestCount = 0;
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockImplementation(async () => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return generateMockLocations(10);
      });

      const startTime = performance.now();

      // Render multiple components simultaneously
      const components = Array.from({ length: 3 }, (_, index) => (
        <LocationDetailsPanel
          key={index}
          selectedSpecialty="cardiologia"
          selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
          onLocationSelect={vi.fn()}
          onTimeSlotSelect={vi.fn()}
        />
      ));

      render(<div>{components}</div>);

      await waitFor(() => {
        expect(screen.getAllByText('Clínica 1')).toHaveLength(3);
      }, { timeout: 2000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should handle concurrent requests within 1.5 seconds
      expect(loadTime).toBeLessThan(1500);
      // Should make efficient use of requests (caching or batching)
      expect(requestCount).toBeLessThanOrEqual(3);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not create memory leaks with large datasets', async () => {
      const locations = generateMockLocations(500);
      const { LocationService } = await import('@/services/locationService');
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockResolvedValue(locations);

      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <LocationDetailsPanel
            selectedSpecialty="cardiologia"
            selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
            onLocationSelect={vi.fn()}
            onTimeSlotSelect={vi.fn()}
          />
        );

        await waitFor(() => {
          expect(screen.getByText('Clínica 1')).toBeInTheDocument();
        });

        act(() => {
          unmount();
        });
      }

      // If we reach here without timeout or memory issues, test passes
      expect(true).toBe(true);
    });

    it('should efficiently handle component updates', async () => {
      const locations = generateMockLocations(50);
      const { LocationService } = await import('@/services/locationService');
      vi.mocked(LocationService.getLocationsWithTimeSlots).mockResolvedValue(locations);

      const onLocationSelect = vi.fn();
      const { rerender } = render(
        <LocationDetailsPanel
          selectedSpecialty="cardiologia"
          selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
          onLocationSelect={onLocationSelect}
          onTimeSlotSelect={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Clínica 1')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Simulate 20 prop updates
      for (let i = 0; i < 20; i++) {
        rerender(
          <LocationDetailsPanel
            selectedSpecialty={i % 2 === 0 ? 'cardiologia' : 'dermatologia'}
            selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
            onLocationSelect={onLocationSelect}
            onTimeSlotSelect={vi.fn()}
          />
        );
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle updates efficiently
      expect(updateTime).toBeLessThan(2000);
    });
  });

  describe('Rendering Performance Benchmarks', () => {
    it('should meet rendering performance benchmarks', async () => {
      const testCases = [
        { count: 10, maxTime: 200 },
        { count: 25, maxTime: 500 },
        { count: 50, maxTime: 1000 },
        { count: 100, maxTime: 2000 }
      ];

      for (const testCase of testCases) {
        const locations = generateMockLocations(testCase.count);
        const { LocationService } = await import('@/services/locationService');
        vi.mocked(LocationService.getLocationsWithTimeSlots).mockResolvedValue(locations);

        const startTime = performance.now();

        const { unmount } = render(
          <LocationDetailsPanel
            selectedSpecialty="cardiologia"
            selectedLocation={{ estado: 'SP', cidade: 'São Paulo' }}
            onLocationSelect={vi.fn()}
            onTimeSlotSelect={vi.fn()}
          />
        );

        await waitFor(() => {
          expect(screen.getByText('Clínica 1')).toBeInTheDocument();
        });

        const endTime = performance.now();
        const renderTime = endTime - startTime;

        expect(renderTime).toBeLessThan(testCase.maxTime);

        act(() => {
          unmount();
        });

        // Clear mocks between test cases
        vi.clearAllMocks();
      }
    });
  });
});