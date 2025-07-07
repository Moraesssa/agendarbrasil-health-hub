
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthRedirectController } from '@/components/AuthRedirectController';
import { NotificationProvider } from '@/contexts/NotificationContext';
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

const queryClient = new QueryClient();

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Algo deu errado
            </h2>
            <p className="text-gray-600 mb-4">
              Por favor, recarregue a página
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recarregar
            </button>
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
                <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthRedirectController>
              </NotificationProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
