
import { render, screen, fireEvent, waitFor } from '../test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Agendamento from '../../pages/Agendamento'
import AgendaPaciente from '../../pages/AgendaPaciente'
import { AuthProvider } from '../../contexts/AuthContext'
import { appointmentService } from '../../services/appointmentService'

// Mock do serviço de agendamento
vi.mock('../../services/appointmentService', () => ({
  appointmentService: {
    getSpecialties: vi.fn(),
    getDoctorsBySpecialty: vi.fn(),
    getAvailableTimeSlots: vi.fn(),
    scheduleAppointment: vi.fn(),
  }
}))

// Mock do Supabase
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn()
        }))
      }))
    }))
  }
}))

// Mock do contexto de autenticação
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      userData: {
        uid: 'test-user-id',
        displayName: 'Test User',
        userType: 'paciente',
        onboardingCompleted: true
      },
      loading: false
    })
  }
})

// Mock do React Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock do hook de toast
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

// Dados mockados para o teste
const mockSpecialties = ['Cardiologia', 'Dermatologia', 'Neurologia']
const mockDoctors = [
  { id: 'doctor-1', display_name: 'Dr. João Silva' },
  { id: 'doctor-2', display_name: 'Dra. Maria Santos' }
]
const mockTimeSlots = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: false },
  { time: '14:00', available: true }
]

const mockAppointment = {
  id: 'appointment-1',
  paciente_id: 'test-user-id',
  medico_id: 'doctor-1',
  data_consulta: '2024-01-15T09:00:00.000Z',
  tipo_consulta: 'Cardiologia',
  status: 'agendada',
  local_consulta: 'Clínica Central',
  doctor_profile: {
    display_name: 'Dr. João Silva'
  }
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Appointment Scheduling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup dos mocks do serviço
    vi.mocked(appointmentService.getSpecialties).mockResolvedValue(mockSpecialties)
    vi.mocked(appointmentService.getDoctorsBySpecialty).mockResolvedValue(mockDoctors)
    vi.mocked(appointmentService.getAvailableTimeSlots).mockResolvedValue(mockTimeSlots)
    vi.mocked(appointmentService.scheduleAppointment).mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should complete the full appointment scheduling flow', async () => {
    // Renderiza a página de agendamento
    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    )

    // Verifica se a página carregou
    expect(screen.getByText('Agendar Consulta')).toBeInTheDocument()

    // Aguarda as especialidades carregarem
    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
    })

    // 1. Seleciona uma especialidade
    const specialtySelect = screen.getByRole('combobox', { name: /especialidade/i })
    fireEvent.change(specialtySelect, { target: { value: 'Cardiologia' } })

    // Aguarda os médicos carregarem
    await waitFor(() => {
      expect(appointmentService.getDoctorsBySpecialty).toHaveBeenCalledWith('Cardiologia')
    })

    // 2. Seleciona um médico
    await waitFor(() => {
      const doctorSelect = screen.getByRole('combobox', { name: /médico/i })
      expect(doctorSelect).toBeInTheDocument()
      fireEvent.change(doctorSelect, { target: { value: 'doctor-1' } })
    })

    // 3. Seleciona uma data
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('')
      fireEvent.change(dateInput, { target: { value: dateString } })
    })

    // Aguarda os horários carregarem
    await waitFor(() => {
      expect(appointmentService.getAvailableTimeSlots).toHaveBeenCalledWith('doctor-1', dateString)
    })

    // 4. Seleciona um horário disponível
    await waitFor(() => {
      const timeSlot = screen.getByText('09:00')
      expect(timeSlot).toBeInTheDocument()
      fireEvent.click(timeSlot)
    })

    // 5. Confirma o agendamento
    const confirmButton = screen.getByText('Confirmar Agendamento')
    expect(confirmButton).toBeEnabled()
    
    fireEvent.click(confirmButton)

    // Verifica se o serviço de agendamento foi chamado com os dados corretos
    await waitFor(() => {
      expect(appointmentService.scheduleAppointment).toHaveBeenCalledWith({
        paciente_id: 'test-user-id',
        medico_id: 'doctor-1',
        data_consulta: expect.stringMatching(/.*T09:00:00/),
        tipo_consulta: 'Cardiologia'
      })
    })

    // Verifica se houve redirecionamento para a agenda
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/agenda-paciente')
    })
  })

  it('should show validation errors when trying to schedule without required fields', async () => {
    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    )

    // Aguarda a página carregar
    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument()
    })

    // Tenta confirmar sem preencher os campos
    const confirmButton = screen.getByText('Confirmar Agendamento')
    expect(confirmButton).toBeDisabled()
  })

  it('should display appointment in patient schedule after successful booking', async () => {
    // Mock do Supabase para retornar a consulta agendada
    const mockSupabaseResponse = {
      data: [mockAppointment],
      error: null
    }

    // Mock mais específico do Supabase
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve(mockSupabaseResponse))
        }))
      }))
    }

    vi.doMock('../../integrations/supabase/client', () => ({
      supabase: mockSupabase
    }))

    // Renderiza a página de agenda
    render(
      <TestWrapper>
        <AgendaPaciente />
      </TestWrapper>
    )

    // Verifica se a consulta aparece na agenda
    await waitFor(() => {
      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument()
      expect(screen.getByText('Cardiologia')).toBeInTheDocument()
      expect(screen.getByText('Agendada')).toBeInTheDocument()
    })
  })

  it('should handle appointment scheduling errors gracefully', async () => {
    // Mock de erro no agendamento
    vi.mocked(appointmentService.scheduleAppointment).mockRejectedValue(
      new Error('Erro ao agendar consulta')
    )

    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    )

    // Preenche o formulário completo
    await waitFor(() => {
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument()
    })

    // Seleciona especialidade
    const specialtySelect = screen.getByRole('combobox', { name: /especialidade/i })
    fireEvent.change(specialtySelect, { target: { value: 'Cardiologia' } })

    // Aguarda e seleciona médico
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

    // Seleciona horário
    await waitFor(() => {
      const timeSlot = screen.getByText('09:00')
      fireEvent.click(timeSlot)
    })

    // Tenta confirmar agendamento
    const confirmButton = screen.getByText('Confirmar Agendamento')
    fireEvent.click(confirmButton)

    // Verifica se o erro foi tratado
    await waitFor(() => {
      expect(appointmentService.scheduleAppointment).toHaveBeenCalled()
      // O toast de erro deve ter sido chamado (mockado)
    })
  })

  it('should disable unavailable time slots', async () => {
    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    )

    // Preenche até chegar aos horários
    const specialtySelect = screen.getByRole('combobox', { name: /especialidade/i })
    fireEvent.change(specialtySelect, { target: { value: 'Cardiologia' } })

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

    // Verifica se o horário indisponível está desabilitado
    await waitFor(() => {
      const unavailableSlot = screen.getByText('11:00')
      expect(unavailableSlot).toBeDisabled()
    })

    // Verifica se os horários disponíveis estão habilitados
    const availableSlot = screen.getByText('09:00')
    expect(availableSlot).not.toBeDisabled()
  })

  it('should show loading states during data fetching', async () => {
    // Mock com delay para simular loading
    vi.mocked(appointmentService.getSpecialties).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSpecialties), 100))
    )

    render(
      <TestWrapper>
        <Agendamento />
      </TestWrapper>
    )

    // Verifica se o estado de loading aparece
    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    // Aguarda o carregamento terminar
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })
  })
})
