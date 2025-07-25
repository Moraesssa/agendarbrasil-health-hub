
import {
  Calendar,
  Home,
  Users,
  Settings,
  FileText,
  MapPin,
  DollarSign,
  UserCheck,
  Bell,
  Clock,
  Send,
  Pill,
  Award,
  LogOut,
  User
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Menu items for doctors
const doctorMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard-medico",
    icon: Home,
  },
  {
    title: "Agenda",
    url: "/agenda-medico",
    icon: Calendar,
  },
  {
    title: "Pacientes",
    url: "/pacientes-medico",
    icon: Users,
  },
  {
    title: "Encaminhamentos",
    url: "/encaminhamentos-medico",
    icon: Send,
  },
  {
    title: "Medicamentos",
    url: "/gestao-medicamentos",
    icon: Pill,
  },
  {
    title: "Atestados",
    url: "/gerenciar-atestados",
    icon: Award,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
  },
]

// Settings items
const settingsItems = [
  {
    title: "Perfil",
    url: "/perfil-medico",
    icon: User,
  },
  {
    title: "Gerenciar Agenda",
    url: "/gerenciar-agenda",
    icon: Clock,
  },
  {
    title: "Locais de Atendimento",
    url: "/gerenciar-locais",
    icon: MapPin,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.photoURL} />
            <AvatarFallback>
              {userData?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{userData?.displayName || user?.email}</span>
            <span className="text-xs text-muted-foreground">Médico</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {doctorMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button onClick={handleLogout} variant="outline" className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
