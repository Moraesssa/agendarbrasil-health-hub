
import { Calendar, Clock, User, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useConsultas } from "@/hooks/useConsultas";
import { useState, useEffect } from "react";

import AppointmentSkeleton from "./appointments/AppointmentSkeleton";
import ErrorCard from "./appointments/ErrorCard";
import EmptyStateCard from "./appointments/EmptyStateCard";
import AppointmentCard from "./appointments/AppointmentCard";

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showingFallback, setShowingFallback] = useState(false);
  
  // Primeiro tenta buscar consultas futuras com status válidos
  const { consultas: futureConsultas, loading: futureLoading, error: futureError, refetch: refetchFuture, updateConsultaStatus } = useConsultas({
    status: ['agendada', 'confirmada', 'pendente'],
    futureOnly: true,
    limit: 3
  });

  // Busca consultas recentes (incluindo canceladas) como fallback
  const { consultas: recentConsultas, loading: recentLoading, error: recentError, refetch: refetchRecent } = useConsultas({
    limit: 3
  });

  // Determina quais consultas mostrar
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!futureLoading && !recentLoading) {
      if (futureConsultas.length > 0) {
        setConsultas(futureConsultas);
        setShowingFallback(false);
        setError(futureError);
      } else if (recentConsultas.length > 0) {
        setConsultas(recentConsultas);
        setShowingFallback(true);
        setError(recentError);
      } else {
        setConsultas([]);
        setShowingFallback(false);
        setError(futureError || recentError);
      }
      setLoading(false);
    } else {
      setLoading(futureLoading || recentLoading);
    }
  }, [futureConsultas, recentConsultas, futureLoading, recentLoading, futureError, recentError]);

  const handleRetry = () => {
    refetchFuture();
    refetchRecent();
  };

  const handleScheduleAppointment = () => {
    toast({
      title: "Redirecionando para agendamento",
      description: "Vamos ajudá-lo a encontrar o médico ideal!",
    });
    navigate("/agendamento");
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    const result = await updateConsultaStatus(appointmentId, 'confirmada');
    
    if (result.success) {
      toast({
        title: "Consulta confirmada!",
        description: "Você receberá um lembrete antes da consulta",
      });
    } else {
      toast({ 
        title: "Erro", 
        description: "Não foi possível confirmar a consulta.", 
        variant: "destructive" 
      });
    }
  };

  const handleViewDetails = (appointment: any) => {
    if (appointment.tipo_consulta === 'Online') {
      toast({
        title: "Link da consulta",
        description: "O link será enviado por SMS e email 30 minutos antes da consulta",
      });
    } else {
      toast({
        title: "Detalhes da consulta",
        description: `${appointment.doctor_profile?.display_name} - ${appointment.local_consulta}`,
      });
    }
  };

  const handleGetDirections = (appointment: any) => {
    if (appointment.tipo_consulta !== 'Online') {
      toast({
        title: "Abrindo mapa",
        description: `Direções para ${appointment.local_consulta}`,
      });
    }
  };

  // Determina o título baseado no que está sendo exibido
  const getCardTitle = () => {
    if (showingFallback) {
      return "Consultas Recentes";
    }
    return "Próximas Consultas";
  };

  // Determina se deve mostrar o botão "Ver todas"
  const getViewAllRoute = () => {
    return "/agenda-paciente";
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5" />
            {getCardTitle()}
            {showingFallback && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Histórico
              </span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700"
            onClick={() => navigate(getViewAllRoute())}
          >
            Ver todas
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <AppointmentSkeleton />
            <AppointmentSkeleton />
            <AppointmentSkeleton />
          </>
        ) : error ? (
          <ErrorCard onRetry={handleRetry} />
        ) : consultas.length === 0 ? (
          <EmptyStateCard onSchedule={handleScheduleAppointment} />
        ) : (
          <>
            {showingFallback && (
              <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="font-medium text-orange-800">📋 Exibindo consultas recentes</p>
                <p>Não há consultas futuras agendadas. <button 
                  onClick={handleScheduleAppointment}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Agendar nova consulta
                </button></p>
              </div>
            )}
            {consultas.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onConfirm={handleConfirmAppointment}
                onViewDetails={handleViewDetails}
                onGetDirections={handleGetDirections}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;
