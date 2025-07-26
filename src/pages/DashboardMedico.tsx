
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useConsultas } from "@/hooks/useConsultas";
import { ConsultasChart } from "@/components/dashboard/ConsultasChart";
import { TiposConsultaChart } from "@/components/dashboard/TiposConsultaChart";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { PendingAppointmentsAlert } from "@/components/dashboard/PendingAppointmentsAlert";
import AppointmentSkeleton from "@/components/appointments/AppointmentSkeleton";
import EmptyStateCard from "@/components/appointments/EmptyStateCard";
import ErrorCard from "@/components/appointments/ErrorCard";

const DashboardMedico = () => {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  const { consultas, loading, error, refetch } = useConsultas({
    status: statusFilter.length > 0 ? statusFilter as any[] : undefined,
    futureOnly: false
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'bg-blue-500 text-white';
      case 'confirmada':
        return 'bg-green-500 text-white';
      case 'realizada':
        return 'bg-gray-500 text-white';
      case 'cancelada':
        return 'bg-red-500 text-white';
      case 'pendente':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'Agendada';
      case 'confirmada':
        return 'Confirmada';
      case 'realizada':
        return 'Realizada';
      case 'cancelada':
        return 'Cancelada';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  // Calculando métricas do dashboard
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const consultasHoje = consultas.filter(consulta => {
    const consultationDate = new Date(consulta.consultation_date);
    return consultationDate >= startOfToday && consultationDate <= endOfToday;
  });

  const consultasConfirmadas = consultas.filter(consulta => consulta.status === 'confirmada');
  const consultasPendentes = consultas.filter(consulta => consulta.status === 'agendada');

  const proximasConsultas = consultas.filter(consulta => {
    const consultationDate = new Date(consulta.consultation_date);
    return consultationDate > new Date() && 
           (consulta.status === 'agendada' || consulta.status === 'confirmada');
  }).slice(0, 5);

  const consultasRecentes = consultas.filter(consulta => 
    consulta.status === 'realizada' || consulta.status === 'cancelada'
  ).slice(0, 5);

  // Preparar dados para os gráficos
  const chartData = consultas.reduce((acc, consulta) => {
    const date = new Date(consulta.consultation_date).toLocaleDateString('pt-BR');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.consultas++;
    } else {
      acc.push({ date, consultas: 1 });
    }
    return acc;
  }, [] as { date: string; consultas: number }[]);

  const tiposConsultaData = consultas.reduce((acc, consulta) => {
    const tipo = consulta.consultation_type || 'Não especificado';
    const existing = acc.find(item => item.tipo === tipo);
    if (existing) {
      existing.quantidade++;
    } else {
      acc.push({ tipo, quantidade: 1 });
    }
    return acc;
  }, [] as { tipo: string; quantidade: number }[]);

  if (error) {
    return <ErrorCard message={error} onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Médico</h1>
          <p className="text-gray-600 mt-2">Visão geral das suas consultas e atividades</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refetch}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alerta de consultas pendentes */}
      <PendingAppointmentsAlert />

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasHoje.length}</div>
            <p className="text-xs text-muted-foreground">
              {consultasHoje.filter(c => c.status === 'confirmada').length} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasConfirmadas.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de consultas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasPendentes.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultas.length}</div>
            <p className="text-xs text-muted-foreground">
              Todas as consultas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ConsultasChart data={chartData} loading={loading} />
        <TiposConsultaChart data={tiposConsultaData} loading={loading} />
      </div>

      {/* Próximas consultas e histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <AppointmentSkeleton key={i} />
                ))}
              </div>
            ) : proximasConsultas.length > 0 ? (
              <div className="space-y-4">
                {proximasConsultas.map((consulta) => (
                  <div key={consulta.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Paciente ID: {consulta.paciente_id?.substring(0, 8)}
                        </h3>
                        <Badge className={`${getStatusColor(consulta.status || '')} text-xs mt-1`}>
                          {getStatusText(consulta.status || '')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(consulta.consultation_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(consulta.consultation_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {consulta.consultation_type && (
                        <div className="flex items-center gap-1 col-span-2">
                          <User className="h-4 w-4" />
                          {consulta.consultation_type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateCard 
                onSchedule={() => window.location.href = '/agenda-medico'}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <AppointmentSkeleton key={i} />
                ))}
              </div>
            ) : consultasRecentes.length > 0 ? (
              <div className="space-y-4">
                {consultasRecentes.map((consulta) => (
                  <div key={consulta.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Paciente ID: {consulta.paciente_id?.substring(0, 8)}
                        </h3>
                        <Badge className={`${getStatusColor(consulta.status || '')} text-xs mt-1`}>
                          {getStatusText(consulta.status || '')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(consulta.consultation_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(consulta.consultation_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {consulta.consultation_type && (
                        <div className="flex items-center gap-1 col-span-2">
                          <User className="h-4 w-4" />
                          {consulta.consultation_type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma consulta no histórico</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMedico;
