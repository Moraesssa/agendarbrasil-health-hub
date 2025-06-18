
import { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const AgendaMedico = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data para consultas do médico
  const appointments = [
    {
      id: 1,
      date: "2024-06-18",
      time: "09:00",
      patient: "Maria Silva",
      age: 45,
      phone: "(11) 9999-9999",
      type: "Consulta",
      status: "confirmado",
      notes: "Retorno cardiologia"
    },
    {
      id: 2,
      date: "2024-06-18",
      time: "10:30",
      patient: "João Santos",
      age: 32,
      phone: "(11) 8888-8888",
      type: "Primeira consulta",
      status: "pendente",
      notes: "Paciente novo"
    },
    {
      id: 3,
      date: "2024-06-18",
      time: "14:00",
      patient: "Ana Costa",
      age: 28,
      phone: "(11) 7777-7777",
      type: "Exame",
      status: "confirmado",
      notes: "Exame de rotina"
    },
    {
      id: 4,
      date: "2024-06-18",
      time: "15:30",
      patient: "Pedro Lima",
      age: 55,
      phone: "(11) 6666-6666",
      type: "Retorno",
      status: "confirmado",
      notes: "Acompanhamento pós-cirúrgico"
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmado": return "Confirmada";
      case "pendente": return "Pendente";
      case "cancelado": return "Cancelada";
      default: return status;
    }
  };

  const handleContactPatient = (patient: any) => {
    toast({
      title: "Contato do paciente",
      description: `${patient.phone} - ${patient.patient}`,
    });
  };

  const handleStartConsultation = (patient: any) => {
    toast({
      title: "Iniciando consulta",
      description: `Consulta com ${patient.patient} iniciada`,
    });
  };

  const handleReschedule = (appointmentId: number) => {
    toast({
      title: "Reagendamento",
      description: "Funcionalidade de reagendamento será implementada em breve",
    });
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50 transition-colors" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Agenda Médica
              </h1>
              <p className="text-sm text-gray-600">Gerencie suas consultas e horários</p>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container max-w-6xl mx-auto p-6 space-y-6">
              {/* Controles superiores */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                  <Button 
                    onClick={() => navigate("/agendamento")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Consulta
                  </Button>
                </div>
              </div>

              {/* Resumo do dia */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                    <div className="text-sm text-gray-600">Total de Consultas</div>
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
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">08:00</div>
                    <div className="text-sm text-gray-600">Próxima Consulta</div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de consultas */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Calendar className="h-5 w-5" />
                    Consultas do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        Nenhuma consulta encontrada
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? "Tente ajustar sua busca" : "Não há consultas agendadas para hoje"}
                      </p>
                      <Button 
                        onClick={() => navigate("/agendamento")}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Agendar Nova Consulta
                      </Button>
                    </div>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{appointment.patient}</h3>
                                  <span className="text-sm text-gray-500">({appointment.age} anos)</span>
                                  <Badge className={`${getStatusColor(appointment.status)} border`}>
                                    {getStatusText(appointment.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{appointment.type}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {appointment.time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {appointment.phone}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{appointment.notes}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleContactPatient(appointment)}
                              className="border-blue-200 hover:bg-blue-50"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Contato
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleStartConsultation(appointment)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Iniciar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReschedule(appointment.id)}
                              className="border-yellow-200 hover:bg-yellow-50"
                            >
                              Reagendar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AgendaMedico;
