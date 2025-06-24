import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Phone, MoreVertical, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

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

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Com RLS habilitado, não precisamos mais filtrar por paciente_id
        // O Supabase automaticamente retornará apenas as consultas do paciente logado
        const { data, error } = await supabase
          .from("consultas")
          .select(`
            *,
            doctor_profile:profiles!consultas_medico_id_fkey (display_name)
          `)
          .gte("data_consulta", new Date().toISOString())
          .order("data_consulta", { ascending: true })
          .limit(3);

        if (error) throw error;
        
        setAppointments(data || []);

      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
        toast({ title: "Erro", description: "Não foi possível carregar as próximas consultas.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-700 border-green-200';
      case 'agendada':
      case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'confirmada': 'Confirmada',
      'agendada': 'Agendada',
      'pendente': 'Pendente',
      'cancelada': 'Cancelada',
      'realizada': 'Realizada'
    };
    return statusMap[status] || status;
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: 'confirmada' })
        .eq('id', appointmentId);

      if (error) throw error;

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
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Você não tem consultas agendadas</p>
            <Button 
              onClick={() => navigate("/agendamento")}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Agendar primeira consulta
            </Button>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-100 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                {appointment.doctor_profile?.display_name?.split(' ').map(n => n[0]).join('') || 'Dr'}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {appointment.doctor_profile?.display_name || "Médico"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {appointment.tipo_consulta}
                </p>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 my-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{new Date(appointment.data_consulta).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{new Date(appointment.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <Badge className={`${getStatusColor(appointment.status)} border text-xs`}>
                    {getStatusText(appointment.status)}
                  </Badge>
                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {appointment.status === 'agendada' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs flex-1 sm:flex-none border-green-200 hover:bg-green-50"
                        onClick={() => handleConfirmAppointment(appointment.id)}
                      >
                        Confirmar
                      </Button>
                    )}
                    {appointment.tipo_consulta !== 'Online' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs flex-1 sm:flex-none"
                        onClick={() => handleGetDirections(appointment)}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Mapa
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600 flex-1 sm:flex-none"
                      onClick={() => handleViewDetails(appointment)}
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;
