
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthRedirectController } from "@/components/AuthRedirectController";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { logger } from "@/utils/logger";

// Lazy load all pages for better performance
const Index = React.lazy(() => 
  import("./pages/Index").catch(err => {
    logger.error("Failed to load Index page", "App", err);
    throw err;
  })
);

const Login = React.lazy(() => 
  import("./pages/Login").catch(err => {
    logger.error("Failed to load Login page", "App", err);
    throw err;
  })
);

const UserTypeSelection = React.lazy(() => 
  import("./pages/UserTypeSelection").catch(err => {
    logger.error("Failed to load UserTypeSelection page", "App", err);
    throw err;
  })
);

const Onboarding = React.lazy(() => 
  import("./pages/Onboarding").catch(err => {
    logger.error("Failed to load Onboarding page", "App", err);
    throw err;
  })
);

// Paciente pages
const Agendamento = React.lazy(() => 
  import("./pages/Agendamento").catch(err => {
    logger.error("Failed to load Agendamento page", "App", err);
    throw err;
  })
);

const AgendaPaciente = React.lazy(() => 
  import("./pages/AgendaPaciente").catch(err => {
    logger.error("Failed to load AgendaPaciente page", "App", err);
    throw err;
  })
);

const Perfil = React.lazy(() => 
  import("./pages/Perfil").catch(err => {
    logger.error("Failed to load Perfil page", "App", err);
    throw err;
  })
);

const Historico = React.lazy(() => 
  import("./pages/Historico").catch(err => {
    logger.error("Failed to load Historico page", "App", err);
    throw err;
  })
);

// Médico pages
const DashboardMedico = React.lazy(() => 
  import("./pages/DashboardMedico").catch(err => {
    logger.error("Failed to load DashboardMedico page", "App", err);
    throw err;
  })
);

const AgendaMedico = React.lazy(() => 
  import("./pages/AgendaMedico").catch(err => {
    logger.error("Failed to load AgendaMedico page", "App", err);
    throw err;
  })
);

const PerfilMedico = React.lazy(() => 
  import("./pages/PerfilMedico").catch(err => {
    logger.error("Failed to load PerfilMedico page", "App", err);
    throw err;
  })
);

const PacientesMedico = React.lazy(() => 
  import("./pages/PacientesMedico").catch(err => {
    logger.error("Failed to load PacientesMedico page", "App", err);
    throw err;
  })
);

const EncaminhamentosMedico = React.lazy(() => 
  import("./pages/EncaminhamentosMedico").catch(err => {
    logger.error("Failed to load EncaminhamentosMedico page", "App", err);
    throw err;
  })
);

const NotFound = React.lazy(() => 
  import("./pages/NotFound").catch(err => {
    logger.error("Failed to load NotFound page", "App", err);
    throw err;
  })
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        logger.warn(`Query failed, attempt ${failureCount + 1}`, "ReactQuery", error);
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        logger.error("Mutation error", "ReactQuery", error);
      },
    },
  },
});

const App = () => {
  logger.info("App initialized", "App");

  return (
    <ErrorBoundary context="App Root">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary context="Auth Provider">
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary context="Auth Redirect Controller">
                  <AuthRedirectController>
                    <Suspense fallback={<PageLoader message="Carregando página..." />}>
                      <ErrorBoundary context="Routes">
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
                          <Route path="/pacientes-medico" element={<PacientesMedico />} />
                          <Route path="/encaminhamentos-medico" element={<EncaminhamentosMedico />} />
                          
                          {/* Sistema */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ErrorBoundary>
                    </Suspense>
                  </AuthRedirectController>
                </ErrorBoundary>
              </BrowserRouter>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
