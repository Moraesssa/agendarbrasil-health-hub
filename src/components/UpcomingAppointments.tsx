
import { Calendar, Clock, User, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useConsultas } from "@/hooks/useConsultas";

import AppointmentSkeleton from "./appointments/AppointmentSkeleton";
import ErrorCard from "./appointments/ErrorCard";
import EmptyStateCard from "./appointments/EmptyStateCard";
import AppointmentCard from "./appointments/AppointmentCard";

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Buscar apenas consultas futuras com status válidos (excluir canceladas)
  const { consultas, loading, error, refetch, updateConsultaStatus } = useConsultas({
    status: ['agendada', 'confirmada', 'pendente'],
    futureOnly: true,
    limit: 3
  });

  const handleRetry = () => {
    refetch();
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

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5" />
            Próximas Consultas
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700"
            onClick={() => navigate("/agenda-paciente")}
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
          consultas.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={handleConfirmAppointment}
              onViewDetails={handleViewDetails}
              onGetDirections={handleGetDirections}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;
