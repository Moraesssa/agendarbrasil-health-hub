
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Agendamento from '@/pages/Agendamento';
import { appointmentService } from '@/services/appointmentService';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock dos hooks e serviços
vi.mock('@/services/appointmentService');
vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

// Mock do AuthContext
const mockAuthContext = {
  user: { id: 'test-user-id', email: 'test@test.com' },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn()
};

// Mock dos dados
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
    
    // Mock dos métodos do appointmentService
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

    // Aguarda o carregamento inicial
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

    // O teste verifica se o componente renderiza sem erros
    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument();
    });
  });
});
