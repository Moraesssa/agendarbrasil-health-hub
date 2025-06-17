import { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, ChevronLeft, ChevronRight, Plus, Edit, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const AgendaMedico = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock data para consultas do médico - expandido para demonstrar paginação
  const appointments = [
    {
      id: 1,
      date: "2024-06-18",
      time: "09:00",
      patient: "Maria Silva",
      phone: "(11) 99999-9999",
      type: "Consulta de rotina",
      status: "confirmado",
      notes: "Paciente com histórico de hipertensão"
    },
    {
      id: 2,
      date: "2024-06-18",
      time: "10:30",
      patient: "João Santos",
      phone: "(11) 88888-8888",
      type: "Retorno",
      status: "confirmado",
      notes: "Acompanhamento pós-cirúrgico"
    },
    {
      id: 3,
      date: "2024-06-18",
      time: "14:00",
      patient: "Ana Costa",
      phone: "(11) 77777-7777",
      type: "Primeira consulta",
      status: "pendente",
      notes: "Encaminhamento por cardiologista"
    },
    {
      id: 4,
      date: "2024-06-19",
      time: "08:30",
      patient: "Pedro Oliveira",
      phone: "(11) 66666-6666",
      type: "Exames",
      status: "confirmado",
      notes: "Revisão de exames laboratoriais"
    },
    {
      id: 5,
      date: "2024-06-19",
      time: "16:00",
      patient: "Lucia Ferreira",
      phone: "(11) 55555-5555",
      type: "Consulta de rotina",
      status: "reagendado",
      notes: "Paciente solicitou reagendamento"
    },
    {
      id: 6,
      date: "2024-06-20",
      time: "09:30",
      patient: "Carlos Mendes",
      phone: "(11) 44444-4444",
      type: "Consulta de rotina",
      status: "confirmado",
      notes: "Paciente diabético - controle glicêmico"
    },
    {
      id: 7,
      date: "2024-06-20",
      time: "11:00",
      patient: "Fernanda Lima",
      phone: "(11) 33333-3333",
      type: "Retorno",
      status: "confirmado",
      notes: "Avaliação pós-tratamento"
    },
    {
      id: 8,
      date: "2024-06-21",
      time: "14:30",
      patient: "Roberto Silva",
      phone: "(11) 22222-2222",
      type: "Primeira consulta",
      status: "pendente",
      notes: "Paciente com dores nas costas"
    },
    {
      id: 9,
      date: "2024-06-21",
      time: "15:30",
      patient: "Mariana Santos",
      phone: "(11) 11111-1111",
      type: "Exames",
      status: "confirmado",
      notes: "Resultado de exames de sangue"
    },
    {
      id: 10,
      date: "2024-06-22",
      time: "10:00",
      patient: "Eduardo Costa",
      phone: "(11) 99999-0000",
      type: "Consulta de rotina",
      status: "cancelado",
      notes: "Paciente cancelou por motivos pessoais"
    },
    {
      id: 11,
      date: "2024-06-22",
      time: "16:30",
      patient: "Patricia Oliveira",
      phone: "(11) 88888-0000",
      type: "Retorno",
      status: "confirmado",
      notes: "Acompanhamento de tratamento"
    },
    {
      id: 12,
      date: "2024-06-23",
      time: "08:00",
      patient: "Miguel Ferreira",
      phone: "(11) 77777-0000",
      type: "Primeira consulta",
      status: "pendente",
      notes: "Encaminhamento por clínico geral"
    }
  ];

  // Cálculos de paginação
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = appointments.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800 border-green-200";
      case "pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reagendado":
        return "bg-blue-100 text-blue-800 border-blue-200";
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

  const todayAppointments = appointments.filter(app => 
    app.date === new Date().toISOString().split('T')[0]
  );

  const upcomingAppointments = appointments.filter(app => 
    new Date(app.date) > new Date()
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-green-100/50 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      Agenda Médica
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Gerencie suas consultas e horários de atendimento
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"}
                    onClick={() => setViewMode("list")}
                    size="sm"
                    className={viewMode === "list" ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : ""}
                  >
                    Lista
                  </Button>
                  <Button 
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    onClick={() => setViewMode("calendar")}
                    size="sm"
                    className={viewMode === "calendar" ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" : ""}
                  >
                    Calendário
                  </Button>
                </div>
                <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Horário
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-700 mb-1">{todayAppointments.length}</div>
                  <div className="text-sm font-medium text-green-600">Consultas Hoje</div>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700 mb-1">{upcomingAppointments.length}</div>
                  <div className="text-sm font-medium text-blue-600">Próximas</div>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-700 mb-1">
                    {appointments.filter(a => a.status === "pendente").length}
                  </div>
                  <div className="text-sm font-medium text-yellow-600">Pendentes</div>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-700 mb-1">
                    {appointments.filter(a => a.status === "cancelado").length}
                  </div>
                  <div className="text-sm font-medium text-red-600">Canceladas</div>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Today's Appointments */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-1">
            <CardHeader className="bg-white rounded-t-lg pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span>Consultas de Hoje ({todayAppointments.length})</span>
              </CardTitle>
            </CardHeader>
          </div>
          <CardContent className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">Nenhuma consulta agendada para hoje</p>
                <p className="text-gray-400 text-sm mt-2">Aproveite para organizar sua agenda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="group p-5 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:shadow-lg transition-all duration-300 hover:border-green-300">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{appointment.patient}</h3>
                            <Badge className={`${getStatusColor(appointment.status)} border font-medium`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{appointment.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-600" />
                              <span>{appointment.phone}</span>
                            </div>
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                              {appointment.type}
                            </span>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300 transition-colors">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300 transition-colors">
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced All Appointments Table */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-1">
            <CardHeader className="bg-white rounded-t-lg pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-3 text-gray-900">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span>Todas as Consultas</span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    {appointments.length} consultas no total
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
                    <TableHead className="font-bold text-gray-700 h-14">Data</TableHead>
                    <TableHead className="font-bold text-gray-700">Horário</TableHead>
                    <TableHead className="font-bold text-gray-700">Paciente</TableHead>
                    <TableHead className="font-bold text-gray-700">Tipo</TableHead>
                    <TableHead className="font-bold text-gray-700">Status</TableHead>
                    <TableHead className="font-bold text-gray-700">Telefone</TableHead>
                    <TableHead className="font-bold text-gray-700 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAppointments.map((appointment, index) => (
                    <TableRow key={appointment.id} className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <TableCell className="font-semibold text-gray-900 py-4">
                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full w-fit">
                          <Clock className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-700">{appointment.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 py-4">{appointment.patient}</TableCell>
                      <TableCell className="py-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {appointment.type}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`${getStatusColor(appointment.status)} border font-medium`}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 py-4 font-medium">{appointment.phone}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
                <div className="text-sm text-gray-600 font-medium">
                  Mostrando <span className="font-bold text-gray-900">{startIndex + 1}</span> a <span className="font-bold text-gray-900">{Math.min(endIndex, appointments.length)}</span> de <span className="font-bold text-gray-900">{appointments.length}</span> consultas
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-green-50"} transition-colors`}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className={`cursor-pointer transition-colors ${currentPage === page ? 'bg-green-600 text-white hover:bg-green-700' : 'hover:bg-green-50'}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-green-50"} transition-colors`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-24 sm:hidden"></div>
      </main>
    </div>
  );
};

export default AgendaMedico;
