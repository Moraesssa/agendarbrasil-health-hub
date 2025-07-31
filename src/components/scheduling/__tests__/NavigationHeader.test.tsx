import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NavigationHeader } from '../NavigationHeader';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const defaultProps = {
  currentStep: 2,
  totalSteps: 7,
  onBackClick: vi.fn(),
  canGoBack: true,
  isLoading: false,
  hasUnsavedChanges: false,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NavigationHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 1.1: Home button visible in all steps', () => {
    it('should display home button', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} />);
      
      const homeButton = screen.getByRole('button', { name: /voltar ao início/i });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toBeVisible();
    });

    it('should display home button in step 1', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} currentStep={1} canGoBack={false} />);
      
      const homeButton = screen.getByRole('button', { name: /voltar ao início/i });
      expect(homeButton).toBeInTheDocument();
    });

    it('should display home button in last step', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} currentStep={7} />);
      
      const homeButton = screen.getByRole('button', { name: /voltar ao início/i });
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe('Requirement 1.2: Home button redirects to dashboard', () => {
    it('should navigate to home when home button is clicked', async () => {
      renderWithRouter(<NavigationHeader {...defaultProps} />);
      
      const homeButton = screen.getByRole('button', { name: /voltar ao início/i });
      fireEvent.click(homeButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should show confirmation dialog when there are unsaved changes', () => {
      // Mock window.confirm
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      renderWithRouter(<NavigationHeader {...defaultProps} hasUnsavedChanges={true} />);
      
      const homeButton = screen.getByRole('button', { name: /voltar ao início/i });
      fireEvent.click(homeButton);
      
      expect(mockConfirm).toHaveBeenCalledWith(
        'Você tem alterações não salvas. Deseja realmente sair?'
      );
      expect(mockNavigate).not.toHaveBeenCalled();
      
      mockConfirm.mockRestore();
    });
  });

  describe('Requirement 1.3: Back button visible after step 1', () => {
    it('should display back button when canGoBack is true', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} canGoBack={true} />);
      
      const backButton = screen.getByRole('button', { name: /voltar para a etapa/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toBeVisible();
    });

    it('should display back button in step 2', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} currentStep={2} canGoBack={true} />);
      
      const backButton = screen.getByRole('button', { name: /voltar para a etapa/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Requirement 1.4: Back button returns to previous step', () => {
    it('should call onBackClick when back button is clicked', async () => {
      const mockOnBackClick = vi.fn();
      renderWithRouter(<NavigationHeader {...defaultProps} onBackClick={mockOnBackClick} />);
      
      const backButton = screen.getByRole('button', { name: /voltar para a etapa/i });
      fireEvent.click(backButton);
      
      await waitFor(() => {
        expect(mockOnBackClick).toHaveBeenCalled();
      });
    });
  });

  describe('Requirement 1.5: Back button hidden in step 1', () => {
    it('should not display back button when canGoBack is false', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} canGoBack={false} />);
      
      const backButton = screen.queryByRole('button', { name: /voltar para a etapa/i });
      expect(backButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveAttribute('aria-label', 'Navegação do agendamento');
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Navegação principal');
    });

    it('should show progress status', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} currentStep={3} totalSteps={7} />);
      
      const progressStatus = screen.getByRole('status');
      expect(progressStatus).toHaveTextContent('3/7');
    });

    it('should show unsaved changes warning', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} hasUnsavedChanges={true} />);
      
      const warning = screen.getByRole('status', { name: /há alterações não salvas/i });
      expect(warning).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should disable buttons when loading', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} isLoading={true} />);
      
      const homeButton = screen.getByRole('button', { name: /voltar ao início/i });
      const backButton = screen.getByRole('button', { name: /voltar para a etapa/i });
      
      expect(homeButton).toBeDisabled();
      expect(backButton).toBeDisabled();
    });
  });

  describe('Responsive design', () => {
    it('should have responsive classes', () => {
      renderWithRouter(<NavigationHeader {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
    });
  });
});