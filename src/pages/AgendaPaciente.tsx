
import { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, ChevronLeft, ChevronRight, Navigation, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const AgendaPaciente = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data para consultas agendadas
  const appointments = [
    {
      id: 1,
      date: "2024-06-18",
      time: "09:00",
      doctor: "Dr. João Silva",
      specialty: "Cardiologia",
      location: "Consultório Central",
      address: "Rua das Flores, 123",
      phone: "(11) 9999-9999",
      status: "confirmado"
    },
    {
      id: 2,
      date: "2024-06-20",
      time: "14:30",
      doctor: "Dra. Maria Santos",
      specialty: "Dermatologia",
      location: "Clínica Saúde",
      address: "Av. Paulista, 456",
      phone: "(11) 8888-8888",
      status: "pendente"
    },
    {
      id: 3,
      date: "2024-06-25",
      time: "10:15",
      doctor: "Dr. Pedro Costa",
      specialty: "Ortopedia",
      location: "Hospital Central",
      address: "Rua da Saúde, 789",
      phone: "(11) 7777-7777",
      status: "confirmado"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800 border-green-200";
      case "pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleReschedule = (appointmentId: number) => {
    toast({
      title: "Reagendamento iniciado",
      description: "Você será redirecionado para escolher uma nova data",
    });
    navigate("/agendamento");
  };

  const handleCancel = (appointmentId: number) => {
    toast({
      title: "Consulta cancelada",
      description: "Sua consulta foi cancelada com sucesso",
      variant: "destructive"
    });
  };

  const handleGetDirections = (appointment: any) => {
    toast({
      title: "Abrindo mapa",
      description: `Direções para ${appointment.location}`,
    });
  };

  const handleContactDoctor = (appointment: any) => {
    toast({
      title: "Contato do médico",
      description: `${appointment.phone} - ${appointment.doctor}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header da página */}
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

        {/* Resumo rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
              <div className="text-sm text-gray-600">Consultas Agendadas</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {appointments.filter(apt => apt.status === 'confirmado').length}
              </div>
              <div className="text-sm text-gray-600">Confirmadas</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {appointments.filter(apt => apt.status === 'pendente').length}
              </div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de consultas */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma consulta agendada
                </h3>
                <p className="text-gray-500 mb-4">
                  Que tal agendar sua primeira consulta?
                </p>
                <Button 
                  onClick={() => navigate("/agendamento")}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Agendar Consulta
                </Button>
              </div>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{appointment.doctor}</h3>
                            <Badge className={`${getStatusColor(appointment.status)} border`}>
                              {appointment.status === 'confirmado' ? 'Confirmada' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{appointment.specialty}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(appointment.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.time}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {appointment.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {appointment.phone}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{appointment.address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGetDirections(appointment)}
                        className="border-blue-200 hover:bg-blue-50"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Mapa
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleContactDoctor(appointment)}
                        className="border-green-200 hover:bg-green-50"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Contato
                      </Button>
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

        {/* Navigation */}
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="icon" className="hover:bg-blue-50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="hover:bg-blue-50">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 sm:hidden"></div>
    </div>
  );
};

export default AgendaPaciente;
