
import { Calendar, Clock, User, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useConsultas } from "@/hooks/useConsultas";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

import AppointmentSkeleton from "./appointments/AppointmentSkeleton";
import ErrorCard from "./appointments/ErrorCard";
import EmptyStateCard from "./appointments/EmptyStateCard";
import AppointmentCard from "./appointments/AppointmentCard";
import { VideoCallModal } from "./video/VideoCallModal";
import { videoCallService } from "@/services/videoCallService";
import { PaymentStatusChecker } from "./PaymentStatusChecker";

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userData } = useAuth();
  
  // Busca consultas recentes e futuras
  const { consultas, loading, error, refetch, updateConsultaStatus } = useConsultas({
    futureOnly: true,
    limit: 10
  });

  const [videoCallModal, setVideoCallModal] = useState<{
    isOpen: boolean;
    appointment: any;
  }>({ isOpen: false, appointment: null });

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

  const handleStartVideoCall = async (appointment: any) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para acessar a videochamada.",
        variant: "destructive"
      });
      return;
    }

    // Verifica se pode acessar a sala
    const accessCheck = await videoCallService.canAccessVideoRoom(appointment.id, user.id);
    if (!accessCheck.success || !accessCheck.canAccess) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta videochamada.",
        variant: "destructive"
      });
      return;
    }

    // Cria ou obtém o room ID
    const roomResult = await videoCallService.createOrUpdateVideoRoom(appointment.id);
    if (!roomResult.success) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a sala de videochamada.",
        variant: "destructive"
      });
      return;
    }

    // Abre o modal da videochamada
    setVideoCallModal({
      isOpen: true,
      appointment: {
        ...appointment,
        video_room_id: roomResult.roomId
      }
    });
  };

  const getCardTitle = () => {
    const futureAppointments = consultas.filter(c => 
      new Date(c.data_consulta) > new Date() && 
      c.status_pagamento === 'pago'
    );
    
    return futureAppointments.length > 0 ? "Próximas Consultas" : "Consultas Recentes";
  };

  const showingFallback = consultas.length > 0 && 
    !consultas.some(c => 
      new Date(c.data_consulta) > new Date() && 
      c.status_pagamento === 'pago'
    );

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
                onStartVideoCall={handleStartVideoCall}
              />
            ))}
          </>
        )}
      </CardContent>

      {/* Payment Status Checker */}
      <PaymentStatusChecker onSuccess={refetch} />

      {/* Video Call Modal */}
      {videoCallModal.isOpen && videoCallModal.appointment && user && userData && (
        <VideoCallModal
          isOpen={videoCallModal.isOpen}
          onClose={() => setVideoCallModal({ isOpen: false, appointment: null })}
          appointment={videoCallModal.appointment}
          userName={userData.displayName || user.email || "Usuário"}
          userEmail={user.email || ""}
          isDoctor={userData.userType === "medico"}
        />
      )}
    </Card>
  );
};

export default UpcomingAppointments;
