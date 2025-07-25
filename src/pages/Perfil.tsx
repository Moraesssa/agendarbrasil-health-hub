
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, FileText, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ContactInfoCard } from "@/components/profile/ContactInfoCard";
import { StatusCard } from "@/components/profile/StatusCard";
import { PageHeader } from "@/components/profile/PageHeader";

const Perfil = () => {
  const { userData, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>("");

  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      navigate("/login");
      return;
    }

    if (userData.userType !== 'paciente') {
      navigate("/login");
      return;
    }

    if (!userData.onboardingCompleted) {
      navigate("/onboarding");
      return;
    }

    // Inicializar a foto de perfil atual usando photoURL
    setCurrentPhotoUrl(userData.photoURL || "");
  }, [user, userData, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePhotoUpdate = (newPhotoUrl: string) => {
    setCurrentPhotoUrl(newPhotoUrl);
  };

  const handleScheduleAppointment = () => {
    toast({
      title: "Redirecionando para agendamento",
      description: "Vamos ajudá-lo a encontrar o médico ideal!",
    });
    navigate("/agendamento");
  };

  const handleViewSchedule = () => {
    toast({
      title: "Acessando sua agenda",
      description: "Visualize suas consultas agendadas",
    });
    navigate("/agenda-paciente");
  };

  const handleViewHistory = () => {
    toast({
      title: "Carregando histórico",
      description: "Visualize seu histórico completo de consultas",
    });
    navigate("/historico");
  };

  const handleGoHome = () => {
    navigate("/");
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
      label: "Agendar Consulta",
      icon: Calendar,
      onClick: handleScheduleAppointment,
      variant: 'default' as const,
      className: "bg-blue-500 hover:bg-blue-600"
    },
    {
      label: "Minha Agenda",
      icon: Calendar,
      onClick: handleViewSchedule,
      variant: 'outline' as const,
      className: "border-blue-200 hover:bg-blue-50"
    },
    {
      label: "Histórico",
      icon: FileText,
      onClick: handleViewHistory,
      variant: 'outline' as const,
      className: "border-green-200 hover:bg-green-50"
    },
    {
      label: "Página Inicial",
      icon: Heart,
      onClick: handleGoHome,
      variant: 'outline' as const,
      className: "border-gray-200 hover:bg-gray-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <PageHeader
        title="AgendarBrasil"
        subtitle="Perfil do Paciente"
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <ProfileHeader
            displayName={userData.displayName}
            userType="paciente"
            currentPhotoUrl={currentPhotoUrl}
            userId={userData.uid}
            onPhotoUpdate={handlePhotoUpdate}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <ContactInfoCard userData={userData} />
            <StatusCard userData={userData} />
          </div>

          <ProfileActions actions={profileActions} />
        </div>
      </div>
    </div>
  );
};

export default Perfil;
