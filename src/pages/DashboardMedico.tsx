
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ConsultasChart } from "@/components/dashboard/ConsultasChart";
import { TiposConsultaChart } from "@/components/dashboard/TiposConsultaChart";
import { PacientesRecentes } from "@/components/dashboard/PacientesRecentes";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { PendingAppointmentsAlert } from "@/components/dashboard/PendingAppointmentsAlert";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

const DashboardMedico = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalConsultas: 0,
    consultasHoje: 0,
    consultasProximaSemana: 0,
    pacientesAtivos: 0
  });

  const [proximasConsultas, setProximasConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Buscar estatísticas gerais
      const { data: totalConsultas } = await supabase
        .from('consultas')
        .select('id', { count: 'exact' })
        .eq('medico_id', user.id);

      // Consultas de hoje
      const hoje = new Date();
      const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0));
      const fimHoje = new Date(hoje.setHours(23, 59, 59, 999));
      
      const { data: consultasHoje } = await supabase
        .from('consultas')
        .select('id', { count: 'exact' })
        .eq('medico_id', user.id)
        .gte('consultation_date', inicioHoje.toISOString())
        .lte('consultation_date', fimHoje.toISOString());

      // Consultas próxima semana
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      
      const { data: consultasProximaSemana } = await supabase
        .from('consultas')
        .select('id', { count: 'exact' })
        .eq('medico_id', user.id)
        .gte('consultation_date', new Date().toISOString())
        .lte('consultation_date', proximaSemana.toISOString());

      // Pacientes únicos
      const { data: pacientesUnicos } = await supabase
        .from('consultas')
        .select('paciente_id')
        .eq('medico_id', user.id);

      const pacientesAtivos = new Set(pacientesUnicos?.map(p => p.paciente_id) || []).size;

      // Próximas consultas com dados do paciente
      const { data: proximasConsultasData } = await supabase
        .from('consultas')
        .select(`
          *,
          patient_profile:profiles!consultas_paciente_id_fkey (
            display_name
          )
        `)
        .eq('medico_id', user.id)
        .gte('consultation_date', new Date().toISOString())
        .order('consultation_date', { ascending: true })
        .limit(5);

      setStats({
        totalConsultas: totalConsultas?.length || 0,
        consultasHoje: consultasHoje?.length || 0,
        consultasProximaSemana: consultasProximaSemana?.length || 0,
        pacientesAtivos
      });

      setProximasConsultas(proximasConsultasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Médico</h1>
          <p className="text-gray-600 mt-2">Visão geral da sua prática médica</p>
        </div>
      </div>

      {/* Alertas de Consultas Pendentes */}
      <PendingAppointmentsAlert />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consultas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConsultas}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.consultasHoje}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próxima Semana</p>
                <p className="text-2xl font-bold text-gray-900">{stats.consultasProximaSemana}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pacientes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pacientesAtivos}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximas Consultas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : proximasConsultas.length > 0 ? (
                <div className="space-y-4">
                  {proximasConsultas.map((consulta) => {
                    const { date, time } = formatDateTime(consulta.consultation_date);
                    return (
                      <div key={consulta.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-medium text-gray-900">
                            {consulta.patient_profile?.display_name || 'Paciente não identificado'}
                          </p>
                          <p className="text-sm text-gray-600">{consulta.consultation_type || 'Consulta'}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>{date}</p>
                          <p>{time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma consulta agendada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        <AlertsSection />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráficos */}
        <ConsultasChart />
        <TiposConsultaChart />
      </div>

      {/* Pacientes Recentes */}
      <PacientesRecentes />
    </div>
  );
};

export default DashboardMedico;
