
import { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, User, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextV2";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Importe o AppointmentSkeleton
import AppointmentSkeleton from "./appointments/AppointmentSkeleton";
import ErrorCard from "./appointments/ErrorCard";
import EmptyStateCard from "./appointments/EmptyStateCard";
import AppointmentCard from "./appointments/AppointmentCard";

// Type for appointments with doctor info from profiles table
type AppointmentWithDoctor = Tables<'consultas'> & {
  doctor_profile: {
    display_name: string | null;
  } | null;
};

const UpcomingAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("consultas")
        .select(`
          *,
          doctor_profile:profiles!consultas_medico_id_fkey (display_name)
        `)
        .gte("data_consulta", new Date().toISOString()) // Apenas consultas futuras
        .order("data_consulta", { ascending: true })
        .limit(3); // Pegar apenas as 3 próximas

      if (error) throw error;
      
      setAppointments(data || []);

    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
      setError("Erro ao carregar consultas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleRetry = () => {
    fetchAppointments();
  };

  const handleScheduleAppointment = () => {
    toast({
      title: "Redirecionando para agendamento",
      description: "Vamos ajudá-lo a encontrar o médico ideal!",
    });
    navigate("/agendamento");
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: 'confirmada' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Atualiza o estado local para refletir a confirmação
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? {...apt, status: 'confirmada'} : apt
      ));

      toast({
        title: "Consulta confirmada!",
        description: "Você receberá um lembrete antes da consulta",
      });
    } catch (error) {
      console.error("Erro ao confirmar consulta:", error);
      toast({ title: "Erro", description: "Não foi possível confirmar a consulta.", variant: "destructive" });
    }
  };

  const handleViewDetails = (appointment: AppointmentWithDoctor) => {
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

  const handleGetDirections = (appointment: AppointmentWithDoctor) => {
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
          // Renderiza skeletons enquanto carrega
          <>
            <AppointmentSkeleton />
            <AppointmentSkeleton />
            <AppointmentSkeleton />
          </>
        ) : error ? (
          // Renderiza um card de erro se houver falha
          <ErrorCard onRetry={handleRetry} />
        ) : appointments.length === 0 ? (
          // Renderiza um card de "empty state" se não houver consultas
          <EmptyStateCard onSchedule={handleScheduleAppointment} />
        ) : (
          // Renderiza as consultas encontradas
          appointments.map((appointment) => (
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
