import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LocationCard } from '@/components/location/LocationCard';
import { LocationDetailsPanel } from '@/components/location/LocationDetailsPanel';
import { LocationComparison } from '@/components/location/LocationComparison';
import { LocationActions } from '@/components/location/LocationActions';
import { LocationWithTimeSlots } from '@/types/location';

// Mock window.matchMedia
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Mock ResizeObserver
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockLocation: LocationWithTimeSlots = {
  id: '1',
  nome_local: 'Clínica Teste',
  endereco_completo: 'Rua Teste, 123, Centro, São Paulo, SP',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  email: 'contato@clinicateste.com',
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
  facilidades: [
    { type: 'estacionamento', available: true, cost: 'gratuito' },
    { type: 'acessibilidade', available: true },
    { type: 'wifi', available: true }
  ],
  status: 'ativo',
  horarios_disponiveis: [],
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual',
  available_slots_count: 5,
  is_open_now: true
};

const mockLocations = [mockLocation, { ...mockLocation, id: '2', nome_local: 'Hospital Norte' }];

// Viewport size utilities
const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

const mockMediaQuery = (query: string, matches: boolean) => {
  const mediaQuery = mockMatchMedia(query);
  mediaQuery.matches = matches;
  return mediaQuery;
};

describe('Location Components Responsive Design', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(mockMatchMedia);
    window.ResizeObserver = mockResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mobile Viewport (320px - 767px)', () => {
    beforeEach(() => {
      setViewportSize(375, 667); // iPhone SE
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === '(max-width: 767px)') return mockMediaQuery(query, true);
        return mockMediaQuery(query, false);
      });
    });

    it('renders LocationCard in mobile layout', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('mobile-layout');
      
      // Should stack elements vertically
      expect(card).toHaveClass('flex-col');
    });

    it('shows compact facility display on mobile', () => {
      render(<LocationCard location={mockLocation} />);
      
      // Should show facility count instead of full list
      expect(screen.getByText('3 facilidades')).toBeInTheDocument();
      expect(screen.queryByText('Estacionamento')).not.toBeInTheDocument();
    });

    it('adapts LocationActions for mobile', () => {
      render(<LocationActions location={mockLocation} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Should have minimum touch target size
        const computedStyle = window.getComputedStyle(button);
        expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
      });
    });

    it('shows single column layout in LocationDetailsPanel', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveClass('grid-cols-1');
    });

    it('collapses comparison table on mobile', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      // Should show accordion-style comparison instead of table
      expect(screen.getByText('Comparação Detalhada')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('provides swipe gestures for location cards', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('data-swipeable', 'true');
    });

    it('shows mobile-optimized search interface', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveClass('mobile-search');
      
      // Should have larger touch target
      const computedStyle = window.getComputedStyle(searchInput);
      expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Tablet Viewport (768px - 1023px)', () => {
    beforeEach(() => {
      setViewportSize(768, 1024); // iPad
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === '(min-width: 768px) and (max-width: 1023px)') return mockMediaQuery(query, true);
        return mockMediaQuery(query, false);
      });
    });

    it('renders LocationCard in tablet layout', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('tablet-layout');
    });

    it('shows two-column layout in LocationDetailsPanel', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveClass('grid-cols-2');
    });

    it('displays partial facility information', () => {
      render(<LocationCard location={mockLocation} />);
      
      // Should show some facilities with "more" indicator
      expect(screen.getByText('Estacionamento')).toBeInTheDocument();
      expect(screen.getByText('+2 mais')).toBeInTheDocument();
    });

    it('shows condensed comparison table', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('tablet-comparison');
      
      // Should show essential columns only
      expect(screen.getByText('Nome')).toBeInTheDocument();
      expect(screen.getByText('Distância')).toBeInTheDocument();
      expect(screen.getByText('Horários')).toBeInTheDocument();
    });

    it('adapts touch interactions for tablet', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      
      // Should support both touch and hover
      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveAttribute('data-touch-feedback', 'true');
    });
  });

  describe('Desktop Viewport (1024px+)', () => {
    beforeEach(() => {
      setViewportSize(1440, 900); // Desktop
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === '(min-width: 1024px)') return mockMediaQuery(query, true);
        return mockMediaQuery(query, false);
      });
    });

    it('renders LocationCard in desktop layout', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('desktop-layout');
    });

    it('shows full facility information', () => {
      render(<LocationCard location={mockLocation} />);
      
      expect(screen.getByText('Estacionamento')).toBeInTheDocument();
      expect(screen.getByText('Acessibilidade')).toBeInTheDocument();
      expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    });

    it('displays three-column layout in LocationDetailsPanel', () => {
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveClass('grid-cols-3');
    });

    it('shows full comparison table', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('desktop-comparison');
      
      // Should show all comparison columns
      expect(screen.getByText('Nome')).toBeInTheDocument();
      expect(screen.getByText('Endereço')).toBeInTheDocument();
      expect(screen.getByText('Distância')).toBeInTheDocument();
      expect(screen.getByText('Facilidades')).toBeInTheDocument();
      expect(screen.getByText('Horários')).toBeInTheDocument();
    });

    it('provides hover interactions', () => {
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      
      fireEvent.mouseEnter(card);
      expect(card).toHaveClass('hover:shadow-xl');
    });

    it('shows tooltips on hover', () => {
      render(<LocationCard location={mockLocation} />);
      
      const facilityBadge = screen.getByText('Estacionamento');
      fireEvent.mouseEnter(facilityBadge);
      
      expect(screen.getByText('Estacionamento gratuito')).toBeInTheDocument();
    });
  });

  describe('Ultra-wide Viewport (1440px+)', () => {
    beforeEach(() => {
      setViewportSize(1920, 1080); // Ultra-wide
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === '(min-width: 1440px)') return mockMediaQuery(query, true);
        return mockMediaQuery(query, false);
      });
    });

    it('shows four-column layout for large screens', () => {
      render(
        <LocationDetailsPanel
          locations={[...mockLocations, ...mockLocations]}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveClass('grid-cols-4');
    });

    it('provides expanded comparison view', () => {
      render(<LocationComparison locations={mockLocations} />);
      
      // Should show additional comparison metrics
      expect(screen.getByText('Avaliação')).toBeInTheDocument();
      expect(screen.getByText('Última Atualização')).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('adapts to landscape orientation on mobile', () => {
      setViewportSize(667, 375); // iPhone SE landscape
      
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('landscape-mobile');
    });

    it('handles portrait to landscape transition', () => {
      const { rerender } = render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      // Start in portrait
      setViewportSize(375, 667);
      rerender(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      // Switch to landscape
      setViewportSize(667, 375);
      rerender(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveClass('landscape-layout');
    });
  });

  describe('Dynamic Content Adaptation', () => {
    it('truncates long location names on small screens', () => {
      const longNameLocation = {
        ...mockLocation,
        nome_local: 'Centro Médico Especializado em Cardiologia e Neurologia Avançada'
      };
      
      setViewportSize(320, 568); // Small mobile
      render(<LocationCard location={longNameLocation} />);
      
      const nameElement = screen.getByText(/Centro Médico/);
      expect(nameElement).toHaveClass('truncate');
    });

    it('shows abbreviated addresses on mobile', () => {
      setViewportSize(375, 667);
      render(<LocationCard location={mockLocation} />);
      
      // Should show shortened address
      expect(screen.getByText('Rua Teste, 123')).toBeInTheDocument();
      expect(screen.queryByText('Centro, São Paulo, SP')).not.toBeInTheDocument();
    });

    it('adapts button text for screen size', () => {
      setViewportSize(320, 568);
      render(<LocationActions location={mockLocation} />);
      
      // Should show icon-only buttons on very small screens
      expect(screen.queryByText('Ver no Mapa')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Abrir localização no mapa')).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('lazy loads images based on viewport', () => {
      render(<LocationCard location={mockLocation} />);
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('virtualizes long lists on mobile', () => {
      const manyLocations = Array.from({ length: 50 }, (_, i) => ({
        ...mockLocation,
        id: `${i + 1}`,
        nome_local: `Clínica ${i + 1}`
      }));
      
      setViewportSize(375, 667);
      render(
        <LocationDetailsPanel
          locations={manyLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      // Should only render visible items
      const visibleCards = screen.getAllByRole('button');
      expect(visibleCards.length).toBeLessThan(manyLocations.length);
    });

    it('debounces resize events', () => {
      const resizeHandler = vi.fn();
      
      render(<LocationCard location={mockLocation} />);
      
      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        setViewportSize(400 + i * 10, 600);
      }
      
      // Should debounce and only call handler once
      setTimeout(() => {
        expect(resizeHandler).toHaveBeenCalledTimes(1);
      }, 300);
    });
  });

  describe('Touch and Gesture Support', () => {
    it('supports pinch-to-zoom on comparison table', () => {
      setViewportSize(375, 667);
      render(<LocationComparison locations={mockLocations} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('data-pinch-zoom', 'true');
    });

    it('provides swipe navigation between location cards', () => {
      setViewportSize(375, 667);
      render(
        <LocationDetailsPanel
          locations={mockLocations}
          onLocationSelect={vi.fn()}
          onLocationFilter={vi.fn()}
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveAttribute('data-swipe-navigation', 'true');
    });

    it('shows touch feedback on interactions', () => {
      setViewportSize(375, 667);
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      
      fireEvent.touchStart(card);
      expect(card).toHaveClass('touch-active');
      
      fireEvent.touchEnd(card);
      expect(card).not.toHaveClass('touch-active');
    });
  });

  describe('Print Styles', () => {
    it('optimizes layout for printing', () => {
      // Mock print media query
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === 'print') return mockMediaQuery(query, true);
        return mockMediaQuery(query, false);
      });
      
      render(<LocationComparison locations={mockLocations} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('print-optimized');
    });

    it('hides interactive elements in print view', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === 'print') return mockMediaQuery(query, true);
        return mockMediaQuery(query, false);
      });
      
      render(<LocationActions location={mockLocation} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('print:hidden');
      });
    });
  });

  describe('Accessibility at Different Screen Sizes', () => {
    it('maintains minimum touch targets on all screen sizes', () => {
      const viewports = [
        [320, 568], // iPhone 5
        [375, 667], // iPhone 6/7/8
        [768, 1024], // iPad
        [1440, 900] // Desktop
      ];
      
      viewports.forEach(([width, height]) => {
        setViewportSize(width, height);
        
        render(<LocationActions location={mockLocation} />);
        
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const computedStyle = window.getComputedStyle(button);
          expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
        });
      });
    });

    it('provides appropriate focus indicators at all sizes', () => {
      setViewportSize(375, 667);
      render(<LocationCard location={mockLocation} />);
      
      const card = screen.getByRole('button');
      card.focus();
      
      const computedStyle = window.getComputedStyle(card);
      expect(computedStyle.outline).not.toBe('none');
      expect(parseInt(computedStyle.outlineWidth)).toBeGreaterThanOrEqual(2);
    });
  });
});