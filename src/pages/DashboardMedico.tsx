
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ConsultasChart } from "@/components/dashboard/ConsultasChart";
import { TiposConsultaChart } from "@/components/dashboard/TiposConsultaChart";
import { PacientesRecentes } from "@/components/dashboard/PacientesRecentes";
import { AlertsSection } from "@/components/dashboard/AlertsSection";

const DashboardMedico = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-blue-100 bg-white/80 backdrop-blur-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Dashboard Médico
              </h1>
              <p className="text-sm text-gray-600">Visão geral da sua prática médica</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <MetricsCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ConsultasChart />
              <TiposConsultaChart />
            </div>

            <PacientesRecentes />

            <AlertsSection />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardMedico;
