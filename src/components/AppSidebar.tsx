import { Calendar, Home, Users, Clock, FileText, Settings, User, Activity, BarChart3, Stethoscope, LogOut, ArrowRightLeft } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard-medico",
    icon: BarChart3,
    description: "Visão geral da prática médica"
  },
  {
    title: "Agenda",
    url: "/agenda-medico",
    icon: Calendar,
    description: "Gerenciar consultas e horários"
  },
  {
    title: "Pacientes",
    url: "/pacientes-medico",
    icon: Users,
    description: "Lista de pacientes do médico"
  },
  {
    title: "Encaminhamento",
    url: "/encaminhamentos-medico",
    icon: ArrowRightLeft,
    description: "Encaminhamentos entre médicos"
  },
  {
    title: "Histórico",
    url: "/historico",
    icon: FileText,
    description: "Histórico de atendimentos"
  }
];

const settingsItems = [
  {
    title: "Perfil",
    url: "/perfil-medico",
    icon: User,
    description: "Configurações do perfil médico"
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    description: "Configurações do sistema"
  }
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logout, userData } = useAuth();

  const handleNavigation = (url: string, title: string) => {
    if (url === "/settings") {
      toast({
        title: "Configurações",
        description: "Página em desenvolvimento. Em breve você poderá configurar suas preferências.",
      });
      return;
    }
    
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
    <Sidebar className="border-r border-blue-100 bg-gradient-to-b from-white to-blue-50/30">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src="/android-icon-96x96.png" alt="AgendarBrasil Logo" className="w-10 h-10" />
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-800 to-green-600 bg-clip-text text-transparent">
              AgendarBrasil
            </h2>
            <p className="text-xs text-gray-600">Portal Médico</p>
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
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-800 data-[active=true]:font-semibold"
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
                    className="hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-800"
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

      <SidebarFooter className="p-4 border-t border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.photoURL} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-sm font-semibold">
              Dr
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Dr(a). {userData?.displayName || 'Médico'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userData?.especialidades?.[0] || 'Especialista'}
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