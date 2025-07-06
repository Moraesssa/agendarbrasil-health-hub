
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContextV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Bell, 
  Settings,
  BarChart3,
  Stethoscope,
  Activity
} from "lucide-react";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { ConsultasChart } from "@/components/dashboard/ConsultasChart";
import { TiposConsultaChart } from "@/components/dashboard/TiposConsultaChart";
import { PacientesRecentes } from "@/components/dashboard/PacientesRecentes";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { useToast } from "@/hooks/use-toast";

const DashboardMedico = () => {
  const { userData, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Nova Consulta",
      description: "Agendar nova consulta",
      icon: Calendar,
      href: "/agenda-medico",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Pacientes",
      description: "Gerenciar pacientes",
      icon: Users,
      href: "/pacientes-medico",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Financeiro",
      description: "Relatórios financeiros",
      icon: DollarSign,
      href: "/financeiro",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Configurações",
      description: "Configurar perfil",
      icon: Settings,
      href: "/perfil-medico",
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];

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
                <h1 className="text-2xl font-bold text-gray-800">
                  Dashboard Médico
                </h1>
                <p className="text-gray-600">
                  Bem-vindo, Dr(a). {userData.displayName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {currentTime.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/perfil/notificacoes")}
                className="relative"
              >
                <Bell className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
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
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-auto p-4 flex flex-col items-center gap-3 hover:shadow-md transition-all ${action.color} text-white border-none`}
                    onClick={() => navigate(action.href)}
                  >
                    <action.icon className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-sm opacity-90">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <MetricsCards />

          {/* Charts and Recent Patients */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ConsultasChart />
              <TiposConsultaChart />
            </div>
            <div className="space-y-6">
              <PacientesRecentes />
              <AlertsSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMedico;
