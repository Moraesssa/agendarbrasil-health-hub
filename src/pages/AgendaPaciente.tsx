
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Phone, FileText, AlertCircle } from "lucide-react";
import { useConsultas } from "@/hooks/useConsultas";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentSkeleton } from "@/components/appointments/AppointmentSkeleton";
import { EmptyStateCard } from "@/components/appointments/EmptyStateCard";
import { ErrorCard } from "@/components/appointments/ErrorCard";
import { ConsultasStatusFilter } from "@/components/dashboard/ConsultasStatusFilter";

const AgendaPaciente = () => {
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
      default:
        return status;
    }
  };

  const getPriorityAppointments = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return consultas.filter(consulta => {
      const consultationDate = new Date(consulta.consultation_date);
      return consultationDate <= tomorrow && 
             (consulta.status === 'agendada' || consulta.status === 'confirmada');
    });
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return consultas.filter(consulta => {
      const consultationDate = new Date(consulta.consultation_date);
      return consultationDate > now && 
             (consulta.status === 'agendada' || consulta.status === 'confirmada');
    }).slice(0, 5);
  };

  const getRecentAppointments = () => {
    return consultas.filter(consulta => 
      consulta.status === 'realizada' || consulta.status === 'cancelada'
    ).slice(0, 5);
  };

  if (error) {
    return <ErrorCard message={error} onRetry={refetch} />;
  }

  const priorityAppointments = getPriorityAppointments();
  const upcomingAppointments = getUpcomingAppointments();
  const recentAppointments = getRecentAppointments();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minha Agenda</h1>
          <p className="text-gray-600 mt-2">Visualize e gerencie suas consultas médicas</p>
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <ConsultasStatusFilter 
            selectedStatuses={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </CardContent>
      </Card>

      {/* Consultas Prioritárias */}
      {priorityAppointments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Consultas Prioritárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityAppointments.map((consulta) => (
              <div key={consulta.id} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {consulta.doctor_profile?.display_name || 'Médico não identificado'}
                    </h3>
                    <Badge className={`${getStatusColor(consulta.status || '')} text-xs`}>
                      {getStatusText(consulta.status || '')}
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(consulta.consultation_date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" />
                      {new Date(consulta.consultation_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                {consulta.consultation_type && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FileText className="h-4 w-4" />
                    {consulta.consultation_type}
                  </div>
                )}
                
                {consulta.local_consulta && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {consulta.local_consulta}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Consultas */}
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
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((consulta) => (
                  <div key={consulta.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {consulta.doctor_profile?.display_name || 'Médico não identificado'}
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
                          <FileText className="h-4 w-4" />
                          {consulta.consultation_type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateCard 
                message="Nenhuma consulta agendada"
                description="Suas próximas consultas aparecerão aqui"
              />
            )}
          </CardContent>
        </Card>

        {/* Histórico Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
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
            ) : recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((consulta) => (
                  <div key={consulta.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {consulta.doctor_profile?.display_name || 'Médico não identificado'}
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
                          <FileText className="h-4 w-4" />
                          {consulta.consultation_type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateCard 
                message="Nenhuma consulta no histórico"
                description="Suas consultas realizadas aparecerão aqui"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Todas as Consultas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <AppointmentSkeleton key={i} />
              ))}
            </div>
          ) : consultas.length > 0 ? (
            <div className="space-y-4">
              {consultas.map((consulta) => (
                <AppointmentCard
                  key={consulta.id}
                  appointment={{
                    id: consulta.id,
                    consultation_date: consulta.consultation_date,
                    consultation_type: consulta.consultation_type || '',
                    status: consulta.status || '',
                    doctor_name: consulta.doctor_profile?.display_name || 'Médico não identificado'
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard 
              message="Nenhuma consulta encontrada"
              description="Você ainda não possui consultas agendadas"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaPaciente;
