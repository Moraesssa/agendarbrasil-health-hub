
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { useConsultas } from '@/hooks/useConsultas';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import AppointmentCard from '@/components/appointments/AppointmentCard';
import AppointmentSkeleton from '@/components/appointments/AppointmentSkeleton';
import EmptyStateCard from '@/components/appointments/EmptyStateCard';
import ErrorCard from '@/components/appointments/ErrorCard';
import { ConsultasStatusFilter } from '@/components/dashboard/ConsultasStatusFilter';

type AppointmentStatus = 'agendada' | 'confirmada' | 'cancelada' | 'realizada' | 'pendente';

const AgendaPaciente = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  const filters = {
    status: selectedStatuses.length > 0 ? selectedStatuses as AppointmentStatus[] : undefined,
    futureOnly: !showPastAppointments
  };

  const { consultas, loading, error, refetch, updateConsultaStatus } = useConsultas(filters);

  // Handlers for AppointmentCard actions
  const handleConfirmAppointment = async (appointmentId: string) => {
    const result = await updateConsultaStatus(appointmentId, 'confirmada');
    if (result.success) {
      toast({ title: "Consulta confirmada!", description: "Sua presença foi confirmada com sucesso." });
    } else {
      toast({ title: "Erro", description: "Não foi possível confirmar a consulta.", variant: "destructive" });
    }
  };

  const handleViewDetails = (appointment: any) => {
    toast({
      title: "Detalhes da Consulta",
      description: `Consulta com ${appointment.doctor_profile?.display_name || 'Médico'} em ${new Date(appointment.consultation_date).toLocaleDateString('pt-BR')}.`,
    });
  };

  const handleGetDirections = (appointment: any) => {
    if (appointment.local_consulta) {
      toast({
        title: "Obtendo direções...",
        description: `Abrindo mapa para ${appointment.local_consulta}.`,
      });
      // Here you would typically open a map link
    }
  };

  const handleStartVideoCall = (appointment: any) => {
    toast({
      title: "Iniciando videochamada...",
      description: "O link para a chamada será disponibilizado 30 minutos antes do início.",
    });
    // Here you would typically integrate with a video call service
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Faça login para ver suas consultas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Minhas Consultas</h1>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorCard 
          message={error} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Minhas Consultas</h1>
        
        <div className="flex flex-wrap gap-2">
          <ConsultasStatusFilter
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
          />
          <Button
            variant={showPastAppointments ? "default" : "outline"}
            onClick={() => setShowPastAppointments(!showPastAppointments)}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showPastAppointments ? 'Ocultar Antigas' : 'Mostrar Antigas'}
          </Button>
        </div>
      </div>

      {consultas.length === 0 ? (
        <EmptyStateCard 
          message="Nenhuma consulta encontrada"
          description="Você ainda não tem consultas agendadas ou não há consultas que correspondam aos filtros selecionados."
          onSchedule={() => window.location.href = '/agendamento'}
        />
      ) : (
        <div className="grid gap-6">
          {consultas.map((consulta) => (
            <AppointmentCard
              key={consulta.id}
              appointment={consulta}
              onConfirm={handleConfirmAppointment}
              onViewDetails={handleViewDetails}
              onGetDirections={handleGetDirections}
              onStartVideoCall={handleStartVideoCall}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaPaciente;
