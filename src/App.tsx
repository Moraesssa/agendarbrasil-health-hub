
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Agendamento from "./pages/Agendamento";
import AgendaPaciente from "./pages/AgendaPaciente";
import Historico from "./pages/Historico";
import Perfil from "./pages/Perfil";
import PerfilMedico from "./pages/PerfilMedico";
import Login from "./pages/Login";
import Cadastrar from "./pages/Cadastrar";
import CadastroMedico from "./pages/CadastroMedico";
import CadastroPaciente from "./pages/CadastroPaciente";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastrar" element={<Cadastrar />} />
          <Route path="/cadastro-medico" element={<CadastroMedico />} />
          <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/agenda-paciente" element={<AgendaPaciente />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil-medico" element={<PerfilMedico />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
