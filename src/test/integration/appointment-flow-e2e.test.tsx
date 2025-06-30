
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../../App'
import { appointmentService } from '../../services/appointmentService'

// Mock dos serviços
vi.mock('../../services/appointmentService')
vi.mock('../../integrations/supabase/client')

// Mock do contexto de autenticação para usuário logado
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    userData: {
      uid: 'test-user-id',
      displayName: 'Test User',
      userType: 'paciente',
      onboardingCompleted: true
    },
    loading: false
  })
}))

// Mock do toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

// Dados mockados
const mockSpecialties = ['Cardiologia', 'Dermatologia']
const mockDoctors = [
  { id: 'doctor-1', display_name: 'Dr. João Silva' }
]
const mockTimeSlots = [
  { time: '09:00', available: true },
  { time: '10:00', available: true }
]

const TestAppWrapper = ({ initialRoute = '/' }: { initialRoute?: string }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Complete Appointment Flow E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup padrão dos mocks
    vi.mocked(appointmentService.getSpecialties).mockResolvedValue(mockSpecialties)
    vi.mocked(appointmentService.getDoctorsBySpecialty).mockResolvedValue(mockDoctors)
    vi.mocked(appointmentService.getAvailableTimeSlots).mockResolvedValue(mockTimeSlots)
    vi.mocked(appointmentService.scheduleAppointment).mockResolvedValue({ success: true })
  })

  it('should complete full appointment scheduling flow from home to agenda', async () => {
    // Inicia na página inicial
    render(<TestAppWrapper initialRoute="/" />)

    // Navega para agendamento (simulando clique no botão da home)
    render(<TestAppWrapper initialRoute="/agendamento" />)

    // Verifica se chegou na página de agendamento
    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument()
    })

    // Aguarda especialidades carregarem
    await waitFor(() => {
      expect(appointmentService.getSpecialties).toHaveBeenCalled()
    })

    // Preenche o formulário completo
    const specialtySelect = screen.getByRole('combobox', { name: /especialidade/i })
    fireEvent.change(specialtySelect, { target: { value: 'Cardiologia' } })

    // Aguarda médicos carregarem e seleciona
    await waitFor(() => {
      expect(appointmentService.getDoctorsBySpecialty).toHaveBeenCalledWith('Cardiologia')
    })

    await waitFor(() => {
      const doctorSelect = screen.getByRole('combobox', { name: /médico/i })
      fireEvent.change(doctorSelect, { target: { value: 'doctor-1' } })
    })

    // Seleciona data
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('')
      fireEvent.change(dateInput, { target: { value: dateString } })
    })

    // Aguarda horários carregarem e seleciona
    await waitFor(() => {
      expect(appointmentService.getAvailableTimeSlots).toHaveBeenCalledWith('doctor-1', dateString)
    })

    await waitFor(() => {
      const timeSlot = screen.getByText('09:00')
      fireEvent.click(timeSlot)
    })

    // Confirma agendamento
    const confirmButton = screen.getByText('Confirmar Agendamento')
    fireEvent.click(confirmButton)

    // Verifica se o agendamento foi feito
    await waitFor(() => {
      expect(appointmentService.scheduleAppointment).toHaveBeenCalledWith({
        paciente_id: 'test-user-id',
        medico_id: 'doctor-1',
        data_consulta: expect.stringMatching(/.*T09:00:00/),
        tipo_consulta: 'Cardiologia'
      })
    })

    // Simula navegação para agenda após sucesso
    render(<TestAppWrapper initialRoute="/agenda-paciente" />)

    // Verifica se chegou na agenda
    await waitFor(() => {
      expect(screen.getByText('Minha Agenda')).toBeInTheDocument()
    })
  })

  it('should show appointment summary during scheduling', async () => {
    render(<TestAppWrapper initialRoute="/agendamento" />)

    // Preenche formulário até ter dados suficientes para o resumo
    await waitFor(() => {
      const specialtySelect = screen.getByRole('combobox', { name: /especialidade/i })
      fireEvent.change(specialtySelect, { target: { value: 'Cardiologia' } })
    })

    await waitFor(() => {
      const doctorSelect = screen.getByRole('combobox', { name: /médico/i })
      fireEvent.change(doctorSelect, { target: { value: 'doctor-1' } })
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('')
      fireEvent.change(dateInput, { target: { value: dateString } })
    })

    await waitFor(() => {
      const timeSlot = screen.getByText('09:00')
      fireEvent.click(timeSlot)
    })

    // Verifica se o resumo aparece
    await waitFor(() => {
      expect(screen.getByText('Resumo do Agendamento')).toBeInTheDocument()
      expect(screen.getByText('Cardiologia')).toBeInTheDocument()
      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    // Mock de erro na busca de especialidades
    vi.mocked(appointmentService.getSpecialties).mockRejectedValue(
      new Error('Erro de rede')
    )

    render(<TestAppWrapper initialRoute="/agendamento" />)

    // Verifica se o erro é exibido
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar especialidades/)).toBeInTheDocument()
    })
  })

  it('should prevent double booking', async () => {
    // Mock para simular horário que fica indisponível
    const updatedTimeSlots = [
      { time: '09:00', available: false }, // Agora indisponível
      { time: '10:00', available: true }
    ]

    vi.mocked(appointmentService.getAvailableTimeSlots)
      .mockResolvedValueOnce(mockTimeSlots) // Primeira chamada: disponível
      .mockResolvedValueOnce(updatedTimeSlots) // Segunda chamada: indisponível

    render(<TestAppWrapper initialRoute="/agendamento" />)

    // Preenche formulário
    await waitFor(() => {
      const specialtySelect = screen.getByRole('combobox', { name: /especialidade/i })
      fireEvent.change(specialtySelect, { target: { value: 'Cardiologia' } })
    })

    await waitFor(() => {
      const doctorSelect = screen.getByRole('combobox', { name: /médico/i })
      fireEvent.change(doctorSelect, { target: { value: 'doctor-1' } })
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('')
      fireEvent.change(dateInput, { target: { value: dateString } })
    })

    // Primeira vez: horário disponível
    await waitFor(() => {
      const timeSlot = screen.getByText('09:00')
      expect(timeSlot).not.toBeDisabled()
    })

    // Simula recarregamento de horários (por exemplo, ao alterar data)
    fireEvent.change(screen.getByDisplayValue(dateString), { 
      target: { value: dateString } 
    })

    // Segunda vez: horário indisponível
    await waitFor(() => {
      const timeSlot = screen.getByText('09:00')
      expect(timeSlot).toBeDisabled()
    })
  })
})
