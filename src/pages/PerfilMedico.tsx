
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Mail, User, LogOut, Calendar, Users, BarChart3, Settings } from "lucide-react";
import { EditProfileDialog } from "@/components/EditProfileDialog";

const PerfilMedico = () => {
  const { userData, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileUpdate = () => {
    // Force re-render to update displayed data
    setRefreshKey(prev => prev + 1);
    // In a real app, you might want to refetch user data here
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
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
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img 
                  src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                  alt="AgendarBrasil Logo" 
                  className="w-24 h-24 object-cover rounded-2xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl group-hover:shadow-green-200/30 p-1 bg-gradient-to-br from-green-50 to-blue-50" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-sm transition-all duration-500"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">AgendarBrasil</h1>
                <p className="text-sm text-gray-600">Painel do Médico</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <EditProfileDialog 
                userData={userData} 
                onProfileUpdate={handleProfileUpdate}
              />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Perfil Principal */}
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">Dr(a). {userData.displayName}</CardTitle>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Stethoscope className="w-3 h-3 mr-1" />
                  Médico
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  Verificado
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Cards de Estatísticas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">24</h3>
                <p className="text-sm text-gray-600">Consultas este mês</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">156</h3>
                <p className="text-sm text-gray-600">Pacientes ativos</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
                <p className="text-sm text-gray-600">Avaliação média</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">85%</h3>
                <p className="text-sm text-gray-600">Taxa de ocupação</p>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Médico */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-blue-600" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                  <p className="text-gray-900">{userData.displayName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cadastrado em</label>
                  <p className="text-gray-900">
                    {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Último acesso</label>
                  <p className="text-gray-900">
                    {new Date(userData.lastLogin).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  Status Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Especialidades</label>
                  <p className="text-gray-900">{userData.especialidades?.join(', ') || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CRM</label>
                  <p className="text-gray-900">{userData.crm || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Controle */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Painel de Controle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate("/dashboard-medico")}
                  className="bg-blue-500 hover:bg-blue-600 h-auto py-4 flex-col gap-2"
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  onClick={() => navigate("/agenda-medico")}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-green-200 hover:bg-green-50"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Agenda</span>
                </Button>
                <Button
                  onClick={() => navigate("/pacientes-medico")}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-purple-200 hover:bg-purple-50"
                >
                  <Users className="w-6 h-6" />
                  <span>Pacientes</span>
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Settings className="w-6 h-6" />
                  <span>Configurações</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerfilMedico;
