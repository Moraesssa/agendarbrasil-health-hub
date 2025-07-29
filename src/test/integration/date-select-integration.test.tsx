import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DateSelect } from '@/components/scheduling/DateSelect';
import { appointmentService } from '@/services/appointmentService';
import { AuthContext } from '@/contexts/AuthContext';

vi.mock('@/services/appointmentService');

const mockAuthContext = {
  user: { 
    id: 'test-user-id', 
    email: 'test@test.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: new Date().toISOString(),
    email_change_sent_at: new Date().toISOString(),
    new_email: null,
    invited_at: null,
    action_link: null,
    email_change: null,
    email_change_confirm_status: 0,
    banned_until: null,
    new_phone: null,
    phone: null,
    phone_confirmed_at: null,
    phone_change: null,
    phone_change_token: null,
    phone_change_sent_at: null,
    confirmed_at: new Date().toISOString(),
    email_change_token_new: null,
    email_change_token_current: null,
    recovery_token: null,
    email_change_token: null,
    is_anonymous: false,
    factors: null
  },
  session: null,
  userData: null,
  loading: false,
  onboardingStatus: null,
  signInWithGoogle: vi.fn(),
  logout: vi.fn(),
  setUserType: vi.fn(),
  updateOnboardingStep: vi.fn(),
  completeOnboarding: vi.fn()
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { 
      queries: { 
        retry: false,
        staleTime: 0,
        cacheTime: 0
      } 
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('DateSelect Integration Tests', () => {
  const mockOnDateSelect = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrevious = vi.fn();
  
  const defaultProps = {
    doctorId: 'doctor-123',
    selectedDate: '',
    onDateSelect: mockOnDateSelect,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Data Loading', () => {
    it('should load and display available dates from the API', async () => {
      const mockDates = ['2024-02-15', '2024-02-16', '2024-02-17'];
      vi.mocked(appointmentService.getAvailableDates).mockResolvedValue(mockDates);

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('Carregando datas...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('3 datas disponíveis para consulta')).toBeInTheDocument();
      });

      // Verify API was called with correct parameters
      expect(appointmentService.getAvailableDates).toHaveBeenCalledWith(
        'doctor-123',
        undefined,
        undefined
      );
    });

    it('should handle empty available dates gracefully', async () => {
      vi.mocked(appointmentService.getAvailableDates).mockResolvedValue([]);

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Nenhuma data disponível para este médico no momento')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors with retry mechanism', async () => {
      const networkError = new Error('Network error');
      vi.mocked(appointmentService.getAvailableDates)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(['2024-02-15']);

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('Carregando datas...')).toBeInTheDocument();

      // Should show error after first failure
      await waitFor(() => {
        expect(screen.getByText('Erro de conexão. Tentando novamente...')).toBeInTheDocument();
      });

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('1 data disponível para consulta')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify multiple API calls were made (original + retries)
      expect(appointmentService.getAvailableDates).toHaveBeenCalledTimes(3);
    });

    it('should handle authentication errors appropriately', async () => {
      const authError = new Error('Você precisa estar logado para ver as datas disponíveis');
      vi.mocked(appointmentService.getAvailableDates).mockRejectedValue(authError);

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Você precisa estar logado para ver as datas disponíveis')).toBeInTheDocument();
      });

      // Should not retry authentication errors
      expect(appointmentService.getAvailableDates).toHaveBeenCalledTimes(1);
    });

    it('should allow manual retry after error', async () => {
      const error = new Error('Network error');
      vi.mocked(appointmentService.getAvailableDates)
        .mockRejectedValueOnce(error)
        .mockResolvedValue(['2024-02-15']);

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Erro de conexão. Tentando novamente...')).toBeInTheDocument();
      });

      // Wait for retry attempts to complete
      await waitFor(() => {
        expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Click retry button
      const retryButton = screen.getByText('Tentar novamente');
      fireEvent.click(retryButton);

      // Should succeed on manual retry
      await waitFor(() => {
        expect(screen.getByText('1 data disponível para consulta')).toBeInTheDocument();
      });
    });
  });

  describe('Caching Integration', () => {
    it('should use cached data for subsequent requests', async () => {
      const mockDates = ['2024-02-15', '2024-02-16'];
      vi.mocked(appointmentService.getAvailableDates).mockResolvedValue(mockDates);

      const { rerender } = render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('2 datas disponíveis para consulta')).toBeInTheDocument();
      });

      // Rerender with same props
      rerender(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Should still show the data (from cache)
      expect(screen.getByText('2 datas disponíveis para consulta')).toBeInTheDocument();

      // API should only be called once due to caching
      expect(appointmentService.getAvailableDates).toHaveBeenCalledTimes(1);
    });
  });

  describe('Full Appointment Flow Integration', () => {
    it('should integrate properly with appointment scheduling flow', async () => {
      const mockDates = ['2024-02-15', '2024-02-16'];
      vi.mocked(appointmentService.getAvailableDates).mockResolvedValue(mockDates);

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Wait for dates to load
      await waitFor(() => {
        expect(screen.getByText('2 datas disponíveis para consulta')).toBeInTheDocument();
      });

      // Previous button should work
      const previousButton = screen.getByText('Anterior');
      fireEvent.click(previousButton);
      expect(mockOnPrevious).toHaveBeenCalled();

      // Next button should be disabled initially
      const nextButton = screen.getByText('Próximo');
      expect(nextButton.closest('button')).toBeDisabled();
    });

    it('should enable next button when date is selected', async () => {
      const mockDates = ['2024-02-15'];
      vi.mocked(appointmentService.getAvailableDates).mockResolvedValue(mockDates);

      render(
        <TestWrapper>
          <DateSelect 
            {...defaultProps} 
            selectedDate="2024-02-15"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1 data disponível para consulta')).toBeInTheDocument();
      });

      // Next button should be enabled when date is selected
      const nextButton = screen.getByText('Próximo');
      expect(nextButton.closest('button')).not.toBeDisabled();

      // Should call onNext when clicked
      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Performance and Loading States', () => {
    it('should handle slow API responses gracefully', async () => {
      // Simulate slow API response
      vi.mocked(appointmentService.getAvailableDates).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(['2024-02-15']), 1000)
        )
      );

      render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Should show loading state
      expect(screen.getByText('Carregando datas...')).toBeInTheDocument();
      expect(screen.getByText('Aguarde um momento')).toBeInTheDocument();

      // Date button should be disabled during loading
      const dateButton = screen.getByRole('button', { name: /carregando datas disponíveis/i });
      expect(dateButton).toBeDisabled();

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('1 data disponível para consulta')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Button should be enabled after loading
      const enabledButton = screen.getByRole('button', { name: /clique para selecionar uma data/i });
      expect(enabledButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle doctor ID changes properly', async () => {
      vi.mocked(appointmentService.getAvailableDates)
        .mockResolvedValueOnce(['2024-02-15'])
        .mockResolvedValueOnce(['2024-02-20', '2024-02-21']);

      const { rerender } = render(
        <TestWrapper>
          <DateSelect {...defaultProps} />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('1 data disponível para consulta')).toBeInTheDocument();
      });

      // Change doctor ID
      rerender(
        <TestWrapper>
          <DateSelect {...defaultProps} doctorId="doctor-456" />
        </TestWrapper>
      );

      // Should load new data for different doctor
      await waitFor(() => {
        expect(screen.getByText('2 datas disponíveis para consulta')).toBeInTheDocument();
      });

      // Should have called API twice with different doctor IDs
      expect(appointmentService.getAvailableDates).toHaveBeenCalledWith('doctor-123', undefined, undefined);
      expect(appointmentService.getAvailableDates).toHaveBeenCalledWith('doctor-456', undefined, undefined);
    });

    it('should handle empty doctor ID gracefully', async () => {
      render(
        <TestWrapper>
          <DateSelect {...defaultProps} doctorId="" />
        </TestWrapper>
      );

      // Should not make API call with empty doctor ID
      expect(appointmentService.getAvailableDates).not.toHaveBeenCalled();

      // Should show appropriate message
      expect(screen.getByText('Escolha uma data')).toBeInTheDocument();
    });
  });
});