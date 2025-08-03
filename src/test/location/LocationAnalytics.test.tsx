import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// replaced by kiro @2025-02-08T19:45:00Z
import { LocationAnalytics } from '@/components/location/LocationAnalytics';
import { LocationAnalyticsService } from '@/services/locationAnalyticsService';
import { LocationAnalytics as LocationAnalyticsType } from '@/types/location';

// Mock the analytics service
vi.mock('@/services/locationAnalyticsService', () => ({
  LocationAnalyticsService: {
    trackLocationView: vi.fn(),
    trackLocationSelection: vi.fn(),
    getLocationAnalytics: vi.fn(),
    submitFeedback: vi.fn(),
    getLocationRating: vi.fn(),
  }
}));

const mockAnalytics: LocationAnalyticsType = {
  locationId: 'loc1',
  views: 150,
  selections: 45,
  averageRating: 4.2,
  totalRatings: 23,
  lastViewed: new Date('2024-02-01T10:00:00Z').toISOString(),
  popularityScore: 0.85,
  trends: {
    viewsLastWeek: 35,
    selectionsLastWeek: 12,
    ratingTrend: 'increasing'
  }
};

describe('LocationAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LocationAnalyticsService.getLocationAnalytics as any).mockResolvedValue(mockAnalytics);
  });

  it('renders analytics data correctly', async () => {
    render(<LocationAnalytics locationId="loc1" />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // views
      expect(screen.getByText('45')).toBeInTheDocument(); // selections
      expect(screen.getByText('4.2')).toBeInTheDocument(); // rating
      expect(screen.getByText('23 avaliações')).toBeInTheDocument();
    });
  });

  it('displays popularity indicator', async () => {
    render(<LocationAnalytics locationId="loc1" />);
    
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument(); // popularity score
    });
  });

  it('shows trend indicators', async () => {
    render(<LocationAnalytics locationId="loc1" />);
    
    await waitFor(() => {
      expect(screen.getByText('35 visualizações')).toBeInTheDocument();
      expect(screen.getByText('12 seleções')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    (LocationAnalyticsService.getLocationAnalytics as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<LocationAnalytics locationId="loc1" />);
    
    expect(screen.getByText('Carregando estatísticas...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (LocationAnalyticsService.getLocationAnalytics as any).mockRejectedValue(
      new Error('Failed to load analytics')
    );
    
    render(<LocationAnalytics locationId="loc1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar estatísticas')).toBeInTheDocument();
    });
  });

  it('tracks view when component mounts', async () => {
    render(<LocationAnalytics locationId="loc1" />);
    
    await waitFor(() => {
      expect(LocationAnalyticsService.trackLocationView).toHaveBeenCalledWith('loc1');
    });
  });

  it('allows submitting feedback', async () => {
    render(<LocationAnalytics locationId="loc1" showFeedback={true} />);
    
    await waitFor(() => {
      const feedbackButton = screen.getByText('Avaliar Local');
      fireEvent.click(feedbackButton);
      
      expect(screen.getByText('Sua Avaliação')).toBeInTheDocument();
    });
  });

  it('renders compact view', async () => {
    render(<LocationAnalytics locationId="loc1" compact={true} />);
    
    await waitFor(() => {
      // In compact mode, should show minimal info
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.queryByText('Tendências')).not.toBeInTheDocument();
    });
  });

  it('handles zero analytics data', async () => {
    const emptyAnalytics = {
      ...mockAnalytics,
      views: 0,
      selections: 0,
      totalRatings: 0,
      averageRating: 0
    };
    
    (LocationAnalyticsService.getLocationAnalytics as any).mockResolvedValue(emptyAnalytics);
    
    render(<LocationAnalytics locationId="loc1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
    });
  });
});