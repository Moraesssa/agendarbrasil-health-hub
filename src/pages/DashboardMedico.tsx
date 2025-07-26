
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
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
        return;
      }

      const processedConsultas = (consultasData || []).map(consulta => ({
        ...consulta,
        patient_name: consulta.patient_profiles?.display_name || consulta.patient_name || 'Paciente'
      })) as ConsultaData[];

      setConsultas(processedConsultas);

      // Calculate metrics
      const now = new Date();
      const today = now.toDateString();
      
      const totalConsultas = processedConsultas.length;
      const consultasHoje = processedConsultas.filter(c => 
        new Date(c.consultation_date).toDateString() === today
      ).length;
      const consultasPendentes = processedConsultas.filter(c => 
        c.status === 'agendada' && new Date(c.consultation_date) >= now
      ).length;
      const pacientesUnicos = new Set(processedConsultas.map(c => c.paciente_id)).size;

      setMetrics({
        totalConsultas,
        consultasHoje,
        consultasPendentes,
        pacientesUnicos
      });

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
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
        dia: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
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

    return Object.entries(tipos).map(([tipo, quantidade]) => ({
      dia: tipo,
      valor: quantidade,
      cor: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Médico</h1>
        <Badge variant="secondary">
          {new Date().toLocaleDateString('pt-BR')}
        </Badge>
      </div>

      <PendingAppointmentsAlert />

      <MetricsCards
        totalConsultas={metrics.totalConsultas}
        consultasHoje={metrics.consultasHoje}
        consultasPendentes={metrics.consultasPendentes}
        pacientesUnicos={metrics.pacientesUnicos}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ConsultasChart data={chartData} />
        <TiposConsultaChart data={tiposConsultaData} />
      </div>

      <PacientesRecentes consultas={consultas.slice(0, 5)} />
    </div>
  );
};

export default DashboardMedico;
