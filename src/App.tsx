
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Agendamento from "./pages/Agendamento";
import AgendaPaciente from "./pages/AgendaPaciente";
import AgendaMedico from "./pages/AgendaMedico";
import DashboardMedico from "./pages/DashboardMedico";
import Historico from "./pages/Historico";
import Perfil from "./pages/Perfil";
import PerfilMedico from "./pages/PerfilMedico";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import UserTypeSelection from "./pages/UserTypeSelection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/user-type" element={<UserTypeSelection />} />
            <Route path="/agendamento" element={<Agendamento />} />
            <Route path="/agenda-paciente" element={<AgendaPaciente />} />
            <Route path="/agenda-medico" element={<AgendaMedico />} />
            <Route path="/dashboard-medico" element={<DashboardMedico />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil-medico" element={<PerfilMedico />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
