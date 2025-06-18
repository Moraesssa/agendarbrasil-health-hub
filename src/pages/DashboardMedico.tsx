
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ConsultasChart } from "@/components/dashboard/ConsultasChart";
import { TiposConsultaChart } from "@/components/dashboard/TiposConsultaChart";
import { PacientesRecentes } from "@/components/dashboard/PacientesRecentes";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DashboardMedico = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Mensagem de boas-vindas quando o médico acessa o dashboard
    toast({
      title: "Bem-vindo ao Dashboard Médico!",
      description: "Aqui você pode gerenciar suas consultas e acompanhar métricas importantes.",
    });
  }, [toast]);

  const handleQuickNavigation = (route: string, title: string) => {
    navigate(route);
    toast({
      title: `Navegando para ${title}`,
      description: "Carregando página...",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50 transition-colors" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Dashboard Médico
              </h1>
              <p className="text-sm text-gray-600">Visão geral da sua prática médica</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6 space-y-8">
              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div 
                  className="p-4 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                  onClick={() => handleQuickNavigation("/agenda-medico", "Agenda Médica")}
                >
                  <h3 className="font-semibold">Agenda do Dia</h3>
                  <p className="text-sm opacity-90">Visualizar consultas de hoje</p>
                </div>
                <div 
                  className="p-4 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600 transition-colors shadow-lg"
                  onClick={() => handleQuickNavigation("/agendamento", "Novo Agendamento")}
                >
                  <h3 className="font-semibold">Nova Consulta</h3>
                  <p className="text-sm opacity-90">Agendar para paciente</p>
                </div>
                <div 
                  className="p-4 bg-purple-500 text-white rounded-lg cursor-pointer hover:bg-purple-600 transition-colors shadow-lg"
                  onClick={() => handleQuickNavigation("/historico", "Histórico")}
                >
                  <h3 className="font-semibold">Histórico</h3>
                  <p className="text-sm opacity-90">Ver atendimentos anteriores</p>
                </div>
              </div>

              <MetricsCards />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ConsultasChart />
                <TiposConsultaChart />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  <PacientesRecentes />
                </div>
                <div className="xl:col-span-1">
                  <AlertsSection />
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardMedico;
