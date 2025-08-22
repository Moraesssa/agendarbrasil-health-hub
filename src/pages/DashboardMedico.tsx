
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConsultasChart } from '@/components/dashboard/ConsultasChart';
import { TiposConsultaChart } from '@/components/dashboard/TiposConsultaChart';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { PacientesRecentes } from '@/components/dashboard/PacientesRecentes';
import { PendingAppointmentsAlert } from '@/components/dashboard/PendingAppointmentsAlert';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { financeService } from "@/services/financeService";
import { format, parseISO, isSameDay, isAfter, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LocationManagement } from "@/components/doctor/LocationManagement";
import { ScheduleManagement } from "@/components/doctor/ScheduleManagement";

interface ChartData {
  dia: string;
  valor: number;
  cor?: string;
}

interface ConsultaData {
  id: string;
  consultation_date: string;
  consultation_type: string;
  status: string;
  patient_name: string;
  paciente_id: string;
}

const DashboardMedico = () => {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<ConsultaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalConsultas: 0,
    consultasHoje: 0,
    consultasPendentes: 0,
    pacientesUnicos: 0
  });
  const [receitaSemanal, setReceitaSemanal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = React.useRef(true);

  useEffect(() => {
    document.title = 'Dashboard Médico | Consultas e Receita';
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const startDate = subDays(new Date(), 30).toISOString();

      // Fetch consultations with explicit foreign key reference
      const { data: consultasData, error: consultasError } = await supabase
        .from('consultas')
        .select(`
          id,
          consultation_date,
          consultation_type,
          status,
          patient_name,
          paciente_id,
          patient_profiles:profiles!consultas_paciente_id_fkey (
            display_name
          )
        `)
        .eq('medico_id', user.id)
        .order('consultation_date', { ascending: false })
        .limit(50);

      if (consultasError) {
        console.error('Erro ao buscar consultas:', consultasError);
        toast({
          title: 'Erro ao carregar consultas',
          description: 'Tente novamente em alguns instantes.',
          variant: 'destructive'
        });
        return;
      }

      const processedConsultas = (consultasData || []).map(consulta => ({
        ...consulta,
        patient_name: (consulta as any).patient_profiles?.display_name || consulta.patient_name || 'Paciente'
      })) as ConsultaData[];

      if (isMounted.current) {
        setConsultas(processedConsultas);
      }

      // Calculate metrics
      const now = new Date();

      const totalConsultas = processedConsultas.length;
      const consultasHoje = processedConsultas.filter(c =>
        isSameDay(parseISO(c.consultation_date), now)
      ).length;
      const consultasPendentes = processedConsultas.filter(c =>
        c.status === 'agendada' && isAfter(parseISO(c.consultation_date), now)
      ).length;
      const pacientesUnicos = new Set(processedConsultas.map(c => c.paciente_id)).size;

      if (isMounted.current) {
        setMetrics({
          totalConsultas,
          consultasHoje,
          consultasPendentes,
          pacientesUnicos
        });
      }

      // Financial weekly revenue
      try {
        const resumo = await financeService.getResumoFinanceiro(user.id);
        if (isMounted.current) {
          setReceitaSemanal(resumo.receitaSemanal || 0);
        }
      } catch (e) {
        console.error('Erro ao buscar resumo financeiro:', e);
      }

      if (isMounted.current) {
        setLastUpdated(new Date());
      }

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast({
        title: 'Erro no dashboard',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive'
      });
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Prepare chart data
  const chartData: ChartData[] = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const consultasNoDia = consultas.filter(c => 
        c.consultation_date?.startsWith(date)
      ).length;
      
      return {
        dia: format(parseISO(date), 'EEE', { locale: ptBR }),
        valor: consultasNoDia
      };
    });
  }, [consultas]);

  const tiposConsultaData: ChartData[] = React.useMemo(() => {
    const tipos = consultas.reduce((acc, consulta) => {
      const tipo = consulta.consultation_type || 'Geral';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tipos).map(([tipo, quantidade]) => {
      const hue = Array.from(tipo).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
      return {
        dia: tipo,
        valor: quantidade,
        cor: `hsl(${hue}, 70%, 50%)`
      };
    });
  }, [consultas]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para acessar o dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-12 flex items-center border-b">
            <SidebarTrigger className="ml-2" />
          </header>
          
          <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Dashboard Médico</h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {format(new Date(), 'P', { locale: ptBR })}
                </Badge>
                <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
                  Atualizar
                </Button>
                {lastUpdated && (
                  <span className="text-sm text-muted-foreground">
                    Atualizado às {format(lastUpdated, 'HH:mm', { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            <PendingAppointmentsAlert />

            <MetricsCards 
              data={{
                pacientesHoje: metrics.consultasHoje,
                receitaSemanal: receitaSemanal,
                proximasConsultas: metrics.consultasPendentes,
                tempoMedio: 30
              }}
              loading={loading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ConsultasChart 
                data={chartData.map(item => ({ dia: item.dia, consultas: item.valor }))}
                loading={loading}
              />
              <TiposConsultaChart 
                data={tiposConsultaData.map(item => ({ 
                  tipo: item.dia, 
                  valor: item.valor, 
                  cor: item.cor || '#3b82f6' 
                }))}
                loading={loading}
              />
            </div>

            <PacientesRecentes />

            {/* Enhanced Doctor Management Modules */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
              <LocationManagement />
              <ScheduleManagement />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardMedico;
