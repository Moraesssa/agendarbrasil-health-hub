import { Calendar, Users, FileText, User, LogOut, Home, Clock, Activity } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextV2";

const patientMenuItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
    description: "Página inicial do portal"
  },
  {
    title: "Dashboard Familiar",
    url: "/dashboard-familiar",
    icon: Activity,
    description: "Visão geral da saúde familiar"
  },
  {
    title: "Agendamento",
    url: "/agendamento",
    icon: Calendar,
    description: "Agendar nova consulta"
  },
  {
    title: "Minha Agenda",
    url: "/agenda-paciente",
    icon: Clock,
    description: "Ver minhas consultas agendadas"
  },
  {
    title: "Histórico",
    url: "/historico",
    icon: FileText,
    description: "Histórico de consultas"
  },
  {
    title: "Gerenciar Família",
    url: "/gerenciar-familia",
    icon: Users,
    description: "Gerenciar membros da família"
  }
];

const settingsItems = [
  {
    title: "Perfil",
    url: "/perfil",
    icon: User,
    description: "Configurações do perfil"
  }
];

export function PatientSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { userData, logout } = useAuth();

  const handleNavigation = (url: string, title: string) => {
    navigate(url);
    toast({
      title: `Navegando para ${title}`,
      description: "Carregando página...",
    });
  };

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

  return (
    <Sidebar className="border-r border-green-100 bg-gradient-to-b from-white to-green-50/30">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative group">
            <img 
              src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
              alt="AgendarBrasil Logo" 
              className="w-14 h-14 object-cover rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-green-200/40" 
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/15 to-blue-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl opacity-15 group-hover:opacity-25 blur-sm transition-all duration-300"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-green-800 to-blue-600 bg-clip-text text-transparent">
              AgendarBrasil
            </h2>
            <p className="text-xs text-gray-600">Portal do Paciente</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-700 font-semibold text-sm mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {patientMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-800 data-[active=true]:font-semibold"
                    title={item.description}
                  >
                    <button 
                      onClick={() => handleNavigation(item.url, item.title)} 
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-700 font-semibold text-sm mb-2">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-800"
                    title={item.description}
                  >
                    <button 
                      onClick={() => handleNavigation(item.url, item.title)} 
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-green-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.photoURL} />
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-sm font-semibold">
              {userData?.displayName?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userData?.displayName || 'Paciente'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              Portal do Paciente
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          title="Sair da conta"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
