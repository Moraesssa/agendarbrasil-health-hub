
import { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, ChevronLeft, ChevronRight, Plus, Edit } from "lucide-react";
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
        return "bg-green-100 text-green-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      case "reagendado":
        return "bg-blue-100 text-blue-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Header da página */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">
              Agenda Médica
            </h1>
            <p className="text-gray-600">
              Gerencie suas consultas e horários de atendimento
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Lista
            </Button>
            <Button 
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              size="sm"
            >
              Calendário
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Horário
            </Button>
          </div>
        </div>

        {/* Resumo rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{todayAppointments.length}</div>
              <div className="text-sm text-gray-600">Hoje</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</div>
              <div className="text-sm text-gray-600">Próximas</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {appointments.filter(a => a.status === "pendente").length}
              </div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {appointments.filter(a => a.status === "cancelado").length}
              </div>
              <div className="text-sm text-gray-600">Canceladas</div>
            </CardContent>
          </Card>
        </div>

        {/* Consultas de hoje */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Calendar className="h-5 w-5" />
              Consultas de Hoje ({todayAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma consulta agendada para hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200 hover:border-green-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{appointment.patient}</h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {appointment.phone}
                            </div>
                            <span>{appointment.type}</span>
                          </div>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="hover:bg-green-50">
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-blue-50">
                          <Phone className="h-3 w-3 mr-1" />
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

        {/* Todas as consultas em formato de tabela com paginação */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-green-900">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Todas as Consultas
              </div>
              <div className="text-sm font-normal text-gray-600">
                {appointments.length} consultas no total
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Horário</TableHead>
                    <TableHead className="font-semibold">Paciente</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="hover:bg-green-50/50">
                      <TableCell className="font-medium">
                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          {appointment.time}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{appointment.patient}</TableCell>
                      <TableCell>
                        <span className="text-sm">{appointment.type}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{appointment.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button variant="outline" size="sm" className="hover:bg-green-50">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50">
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-gray-50/50">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, appointments.length)} de {appointments.length} consultas
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-20 sm:hidden"></div>
      </main>
    </div>
  );
};

export default AgendaMedico;
