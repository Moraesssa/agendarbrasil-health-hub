
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Users, BarChart3, Settings } from "lucide-react";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ContactInfoCard } from "@/components/profile/ContactInfoCard";
import { StatusCard } from "@/components/profile/StatusCard";
import { StatsCards } from "@/components/profile/StatsCards";
import { PageHeader } from "@/components/profile/PageHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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

  const profileActions = [
    {
      label: "Dashboard",
      icon: BarChart3,
      onClick: () => navigate("/dashboard-medico"),
      variant: 'default' as const,
      className: "bg-blue-500 hover:bg-blue-600"
    },
    {
      label: "Agenda",
      icon: Calendar,
      onClick: () => navigate("/agenda-medico"),
      variant: 'outline' as const,
      className: "border-green-200 hover:bg-green-50"
    },
    {
      label: "Pacientes",
      icon: Users,
      onClick: () => navigate("/pacientes-medico"),
      variant: 'outline' as const,
      className: "border-purple-200 hover:bg-purple-50"
    },
    {
      label: "Configurações",
      icon: Settings,
      onClick: () => navigate("/"),
      variant: 'outline' as const,
      className: "border-gray-200 hover:bg-gray-50"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 bg-gradient-to-br from-blue-50 to-green-50">
          <PageHeader
            title="AgendarBrasil"
            subtitle="Painel do Médico"
            onLogout={handleLogout}
          >
            <EditProfileDialog 
              userData={userData} 
              onProfileUpdate={handleProfileUpdate}
            />
          </PageHeader>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <ProfileHeader
                displayName={userData.displayName}
                userType="medico"
                userId={userData.uid}
              />

              <StatsCards />

              <div className="grid md:grid-cols-2 gap-6">
                <ContactInfoCard userData={userData} />
                <StatusCard userData={userData} />
              </div>

              <ProfileActions 
                actions={profileActions} 
                title="Painel de Controle" 
              />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PerfilMedico;
