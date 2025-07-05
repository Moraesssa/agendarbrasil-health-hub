import { useEffect, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContextV2";
import { supabase } from "@/integrations/supabase/client";
import { financeService } from "@/services/financeService";
import { PageLoader } from "@/components/PageLoader";
import HealthSummary from "@/components/HealthSummary";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";

// Tipagem para os dados do dashboard
interface DashboardData {
  metrics: {
    pacientesHoje: number;
    receitaSemanal: number;
    proximasConsultas: number;
    tempoMedio: number;
  };
  consultasChart: { dia: string; consultas: number }[];
  tiposConsultaChart: { tipo: string; valor: number; cor: string }[];
}

const DashboardMedico = () => {
  const { toast } = useToast();
  const { user, userData } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // Supondo que o ID do paciente esteja disponível, por exemplo, do primeiro paciente da lista
  // Em um cenário real, este ID viria de uma seleção de paciente no dashboard
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { summaryData: healthSummaryData, isLoading: healthLoading, error: healthError } = useHealthMetrics(selectedPatientId || '');

  useEffect(() => {
    toast({
      title: "Bem-vindo ao Dashboard Médico!",
      description: "Aqui você pode gerenciar suas consultas e acompanhar métricas importantes.",
    });
  }, [toast]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !userData) {
        setLoading(true);
        return;
      }
      setLoading(true);

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      startOfWeek.setUTCHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setUTCHours(23, 59, 59, 999);

      try {
        const { data: weeklyAppointments, error } = await supabase
          .from('consultas')
          .select('data_consulta, tipo_consulta, status')
          .gte('data_consulta', startOfWeek.toISOString())
          .lte('data_consulta', endOfWeek.toISOString());
        
        if (error) throw error;

        const todayString = new Date().toISOString().split('T')[0];
        const todayAppointments = weeklyAppointments.filter(c => c.data_consulta.startsWith(todayString));
        
        try {
          const resumoFinanceiro = await financeService.getResumoFinanceiro(user.id);
          const receitaSemanal = resumoFinanceiro.receitaSemanal;
          
          const proximasConsultas = todayAppointments.filter(c => new Date(c.data_consulta) > new Date()).length;

          const metrics = {
            pacientesHoje: todayAppointments.length,
            receitaSemanal,
            proximasConsultas,
            tempoMedio: (userData as any).configuracoes?.duracaoConsulta || 30,
          };

          const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          const consultasSemanais = weekDays.map(dia => ({ dia, consultas: 0 }));
          weeklyAppointments.forEach(c => {
            const dayIndex = new Date(c.data_consulta).getDay();
            consultasSemanais[dayIndex].consultas++;
          });

          const tiposMap: { [key: string]: number } = {};
          weeklyAppointments.forEach(c => {
            const tipo = c.tipo_consulta || 'Outro';
            tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;
          });

          const totalConsultas = weeklyAppointments.length;
          const colors = ["#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f97316"];
          const tiposConsultaChart = Object.entries(tiposMap).map(([tipo, valor], index) => ({
            tipo,
            valor: totalConsultas > 0 ? parseFloat(((valor / totalConsultas) * 100).toFixed(2)) : 0,
            cor: colors[index % colors.length]
          }));
          
          setDashboardData({
            metrics,
            consultasChart: consultasSemanais.slice(1).concat(consultasSemanais.slice(0, 1)),
            tiposConsultaChart
          });
        } catch (financeError) {
          console.error("Erro ao buscar dados financeiros:", financeError);
          const metrics = {
            pacientesHoje: todayAppointments.length,
            receitaSemanal: 0,
            proximasConsultas: todayAppointments.filter(c => new Date(c.data_consulta) > new Date()).length,
            tempoMedio: (userData as any).configuracoes?.duracaoConsulta || 30,
          };
          
          setDashboardData({
            metrics,
            consultasChart: [],
            tiposConsultaChart: []
          });
        }
        
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados do dashboard.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, userData, toast]);

  if (loading) {
    return <PageLoader message="Carregando seu dashboard..." />;
  }

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
            <div className="container max-w-7xl mx-auto p-6 space-y-6">
              <MetricsCards data={dashboardData?.metrics} loading={loading} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="w-full">
                  <ConsultasChart data={dashboardData?.consultasChart} loading={loading} />
                </div>
                <div className="w-full">
                  <TiposConsultaChart data={dashboardData?.tiposConsultaChart} loading={loading} />
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <PacientesRecentes />
                </div>
                <div className="xl:col-span-1">
                  <AlertsSection />
                </div>
              </div>
              {selectedPatientId && !healthLoading && healthSummaryData && (
                <HealthSummary
                  healthMetrics={healthSummaryData.healthMetrics}
                  healthScore={healthSummaryData.healthScore}
                />
              )}
              {selectedPatientId && healthLoading && <p>Carregando resumo de saúde...</p>}
              {healthError && <p className="text-red-500">Erro ao carregar resumo de saúde.</p>}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardMedico;
