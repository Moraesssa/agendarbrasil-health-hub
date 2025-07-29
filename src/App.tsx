
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
import GerenciarAgenda from '@/pages/GerenciarAgenda';
import GerenciarLocais from '@/pages/GerenciarLocais';
import PacientesMedico from '@/pages/PacientesMedico';
import EncaminhamentosMedico from '@/pages/EncaminhamentosMedico';
import Financeiro from '@/pages/Financeiro';
import Agendamento from '@/pages/Agendamento';
import AgendaPaciente from '@/pages/AgendaPaciente';
import Historico from '@/pages/Historico';
import NotFound from '@/pages/NotFound';
import GerenciarFamilia from '@/pages/GerenciarFamilia';
import DashboardFamiliar from '@/pages/DashboardFamiliar';
import GerenciarConexoes from '@/pages/GerenciarConexoes';
import GestaoMedicamentos from '@/pages/GestaoMedicamentos';

const queryClient = new QueryClient();

// Enhanced error boundary component with specific undefined property error handling
interface ErrorBoundaryState {
  hasError: boolean;
  errorType: 'undefined_property' | 'network' | 'generic' | null;
  errorMessage: string;
  retryCount: number;
  canRecover: boolean;
}



class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorType: null,
      errorMessage: '',
      retryCount: 0,
      canRecover: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorMessage = error.message;
    const errorStack = error.stack || '';
    let errorType: ErrorBoundaryState['errorType'] = 'generic';
    let canRecover = false;

    // Detect specific error types with more comprehensive patterns
    if (errorMessage.includes("Cannot read properties of undefined") || 
        errorMessage.includes("Cannot read property") ||
        errorMessage.includes("undefined is not an object") ||
        errorMessage.includes("reading 'length'") ||
        errorStack.includes("reading 'length'")) {
      errorType = 'undefined_property';
      canRecover = true; // These errors can often be recovered from
    } else if (errorMessage.includes("fetch") || 
               errorMessage.includes("network") ||
               errorMessage.includes("Failed to load") ||
               errorMessage.includes("NetworkError")) {
      errorType = 'network';
      canRecover = true;
    }

    return {
      hasError: true,
      errorType,
      errorMessage,
      canRecover
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Use the enhanced error logger
    const errorId = errorLogger.logError(
      error,
      this.state.errorType || 'generic',
      {
        componentStack: errorInfo.componentStack,
        stack: errorInfo.componentStack,
        location: window.location.pathname,
        retryAttempt: this.state.retryCount + 1
      },
      this.state.retryCount
    );

    console.log(`Error logged with ID: ${errorId}`);

    // Attempt automatic recovery for recoverable errors
    if (this.state.canRecover && this.state.retryCount < this.maxRetries) {
      this.attemptRecovery();
    }
  }



  private attemptRecovery = () => {
    console.log(`🔄 Attempting automatic recovery (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
    
    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        errorType: null,
        errorMessage: '',
        retryCount: prevState.retryCount + 1,
        canRecover: true
      }));
    }, this.retryDelay);
  };

  private handleManualRetry = () => {
    console.log('🔄 Manual retry initiated by user');
    this.setState({
      hasError: false,
      errorType: null,
      errorMessage: '',
      retryCount: 0,
      canRecover: false
    });
  };

  private handleReload = () => {
    console.log('🔄 Page reload initiated by user');
    window.location.reload();
  };

  private getErrorTitle(): string {
    switch (this.state.errorType) {
      case 'undefined_property':
        return 'Erro de Dados Não Carregados';
      case 'network':
        return 'Erro de Conexão';
      default:
        return 'Algo deu errado';
    }
  }

  private getErrorDescription(): string {
    switch (this.state.errorType) {
      case 'undefined_property':
        return 'Os dados ainda estão sendo carregados. Tentando novamente automaticamente...';
      case 'network':
        return 'Problema de conexão detectado. Verifique sua internet e tente novamente.';
      default:
        return 'Ocorreu um erro inesperado. Por favor, recarregue a página.';
    }
  }

  render() {
    if (this.state.hasError) {
      const showRetryButton = this.state.retryCount < this.maxRetries && this.state.canRecover;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4">
              {this.state.errorType === 'undefined_property' && (
                <div className="w-16 h-16 mx-auto mb-4 text-yellow-500">
                  ⚠️
                </div>
              )}
              {this.state.errorType === 'network' && (
                <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                  🌐
                </div>
              )}
              {this.state.errorType === 'generic' && (
                <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                  ❌
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {this.getErrorTitle()}
            </h2>
            
            <p className="text-gray-600 mb-4">
              {this.getErrorDescription()}
            </p>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Tentativa {this.state.retryCount} de {this.maxRetries}
              </p>
            )}

            <div className="space-y-2">
              {showRetryButton && (
                <button
                  onClick={this.handleManualRetry}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Tentar Novamente
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Recarregar Página
              </button>
            </div>

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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthErrorBoundary>
              <AuthProvider>
                <NotificationProvider>
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
                    <Route path="/agenda-medico" element={<AgendaMedico />} />
                    <Route path="/gerenciar-agenda" element={<GerenciarAgenda />} />
                    <Route path="/gerenciar-locais" element={<GerenciarLocais />} />
                    <Route path="/pacientes-medico" element={<PacientesMedico />} />
                    <Route path="/encaminhamentos-medico" element={<EncaminhamentosMedico />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/agendamento" element={<Agendamento />} />
                    <Route path="/agenda-paciente" element={<AgendaPaciente />} />
                    <Route path="/historico" element={<Historico />} />
                    <Route path="/gerenciar-familia" element={<GerenciarFamilia />} />
                    <Route path="/dashboard-familiar" element={<DashboardFamiliar />} />
                    <Route path="/gerenciar-conexoes" element={<GerenciarConexoes />} />
                    <Route path="/gestao-medicamentos" element={<GestaoMedicamentos />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </AuthRedirectController>
                </NotificationProvider>
              </AuthProvider>
            </AuthErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
