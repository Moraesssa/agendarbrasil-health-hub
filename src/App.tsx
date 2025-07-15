
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MedicationProvider } from "@/contexts/MedicationContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastrar from "./pages/Cadastrar";
import UserTypeSelection from "./pages/UserTypeSelection";
import Onboarding from "./pages/Onboarding";
import CadastroPaciente from "./pages/CadastroPaciente";
import CadastroMedico from "./pages/CadastroMedico";
import Perfil from "./pages/Perfil";
import PerfilMedico from "./pages/PerfilMedico";
import Agendamento from "./pages/Agendamento";
import AgendaPaciente from "./pages/AgendaPaciente";
import AgendaMedico from "./pages/AgendaMedico";
import DashboardMedico from "./pages/DashboardMedico";
import DashboardFamiliar from "./pages/DashboardFamiliar";
import GerenciarAgenda from "./pages/GerenciarAgenda";
import GerenciarLocais from "./pages/GerenciarLocais";
import PacientesMedico from "./pages/PacientesMedico";
import EncaminhamentosMedico from "./pages/EncaminhamentosMedico";
import Historico from "./pages/Historico";
import GestaoMedicamentos from "./pages/GestaoMedicamentos";
import GerenciarFamilia from "./pages/GerenciarFamilia";
import GerenciarConexoes from "./pages/GerenciarConexoes";
import Financeiro from "./pages/Financeiro";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthRedirectController from "./components/AuthRedirectController";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <MedicationProvider>
                <AuthRedirectController />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastrar" element={<Cadastrar />} />
                  <Route path="/tipo-usuario" element={<UserTypeSelection />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
                  <Route path="/cadastro-medico" element={<CadastroMedico />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/perfil-medico" element={<PerfilMedico />} />
                  <Route path="/agendamento" element={<Agendamento />} />
                  <Route path="/agenda-paciente" element={<AgendaPaciente />} />
                  <Route path="/agenda-medico" element={<AgendaMedico />} />
                  <Route path="/dashboard-medico" element={<DashboardMedico />} />
                  <Route path="/dashboard-familiar" element={<DashboardFamiliar />} />
                  <Route path="/gerenciar-agenda" element={<GerenciarAgenda />} />
                  <Route path="/gerenciar-locais" element={<GerenciarLocais />} />
                  <Route path="/pacientes-medico" element={<PacientesMedico />} />
                  <Route path="/encaminhamentos-medico" element={<EncaminhamentosMedico />} />
                  <Route path="/historico" element={<Historico />} />
                  <Route path="/gestao-medicamentos" element={<GestaoMedicamentos />} />
                  <Route path="/gerenciar-familia" element={<GerenciarFamilia />} />
                  <Route path="/gerenciar-conexoes" element={<GerenciarConexoes />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MedicationProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
