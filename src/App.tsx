// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthRedirectController } from "@/components/AuthRedirectController"; // <<-- IMPORTE O NOVO COMPONENTE

// Páginas - Rotas Públicas
import Index from "./pages/Index";
import Login from "./pages/Login";

// Páginas - Configuração Inicial
import UserTypeSelection from "./pages/UserTypeSelection";
import Onboarding from "./pages/Onboarding";

// Páginas - Paciente
import Agendamento from "./pages/Agendamento";
import AgendaPaciente from "./pages/AgendaPaciente";
import Perfil from "./pages/Perfil";
import Historico from "./pages/Historico";

// Páginas - Médico
import DashboardMedico from "./pages/DashboardMedico";
import AgendaMedico from "./pages/AgendaMedico";
import PerfilMedico from "./pages/PerfilMedico";

// Páginas - Sistema
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* O AuthRedirectController agora envolve as rotas */}
          <AuthRedirectController>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Configuração Inicial */}
              <Route path="/user-type" element={<UserTypeSelection />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              {/* Rotas do Paciente */}
              <Route path="/agendamento" element={<Agendamento />} />
              <Route path="/agenda-paciente" element={<AgendaPaciente />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/historico" element={<Historico />} />
              
              {/* Rotas do Médico */}
              <Route path="/dashboard-medico" element={<DashboardMedico />} />
              <Route path="/agenda-medico" element={<AgendaMedico />} />
              <Route path="/perfil-medico" element={<PerfilMedico />} />
              
              {/* Sistema */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthRedirectController>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;