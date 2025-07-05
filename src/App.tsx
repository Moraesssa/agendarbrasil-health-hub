import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContextV2';
import { HealthDataCacheProvider } from '@/contexts/HealthDataCacheContext';
import { AuthRedirectControllerV2 } from '@/components/AuthRedirectControllerV2';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import MarcarRetorno from '@/pages/MarcarRetorno';
import Agendamento from '@/pages/Agendamento';
import AgendaPaciente from '@/pages/AgendaPaciente';
import Historico from '@/pages/Historico';
import NotFound from '@/pages/NotFound';
import GerenciarFamilia from '@/pages/GerenciarFamilia';
import DashboardFamiliar from '@/pages/DashboardFamiliar';
import Medicamentos from '@/pages/Medicamentos';
import AdicionarMetrica from '@/pages/AdicionarMetrica';
import NotificacoesMedico from '@/pages/NotificacoesMedico';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <ErrorBoundary context="App">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <HealthDataCacheProvider>
                <NotificationProvider>
                  <AuthRedirectControllerV2>
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
                      <Route path="/perfil/notificacoes" element={<NotificacoesMedico />} />
                      <Route path="/agenda-medico" element={<AgendaMedico />} />
                      <Route path="/gerenciar-agenda" element={<GerenciarAgenda />} />
                      <Route path="/gerenciar-locais" element={<GerenciarLocais />} />
                      <Route path="/pacientes-medico" element={<PacientesMedico />} />
                      <Route path="/encaminhamentos-medico" element={<EncaminhamentosMedico />} />
                      <Route path="/financeiro" element={<Financeiro />} />
                      <Route path="/marcar-retorno" element={<MarcarRetorno />} />
                      <Route path="/agendamento" element={<Agendamento />} />
                      <Route path="/agenda-paciente" element={<AgendaPaciente />} />
                      <Route path="/historico" element={<Historico />} />
                      <Route path="/gerenciar-familia" element={<GerenciarFamilia />} />
                      <Route path="/dashboard-familiar" element={<DashboardFamiliar />} />
                      <Route path="/medicamentos" element={<Medicamentos />} />
                      <Route path="/adicionar-metrica" element={<AdicionarMetrica />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AuthRedirectControllerV2>
                </NotificationProvider>
              </HealthDataCacheProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
