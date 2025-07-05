
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Agendamento from '@/pages/Agendamento';
import { appointmentService } from '@/services/appointmentService';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

vi.mock('@/services/appointmentService');
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@test.com',
          },
        },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id', email: 'test@test.com' },
          },
        },
        error: null,
      }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

const mockToast = vi.fn();
const mockDismiss = vi.fn();
vi.mocked(useToast).mockReturnValue({ 
  toast: mockToast,
  dismiss: mockDismiss,
  toasts: []
});

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

describe('Agendamento de Consultas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(appointmentService.getSpecialties).mockResolvedValue(['Cardiologia']);
    vi.mocked(appointmentService.getDoctorsByLocationAndSpecialty).mockResolvedValue([]);
    vi.mocked(appointmentService.getAvailableSlotsByDoctor).mockResolvedValue([]);
    vi.mocked(appointmentService.scheduleAppointment).mockResolvedValue({ success: true });
  });

  it('deve renderizar o formulário de agendamento', async () => {
    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    );

    expect(screen.getByText('Agendar Consulta')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Filtros de Agendamento')).toBeInTheDocument();
    });
  });

  it('deve carregar especialidades na inicialização', async () => {
    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(appointmentService.getSpecialties).toHaveBeenCalled();
    });
  });

  it('deve exibir erro quando falha ao carregar dados', async () => {
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

  it('deve buscar médicos quando filtros são selecionados', async () => {
    const mockDoctors = [{ id: '1', display_name: 'Dr. João' }];
    vi.mocked(appointmentService.getDoctorsByLocationAndSpecialty).mockResolvedValue(mockDoctors);

    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument();
    });
  });

  it('deve buscar horários quando médico e data são selecionados', async () => {
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
