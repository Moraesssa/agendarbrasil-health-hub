/**
 * LocationComparison Component Tests
 * Tests for the location comparison functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LocationComparison } from '../LocationComparison';

// Mock data for testing
const mockLocations = [
  {
    id: '1',
    nome_local: 'Hospital A',
    endereco_completo: 'Rua A, 123',
    telefone: '(11) 1234-5678',
    facilidades: [],
    status: 'ativo' as const,
    available_slots_count: 5
  },
  {
    id: '2', 
    nome_local: 'Clínica B',
    endereco_completo: 'Rua B, 456',
    telefone: '(11) 9876-5432',
    facilidades: [],
    status: 'ativo' as const,
    available_slots_count: 3
  }
];

describe('LocationComparison', () => {
  it('renders location comparison correctly', () => {
    render(
      <LocationComparison
        locations={mockLocations}
        onLocationSelect={jest.fn()}
        selectedLocation="1"
      />
    );
    
    expect(screen.getByText('Hospital A')).toBeInTheDocument();
    expect(screen.getByText('Clínica B')).toBeInTheDocument();
  });
});