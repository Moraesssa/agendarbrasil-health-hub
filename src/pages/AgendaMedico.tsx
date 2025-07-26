
import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, Plus, Filter, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Simplified type for appointments with patient info
type AppointmentWithPatient = Tables<'consultas'> & {
  pacientes: {
    display_name: string | null;
  } | null;
};

const AgendaMedico = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const startDate = new Date(selectedDate);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setUTCHours(23, 59, 59, 999);

      try {
        // Com RLS habilitado, não precisamos mais filtrar por medico_id
        // O Supabase automaticamente retornará apenas as consultas do médico logado
        const { data, error } = await supabase
          .from('consultas')
          .select(`
            *,
            pacientes:profiles!consultas_paciente_id_fkey (display_name)
          `)
          .gte('consultation_date', startDate.toISOString())
          .lte('consultation_date', endDate.toISOString())
          .order('consultation_date', { ascending: true });

        if (error) throw error;
        
        setAppointments(data || []);
      } catch (error) {
        console.error("Erro ao buscar agenda do médico:", error);
        toast({ title: "Erro", description: "Não foi possível carregar a agenda.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, selectedDate, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada": return "bg-green-100 text-green-800 border-green-200";
      case "agendada":
      case "pendente": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelada": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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

  const getPatientAge = (birthDate: string | null) => {
    if (!birthDate) return 'N/A';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${age} anos`;
  }

  const handleContactPatient = (patient: any) => {
    toast({
      title: "Contato do paciente",
      description: `${patient.phone} - ${patient.name}`,
    });
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.pacientes?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="icon"> <Search className="h-4 w-4" /> </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                  <Button onClick={() => navigate("/agendamento")} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Consulta
                  </Button>
                </div>
              </div>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Calendar className="h-5 w-5" />
                    Consultas do Dia - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        Nenhuma consulta encontrada
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? "Tente ajustar sua busca" : "Não há consultas agendadas para esta data"}
                      </p>
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
                                  <h3 className="font-semibold text-gray-900">{appointment.pacientes?.display_name || "Paciente"}</h3>
                                  <Badge className={`${getStatusColor(appointment.status)} border`}>
                                    {getStatusText(appointment.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{appointment.consultation_type}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(appointment.consultation_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Contato disponível
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
                              onClick={()=> handleContactPatient({
                                name: appointment.pacientes?.display_name,
                                phone: "Disponível"
                              })}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Contato
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

