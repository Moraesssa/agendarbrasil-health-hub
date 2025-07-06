
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  MapPin,
  User,
  Filter,
  Download,
  UserPlus,
  FileText
} from "lucide-react";
import { NovoPacienteModal } from "@/components/NovoPacienteModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientData {
  id: string;
  display_name: string;
  email: string;
  last_appointment?: string;
  total_appointments: number;
  status: 'ativo' | 'inativo';
  phone?: string;
  city?: string;
}

const PacientesMedico = () => {
  const { userData, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      navigate("/login");
      return;
    }

    if (userData.userType !== 'medico') {
      navigate("/login");
      return;
    }

    if (!userData.onboardingCompleted) {
      navigate("/onboarding");
      return;
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Buscar consultas do médico com informações dos pacientes
      const { data: consultasData, error } = await supabase
        .from('consultas')
        .select(`
          paciente_id,
          data_consulta,
          status,
          profiles!consultas_paciente_id_fkey (
            id,
            display_name,
            email
          )
        `)
        .eq('medico_id', user.id)
        .order('data_consulta', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        return;
      }

      // Processar dados para obter estatísticas por paciente
      const patientMap = new Map<string, PatientData>();
      
      consultasData?.forEach((consulta) => {
        const patientId = consulta.paciente_id;
        const profile = consulta.profiles;
        
        if (!profile) return;

        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            id: patientId,
            display_name: profile.display_name || 'Paciente',
            email: profile.email || '',
            total_appointments: 0,
            status: 'ativo' as const
          });
        }

        const patient = patientMap.get(patientId)!;
        patient.total_appointments++;
        
        // Última consulta
        if (!patient.last_appointment || new Date(consulta.data_consulta) > new Date(patient.last_appointment)) {
          patient.last_appointment = consulta.data_consulta;
        }
      });

      setPatients(Array.from(patientMap.values()));
      
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar a lista de pacientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredPatients = patients.filter(patient =>
    patient.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                alt="AgendarBrasil Logo" 
                className="w-12 h-12 object-cover rounded-lg shadow-md" 
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Meus Pacientes
                </h1>
                <p className="text-gray-600">
                  Gerencie seus pacientes e consultas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard-medico")}
              >
                Voltar ao Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filters and Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Buscar Pacientes
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowNewPatientModal(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Paciente
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total de Pacientes</p>
                    <p className="text-3xl font-bold">{patients.length}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Pacientes Ativos</p>
                    <p className="text-3xl font-bold">
                      {patients.filter(p => p.status === 'ativo').length}
                    </p>
                  </div>
                  <User className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Consultas Total</p>
                    <p className="text-3xl font-bold">
                      {patients.reduce((acc, p) => acc + p.total_appointments, 0)}
                    </p>
                  </div>
                  <Calendar className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patients List */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Lista de Pacientes ({filteredPatients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'Tente ajustar os termos de busca' 
                      : 'Comece adicionando seu primeiro paciente'
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setShowNewPatientModal(true)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Paciente
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                          {patient.display_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{patient.display_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </div>
                            {patient.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {patient.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-800">{patient.total_appointments}</p>
                          <p className="text-xs text-gray-500">Consultas</p>
                        </div>
                        
                        {patient.last_appointment && (
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-800">
                              {new Date(patient.last_appointment).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-500">Última consulta</p>
                          </div>
                        )}
                        
                        <Badge 
                          variant={patient.status === 'ativo' ? 'default' : 'secondary'}
                          className={patient.status === 'ativo' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {patient.status}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Patient Modal */}
      <NovoPacienteModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onPatientAdded={fetchPatients}
      />
    </div>
  );
};

export default PacientesMedico;
