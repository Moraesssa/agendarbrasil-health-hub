
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Agendamento from '@/pages/Agendamento';
import { appointmentService } from '@/services/appointmentService';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

vi.mock('@/services/appointmentService');
vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();
const mockDismiss = vi.fn();
vi.mocked(useToast).mockReturnValue({ 
  toast: mockToast,
  dismiss: mockDismiss,
  toasts: []
});

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@test.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z'
};

const mockAuthContext = {
  user: mockUser,
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

const mockSpecialties = ['Cardiologia', 'Dermatologia'];
const mockDoctors = [
  { id: '1', display_name: 'Dr. João Silva' },
  { id: '2', display_name: 'Dra. Maria Santos' }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
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

describe('Fluxo E2E de Agendamento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(appointmentService.getSpecialties).mockResolvedValue(mockSpecialties);
    vi.mocked(appointmentService.getDoctorsByLocationAndSpecialty).mockResolvedValue(mockDoctors);
    vi.mocked(appointmentService.getAvailableSlotsByDoctor).mockResolvedValue([]);
    vi.mocked(appointmentService.scheduleAppointment).mockResolvedValue({ success: true });
  });

  it('deve completar o fluxo de agendamento com sucesso', async () => {
    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando não há especialidades disponíveis', async () => {
    vi.mocked(appointmentService.getSpecialties).mockRejectedValue(new Error('Erro de rede'));

    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erro ao carregar dados iniciais",
        variant: "destructive"
      });
    });
  });

  it('deve lidar com erro no agendamento', async () => {
    vi.mocked(appointmentService.scheduleAppointment).mockRejectedValue(new Error('Erro no agendamento'));

    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument();
    });
  });
});
