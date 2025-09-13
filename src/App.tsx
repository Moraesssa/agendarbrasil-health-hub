
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from '@/components/ui/sonner';
import { errorLogger } from '@/utils/errorLogger';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthRedirectController } from '@/components/AuthRedirectController';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthErrorBoundary } from '@/components/AuthErrorBoundary';
import { ConfigurationGuard } from '@/components/system/ConfigurationGuard';
import { AppointmentServiceProvider } from '@/contexts/AppointmentServiceProvider';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Cadastrar from '@/pages/Cadastrar';
import CadastroMedico from '@/pages/CadastroMedico';
import CadastroPaciente from '@/pages/CadastroPaciente';
import UserTypeSelection from '@/pages/UserTypeSelection';
import Onboarding from '@/pages/Onboarding';
import DashboardMedico from '@/pages/DashboardMedico';
import Perfil from '@/pages/Perfil';
import PerfilMedico from '@/pages/PerfilMedico';
import AgendaMedico from '@/pages/AgendaMedico';
import AgendaMedicoIntegrada from '@/pages/AgendaMedicoIntegrada';
import GerenciarAgenda from '@/pages/GerenciarAgenda';
import GerenciarLocais from '@/pages/GerenciarLocais';
import PacientesMedico from '@/pages/PacientesMedico';
import EncaminhamentosMedico from '@/pages/EncaminhamentosMedico';
import Financeiro from '@/pages/Financeiro';
import Agendamento from '@/pages/Agendamento';
import AgendaPaciente from '@/pages/AgendaPaciente';
import AgendaPacienteIntegrada from '@/pages/AgendaPacienteIntegrada';
import Historico from '@/pages/Historico';
import NotFound from '@/pages/NotFound';
import GerenciarFamilia from '@/pages/GerenciarFamilia';
import DashboardFamiliar from '@/pages/DashboardFamiliar';
import GerenciarConexoes from '@/pages/GerenciarConexoes';
import GestaoMedicamentos from '@/pages/GestaoMedicamentos';
import Debug from '@/pages/Debug';
import SchedulerDemo from '@/pages/SchedulerDemo';


const queryClient = new QueryClient();

// Simplified error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Use the error logger if available
    if (errorLogger?.logError) {
      errorLogger.logError(error, 'generic', {
        componentStack: errorInfo.componentStack,
        location: window.location.pathname
      });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              ❌
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Algo deu errado
            </h2>
            
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>

            <button
              onClick={this.handleReload}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Recarregar Página
            </button>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalhes do Erro (Dev)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                  {this.state.errorMessage}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ConfigurationGuard>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthErrorBoundary>
                <AuthProvider>
                  <NotificationProvider>
                    <AppointmentServiceProvider>
                      <AuthRedirectController>
                      <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastrar" element={<Cadastrar />} />
                    <Route path="/cadastro-medico" element={<CadastroMedico />} />
                    <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
                    <Route path="/user-type" element={<UserTypeSelection />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/dashboard-medico" element={<DashboardMedico />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/perfil-medico" element={<PerfilMedico />} />
                    <Route path="/agenda-medico" element={<AgendaMedicoIntegrada />} />
                    <Route path="/agenda-medico-legacy" element={<AgendaMedico />} />
                    <Route path="/gerenciar-agenda" element={<GerenciarAgenda />} />
                    <Route path="/gerenciar-locais" element={<GerenciarLocais />} />
                    <Route path="/pacientes-medico" element={<PacientesMedico />} />
                    <Route path="/encaminhamentos-medico" element={<EncaminhamentosMedico />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/agendamento" element={<Agendamento />} />
                    <Route path="/agenda-paciente" element={<AgendaPacienteIntegrada />} />
                    <Route path="/agenda-paciente-legacy" element={<AgendaPaciente />} />
                    <Route path="/historico" element={<Historico />} />
                    <Route path="/gerenciar-familia" element={<GerenciarFamilia />} />
                    <Route path="/dashboard-familiar" element={<DashboardFamiliar />} />
                    <Route path="/gerenciar-conexoes" element={<GerenciarConexoes />} />
                    <Route path="/gestao-medicamentos" element={<GestaoMedicamentos />} />
                    <Route path="/debug" element={<Debug />} />
                    <Route path="/scheduler-demo" element={<SchedulerDemo />} />
                      <Route path="*" element={<NotFound />} />
                      </Routes>
                      </AuthRedirectController>
                    </AppointmentServiceProvider>
                  </NotificationProvider>
                </AuthProvider>
              </AuthErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ConfigurationGuard>
    </ErrorBoundary>
  );
}

export default App;
