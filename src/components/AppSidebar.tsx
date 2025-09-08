import { Calendar, Users, Clock, FileText, Settings, User, BarChart3, LogOut, ArrowRightLeft, MapPin, DollarSign } from "lucide-react";
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
import { handleLogout as utilHandleLogout } from "@/utils/authUtils";

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
    description: "Visualizar consultas e horários"
  },
  {
    title: "Pacientes",
    url: "/pacientes-medico",
    icon: Users,
    description: "Lista de pacientes do médico"
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    description: "Relatórios financeiros e receitas"
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

// Array de configurações atualizado
const settingsItems = [
  {
    title: "Perfil",
    url: "/perfil-medico",
    icon: User,
    description: "Configurações do perfil médico"
  },
  {
    title: "Meus Locais", // <-- NOVO ITEM
    url: "/gerenciar-locais",
    icon: MapPin,
    description: "Gerenciar seus locais de atendimento"
  },
  {
    title: "Meus Horários",
    url: "/gerenciar-agenda",
    icon: Clock,
    description: "Gerenciar dias e horários de atendimento"
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
  const { userData, logout } = useAuth();

  const handleNavigation = (url: string, title: string) => {
    if (url === "/settings") {
      toast({
        title: "Configurações",
        description: "Página em desenvolvimento.",
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
      await utilHandleLogout(navigate, logout);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
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
          <div className="relative group">
            <img 
              src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
              alt="AgendarBrasil Logo" 
              className="w-14 h-14 object-cover rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-blue-200/40" 
            />
          </div>
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
