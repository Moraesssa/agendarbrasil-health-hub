import { useState, useEffect } from "react";
import { Calendar, Clock, User, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Type for appointments with doctor info from profiles table
type AppointmentWithDoctor = Tables<'consultas'> & {
  doctor_profile: {
    display_name: string | null;
  } | null;
};

const AgendaPaciente = () => {
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
        const { data, error } = await supabase
          .from("consultas")
          .select(`
            *,
            doctor_profile:profiles!consultas_medico_id_fkey (display_name)
          `)
          .order("data_consulta", { ascending: false });

        if (error) throw error;
        
        setAppointments(data || []);
      } catch (error) {
        console.error("Erro ao buscar agenda:", error);
        toast({ title: "Erro", description: "Não foi possível carregar sua agenda.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, toast]);
  
  // **NOVA FUNÇÃO ADICIONADA**
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: 'confirmada' })
        .eq('id', appointmentId);

      if (error) throw error;
      
      // Atualiza o estado local para refletir a mudança imediatamente
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? {...apt, status: 'confirmada'} : apt
      ));
      
      toast({
        title: "Consulta confirmada!",
        description: "Obrigado por confirmar sua presença. O médico foi notificado.",
      });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível confirmar a consulta.", variant: "destructive"});
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
      case 'realizada': return 'bg-green-100 text-green-800 border-green-200';
      case 'agendada':
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleReschedule = (appointmentId: string) => {
    navigate("/agendamento");
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: 'cancelada' })
        .eq('id', appointmentId);

      if (error) throw error;
      
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? {...apt, status: 'cancelada'} : apt));

      toast({
        title: "Consulta cancelada",
        description: "Sua consulta foi cancelada com sucesso",
      });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível cancelar a consulta.", variant: "destructive"});
    }
  };
  
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.data_consulta) >= new Date() && apt.status !== 'cancelada' && apt.status !== 'realizada'
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.data_consulta) < new Date() || apt.status === 'cancelada' || apt.status === 'realizada'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
              Minha Agenda
            </h1>
            <p className="text-gray-600">
              Visualize e gerencie suas consultas agendadas
            </p>
          </div>
          <Button 
            onClick={() => navigate("/agendamento")}
            className="bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all"
          >
            Nova Consulta
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Clock className="h-5 w-5" />
                  Próximas Consultas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhuma consulta futura agendada.</p>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{appointment.doctor_profile?.display_name || "Médico"}</h3>
                                <Badge className={`${getStatusColor(appointment.status)} border`}>
                                  {getStatusText(appointment.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{appointment.tipo_consulta}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(appointment.data_consulta).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(appointment.data_consulta).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{appointment.local_consulta || 'Consulta Online'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* **BOTÃO DE CONFIRMAR ADICIONADO AQUI** */}
                          {appointment.status === 'agendada' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                              onClick={() => handleConfirmAppointment(appointment.id)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Confirmar
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReschedule(appointment.id)}
                            className="border-yellow-200 hover:bg-yellow-50"
                          >
                            Reagendar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calendar className="h-5 w-5" />
                  Histórico de Consultas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pastAppointments.length === 0 ? (
                   <p className="text-center text-gray-500 py-4">Nenhuma consulta anterior encontrada.</p>
                ) : (
                  pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 rounded-lg border border-gray-200 bg-white/50 opacity-80">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{appointment.doctor_profile?.display_name || "Médico"}</h3>
                          <p className="text-sm text-gray-500">{new Date(appointment.data_consulta).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Badge className={`${getStatusColor(appointment.status)} border`}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <div className="h-20 sm:hidden"></div>
    </div>
  );
};

export default AgendaPaciente;