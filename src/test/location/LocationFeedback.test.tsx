import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationFeedback } from '@/components/location/LocationFeedback';
import { LocationAnalyticsService } from '@/services/locationAnalyticsService';

// Mock the analytics service
vi.mock('@/services/locationAnalyticsService', () => ({
  LocationAnalyticsService: {
    submitFeedback: vi.fn(),
    submitCorrection: vi.fn(),
  }
}));

describe('LocationFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (LocationAnalyticsService.submitFeedback as any).mockResolvedValue({ success: true });
    (LocationAnalyticsService.submitCorrection as any).mockResolvedValue({ success: true });
  });

  it('renders feedback form', () => {
    render(<LocationFeedback locationId="loc1" />);
    
    expect(screen.getByText('Avalie este Local')).toBeInTheDocument();
    expect(screen.getByLabelText('Sua avaliação')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Compartilhe sua experiência...')).toBeInTheDocument();
  });

  it('allows rating selection', async () => {
    render(<LocationFeedback locationId="loc1" />);
    
    const stars = screen.getAllByRole('button', { name: /estrela/i });
    fireEvent.click(stars[3]); // 4 stars
    
    expect(stars[3]).toHaveClass('text-yellow-400');
  });

  it('submits feedback successfully', async () => {
    render(<LocationFeedback locationId="loc1" />);
    
    // Select rating
    const stars = screen.getAllByRole('button', { name: /estrela/i });
    fireEvent.click(stars[4]); // 5 stars
    
    // Add comment
    const commentInput = screen.getByPlaceholderText('Compartilhe sua experiência...');
    fireEvent.change(commentInput, { target: { value: 'Excelente atendimento!' } });
    
    // Submit
    const submitButton = screen.getByText('Enviar Avaliação');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(LocationAnalyticsService.submitFeedback).toHaveBeenCalledWith({
        locationId: 'loc1',
        type: 'rating',
        rating: 5,
        comment: 'Excelente atendimento!',
        userId: expect.any(String),
        timestamp: expect.any(String)
      });
    });
    
    expect(screen.getByText('Obrigado pela sua avaliação!')).toBeInTheDocument();
  });

  it('shows correction form when requested', async () => {
    render(<LocationFeedback locationId="loc1" />);
    
    const correctionButton = screen.getByText('Reportar Informação Incorreta');
    fireEvent.click(correctionButton);
    
    expect(screen.getByText('Reportar Correção')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de correção')).toBeInTheDocument();
  });

  it('submits correction successfully', async () => {
    render(<LocationFeedback locationId="loc1" />);
    
    // Open correction form
    const correctionButton = screen.getByText('Reportar Informação Incorreta');
    fireEvent.click(correctionButton);
    
    // Select correction type
    const typeSelect = screen.getByLabelText('Tipo de correção');
    fireEvent.change(typeSelect, { target: { value: 'address' } });
    
    // Add description
    const descriptionInput = screen.getByPlaceholderText('Descreva a correção necessária...');
    fireEvent.change(descriptionInput, { target: { value: 'Endereço está desatualizado' } });
    
    // Submit
    const submitButton = screen.getByText('Enviar Correção');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(LocationAnalyticsService.submitCorrection).toHaveBeenCalledWith({
        locationId: 'loc1',
        type: 'address',
        description: 'Endereço está desatualizado',
        userId: expect.any(String),
        timestamp: expect.any(String)
      });
    });
    
    expect(screen.getByText('Correção enviada com sucesso!')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LocationFeedback locationId="loc1" />);
    
    // Try to submit without rating
    const submitButton = screen.getByText('Enviar Avaliação');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Por favor, selecione uma avaliação')).toBeInTheDocument();
  });

  it('handles submission errors', async () => {
    (LocationAnalyticsService.submitFeedback as any).mockRejectedValue(
      new Error('Network error')
    );
    
    render(<LocationFeedback locationId="loc1" />);
    
    // Select rating and submit
    const stars = screen.getAllByRole('button', { name: /estrela/i });
    fireEvent.click(stars[2]);
    
    const submitButton = screen.getByText('Enviar Avaliação');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Erro ao enviar avaliação. Tente novamente.')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (LocationAnalyticsService.submitFeedback as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<LocationFeedback locationId="loc1" />);
    
    // Select rating and submit
    const stars = screen.getAllByRole('button', { name: /estrela/i });
    fireEvent.click(stars[2]);
    
    const submitButton = screen.getByText('Enviar Avaliação');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });

  it('allows anonymous feedback', () => {
    render(<LocationFeedback locationId="loc1" allowAnonymous={true} />);
    
    const anonymousCheckbox = screen.getByLabelText('Enviar anonimamente');
    expect(anonymousCheckbox).toBeInTheDocument();
    
    fireEvent.click(anonymousCheckbox);
    expect(anonymousCheckbox).toBeChecked();
  });

  it('has proper accessibility attributes', () => {
    render(<LocationFeedback locationId="loc1" />);
    
    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Formulário de avaliação do local');
    
    const ratingGroup = screen.getByRole('radiogroup');
    expect(ratingGroup).toHaveAttribute('aria-label', 'Avaliação por estrelas');
  });
});