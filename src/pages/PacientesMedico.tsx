import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Users, Search, Calendar, Phone, Mail, MapPin, Clock, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Tipagem para os dados do paciente
interface Paciente {
  id: string;
  display_name: string;
  email: string;
  // Adicione outros campos conforme necessário da sua tabela 'profiles' ou 'pacientes'
}

const PacientesMedico = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  // CORREÇÃO: Busca de dados reais
  useEffect(() => {
    const fetchPacientes = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Exemplo: buscar todos os pacientes que tiveram consulta com o médico logado
        const { data: consultas, error: consultasError } = await supabase
          .from('consultas')
          .select('paciente_id')
          .eq('medico_id', user.id);

        if (consultasError) throw consultasError;

        const pacienteIds = [...new Set(consultas.map(c => c.paciente_id))];

        if (pacienteIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .in('id', pacienteIds);

          if (profilesError) throw profilesError;
          setPacientes(profiles as Paciente[]);
        }
      } catch (error) {
        toast({ title: "Erro ao buscar pacientes", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, [user, toast]);

  const pacientesFiltrados = pacientes.filter(paciente =>
    (paciente.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (paciente.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNovaConsulta = (pacienteId: string, nomePaciente: string | null) => {
    toast({
      title: "Agendar Nova Consulta",
      description: `Preparando agendamento para ${nomePaciente}`,
    });
    // navigate('/caminho-para-agendamento-com-id', { state: { pacienteId } });
  };

  const handleVerHistorico = (pacienteId: string, nomePaciente: string | null) => {
    toast({
      title: "Histórico do Paciente",
      description: `Visualizando histórico de ${nomePaciente}`,
    });
    // navigate(`/historico/${pacienteId}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-blue-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-blue-600 hover:bg-blue-50 transition-colors" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Meus Pacientes
              </h1>
              <p className="text-sm text-gray-600">Gerencie seus pacientes e consultas</p>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6 space-y-6">
              {/* CORREÇÃO: As estatísticas agora devem vir de dados reais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-gray-900">{pacientes.length}</h3>
                    <p className="text-sm text-gray-600">Total de Pacientes</p>
                  </CardContent>
                </Card>
                {/* Outros cards de estatísticas precisariam de suas próprias lógicas de busca */}
              </div>

              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar pacientes por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {pacientesFiltrados.map((paciente) => (
                    <Card key={paciente.id} className="shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">
                                {paciente.display_name?.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{paciente.display_name}</h3>
                              <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleVerHistorico(paciente.id, paciente.display_name)}>Ver Histórico</Button>
                            <Button size="sm" onClick={() => handleNovaConsulta(paciente.id, paciente.display_name)}>Nova Consulta</Button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{paciente.email}</span>
                          </div>
                          {/* Outros dados do paciente seriam exibidos aqui */}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {pacientesFiltrados.length === 0 && (
                    <Card className="shadow-lg">
                      <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum paciente encontrado</h3>
                        <p className="text-gray-600">{searchTerm ? "Tente ajustar os termos de busca" : "Adicione seu primeiro paciente"}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PacientesMedico;