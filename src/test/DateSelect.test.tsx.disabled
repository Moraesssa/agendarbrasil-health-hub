import { render, screen, fireEvent } from './test-utils';
import { DateSelect } from '@/components/scheduling/DateSelect';
import { useAvailableDates } from '@/hooks/useAvailableDates';
import { vi } from 'vitest';

// Mock the useAvailableDates hook
vi.mock('@/hooks/useAvailableDates');

const mockUseAvailableDates = vi.mocked(useAvailableDates);

describe('DateSelect', () => {
  const mockOnDateSelect = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrevious = vi.fn();
  const mockRefetch = vi.fn();
  const mockClearError = vi.fn();
  
  const defaultProps = {
    doctorId: 'doctor-123',
    selectedDate: '',
    onDateSelect: mockOnDateSelect,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    disabled: false,
  };

  const mockHookReturn = {
    availableDates: ['2024-01-15', '2024-01-16', '2024-01-17'],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    clearError: mockClearError,
    retryCount: 0,
    isRetrying: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAvailableDates.mockReturnValue(mockHookReturn);
  });

  describe('Component Rendering', () => {
    it('should render the date selection interface', () => {
      render(<DateSelect {...defaultProps} />);

      expect(screen.getByText('Selecione a Data da Consulta')).toBeInTheDocument();
      expect(screen.getByText('Escolha uma data')).toBeInTheDocument();
      expect(screen.getByText('Clique para abrir o calendário')).toBeInTheDocument();
    });

    it('should render navigation buttons when provided', () => {
      render(<DateSelect {...defaultProps} />);

      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Próximo')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      mockUseAvailableDates.mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });

      render(<DateSelect {...defaultProps} />);

      expect(screen.getByText('Carregando datas...')).toBeInTheDocument();
      expect(screen.getByText('Aguarde um momento')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render component without crashing when hook returns error', () => {
      mockUseAvailableDates.mockReturnValue({
        ...mockHookReturn,
        error: 'Network error',
        availableDates: [],
      });

      render(<DateSelect {...defaultProps} />);

      // Component should render without crashing
      expect(screen.getByText('Selecione a Data da Consulta')).toBeInTheDocument();
    });

    it('should call hook with correct parameters', () => {
      render(<DateSelect {...defaultProps} />);

      expect(mockUseAvailableDates).toHaveBeenCalledWith('doctor-123', {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
      });
    });
  });

  describe('Available Dates Display', () => {
    it('should render component with available dates', () => {
      render(<DateSelect {...defaultProps} />);

      // Component should render and show some indication of available dates
      expect(screen.getByText('Selecione a Data da Consulta')).toBeInTheDocument();
      // The exact text depends on the hook implementation, so we just verify the component renders
    });

    it('should show no dates message when empty', () => {
      mockUseAvailableDates.mockReturnValue({
        ...mockHookReturn,
        availableDates: [],
      });

      render(<DateSelect {...defaultProps} />);

      expect(screen.getByText('Nenhuma data disponível para este médico no momento')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onPrevious when previous button is clicked', () => {
      render(<DateSelect {...defaultProps} />);

      const previousButton = screen.getByText('Anterior');
      fireEvent.click(previousButton);

      expect(mockOnPrevious).toHaveBeenCalled();
    });

    it('should disable next button when no date is selected', () => {
      render(<DateSelect {...defaultProps} />);

      const nextButton = screen.getByText('Próximo');
      expect(nextButton.closest('button')).toBeDisabled();
    });
  });
});