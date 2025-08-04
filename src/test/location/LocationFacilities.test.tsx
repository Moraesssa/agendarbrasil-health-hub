import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationFacilities } from '@/components/location/LocationFacilities';
import { LocationFacility } from '@/types/location';

const mockFacilities: LocationFacility[] = [
  { type: 'estacionamento', available: true, cost: 'gratuito', details: '50 vagas' },
  { type: 'acessibilidade', available: true, details: 'Rampa de acesso e elevador' },
  { type: 'wifi', available: true, cost: 'gratuito' },
  { type: 'farmacia', available: false },
  { type: 'ar_condicionado', available: true },
];

describe('LocationFacilities', () => {
  it('renders all available facilities', () => {
    render(<LocationFacilities facilities={mockFacilities} />);
    
    expect(screen.getByText('Estacionamento')).toBeInTheDocument();
    expect(screen.getByText('Acessibilidade')).toBeInTheDocument();
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    expect(screen.getByText('Ar Condicionado')).toBeInTheDocument();
  });

  it('shows facility details in tooltips', async () => {
    render(<LocationFacilities facilities={mockFacilities} />);
    
    const parkingFacility = screen.getByText('Estacionamento');
    fireEvent.mouseEnter(parkingFacility);
    
    expect(await screen.findByText('50 vagas')).toBeInTheDocument();
  });

  it('displays cost information correctly', () => {
    render(<LocationFacilities facilities={mockFacilities} />);
    
    expect(screen.getByText('Gratuito')).toBeInTheDocument();
  });

  it('filters out unavailable facilities by default', () => {
    render(<LocationFacilities facilities={mockFacilities} />);
    
    expect(screen.queryByText('Farmácia')).not.toBeInTheDocument();
  });

  it('shows unavailable facilities when showUnavailable is true', () => {
    render(<LocationFacilities facilities={mockFacilities} showUnavailable={true} />);
    
    expect(screen.getByText('Farmácia')).toBeInTheDocument();
  });

  it('applies correct styling for available and unavailable facilities', () => {
    render(<LocationFacilities facilities={mockFacilities} showUnavailable={true} />);
    
    const availableFacility = screen.getByText('Estacionamento').closest('.facility-badge');
    const unavailableFacility = screen.getByText('Farmácia').closest('.facility-badge');
    
    expect(availableFacility).toHaveClass('bg-green-100');
    expect(unavailableFacility).toHaveClass('bg-gray-100');
  });

  it('handles empty facilities array', () => {
    render(<LocationFacilities facilities={[]} />);
    
    expect(screen.getByText('Nenhuma facilidade informada')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<LocationFacilities facilities={mockFacilities} compact={true} />);
    
    // In compact mode, should show icons only
    const facilityIcons = screen.getAllByRole('img', { hidden: true });
    expect(facilityIcons.length).toBeGreaterThan(0);
  });

  it('has proper accessibility attributes', () => {
    render(<LocationFacilities facilities={mockFacilities} />);
    
    const facilitiesContainer = screen.getByRole('list');
    expect(facilitiesContainer).toHaveAttribute('aria-label', 'Facilidades disponíveis');
    
    const facilityItems = screen.getAllByRole('listitem');
    facilityItems.forEach(item => {
      expect(item).toHaveAttribute('aria-label');
    });
  });
});