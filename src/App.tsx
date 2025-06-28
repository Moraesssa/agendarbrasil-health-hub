import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Sonner } from './components/ui/sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './contexts/AuthContext';
import { AuthRedirectController } from './components/AuthRedirectController';
import Index from './pages/Index';
import Login from './pages/Login';
import Cadastrar from './pages/Cadastrar';
import CadastroMedico from './pages/CadastroMedico';
import CadastroPaciente from './pages/CadastroPaciente';
import UserTypeSelection from './pages/UserTypeSelection';
import Onboarding from './pages/Onboarding';
import DashboardMedico from './pages/DashboardMedico';
import Perfil from './pages/Perfil';
import PerfilMedico from './pages/PerfilMedico';
import AgendaMedico from './pages/AgendaMedico';
import GerenciarAgenda from './pages/GerenciarAgenda';
import PacientesMedico from './pages/PacientesMedico';
import EncaminhamentosMedico from './pages/EncaminhamentosMedico';
import Agendamento from './pages/Agendamento';
import AgendaPaciente from './pages/AgendaPaciente';
import Historico from './pages/Historico';
import NotFound from './pages/NotFound';
import GerenciarFamilia from './pages/GerenciarFamilia';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
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
                  <Route path="/pacientes-medico" element={<PacientesMedico />} />
                  <Route path="/encaminhamentos-medico" element={<EncaminhamentosMedico />} />
                  <Route path="/agendamento" element={<Agendamento />} />
                  <Route path="/agenda-paciente" element={<AgendaPaciente />} />
                  <Route path="/historico" element={<Historico />} />
                  <Route path="/gerenciar-familia" element={<GerenciarFamilia />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthRedirectController>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
