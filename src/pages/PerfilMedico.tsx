import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  LogOut,
  Star,
  Users,
  Activity,
  Video,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { handleLogout as utilHandleLogout } from "@/utils/authUtils";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Button } from "@/components/ui/button";
import { DoctorHero } from "@/components/doctor/profile/DoctorHero";
import { DoctorStatsGrid } from "@/components/doctor/profile/DoctorStatsGrid";
import { UpcomingAppointmentsList } from "@/components/doctor/profile/UpcomingAppointmentsList";
import { NotificationsPanel } from "@/components/doctor/profile/NotificationsPanel";
import { DoctorProfileTabs } from "@/components/doctor/profile/DoctorProfileTabs";
import { DoctorCalendar } from "@/components/doctor/profile/DoctorCalendar";
import { DoctorQuickLinks } from "@/components/doctor/profile/DoctorQuickLinks";
import { SupportCard } from "@/components/doctor/profile/SupportCard";
import {
  DoctorAppointment,
  DoctorNotification,
  DoctorQuickLink,
  DoctorStat,
  DoctorStatusBadge,
} from "@/components/doctor/profile/types";

const PerfilMedico = () => {
  const { userData, user, loading, logout, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      navigate("/login");
      return;
    }

    if (userData.userType !== "medico") {
      navigate("/login");
      return;
    }

    if (!userData.onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [user, userData, loading, navigate]);

  const handleLogout = useCallback(
    () => utilHandleLogout(navigate, logout),
    [navigate, logout]
  );

  const handleProfileUpdate = async () => {
    await refreshUserData();
  };

  const isLoading = loading || !userData;

  const statusBadges: DoctorStatusBadge[] = useMemo(() => {
    if (!userData) {
      return [];
    }

    return [
      {
        label: userData.isActive ? "Conta ativa" : "Conta inativa",
        variant: userData.isActive ? "default" : "destructive",
      },
      {
        label: userData.onboardingCompleted ? "Onboarding concluído" : "Onboarding pendente",
        variant: userData.onboardingCompleted ? "secondary" : "outline",
      },
      {
        label: userData.crm ? `CRM ${userData.crm}` : "CRM não informado",
        variant: userData.crm ? "secondary" : "outline",
      },
    ];
  }, [userData]);

  const stats: DoctorStat[] = useMemo(() => {
    if (!userData) {
      return [];
    }

    const isActive = userData.isActive;
    const specialtiesCount = userData.especialidades?.length ?? 0;

    return [
      {
        label: "Atendimentos hoje",
        value: isActive ? "4" : "0",
        description: isActive
          ? "Consultas confirmadas para o dia"
          : "Ative sua agenda para receber pacientes",
        icon: CalendarCheck,
        trend: isActive
          ? {
              value: "+1 consulta",
              isPositive: true,
              label: "vs. ontem",
            }
          : undefined,
      },
      {
        label: "Pacientes ativos",
        value: isActive ? "28" : "0",
        description: isActive
          ? "Pacientes acompanhados nos últimos 30 dias"
          : "Nenhum paciente em acompanhamento",
        icon: Users,
        trend: isActive
          ? {
              value: "+12%",
              isPositive: true,
              label: "mês anterior",
            }
          : undefined,
      },
      {
        label: "Avaliação média",
        value: isActive ? "4,8" : "—",
        description: "Baseada no feedback dos pacientes",
        icon: Star,
        trend: isActive
          ? {
              value: "98% satisfação",
              isPositive: true,
            }
          : undefined,
      },
      {
        label: "Especialidades",
        value: `${specialtiesCount}`,
        description: specialtiesCount
          ? "Especialidades cadastradas"
          : "Cadastre suas especialidades",
        icon: Activity,
      },
    ];
  }, [userData]);

  const upcomingAppointments: DoctorAppointment[] = useMemo(() => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30);
    const second = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const third = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30);

    return [
      {
        id: "appointment-1",
        patientName: "João Pereira",
        type: "Retorno pós-operatório",
        status: "confirmada",
        start: first,
        location: "Clínica Central - Sala 3",
      },
      {
        id: "appointment-2",
        patientName: "Ana Souza",
        type: "Avaliação cardiológica",
        status: "pendente",
        start: second,
        location: "Teleconsulta",
        notes: "Paciente aguardando confirmação de exames",
      },
      {
        id: "appointment-3",
        patientName: "Marcos Lima",
        type: "Consulta de rotina",
        status: "confirmada",
        start: third,
        location: "Clínica Central - Sala 1",
      },
    ];
  }, []);

  const notifications: DoctorNotification[] = useMemo(() => {
    if (!userData) {
      return [];
    }

    const items: DoctorNotification[] = [
      userData.crm
        ? {
            id: "crm-status",
            title: "CRM verificado",
            description: "Seu número de CRM está atualizado e validado na plataforma.",
            time: "Atualizado recentemente",
            type: "success",
          }
        : {
            id: "crm-pending",
            title: "Informe seu CRM",
            description: "Adicione seu CRM para liberar todos os recursos da plataforma.",
            time: "Requer atenção",
            type: "warning",
          },
      {
        id: "agenda-review",
        title: "Revise a agenda do dia",
        description: "Confirme as consultas e verifique se há pedidos de reagendamento.",
        time: "Hoje às 07h30",
        type: "info",
      },
      userData.preferences?.notifications
        ? {
            id: "notifications-enabled",
            title: "Notificações ativadas",
            description: "Você receberá alertas de novos agendamentos em tempo real.",
            time: "Configurado",
            type: "success",
          }
        : {
            id: "notifications-disabled",
            title: "Ative as notificações",
            description: "Ative os avisos para não perder solicitações de pacientes.",
            time: "Sugestão",
            type: "warning",
          },
    ];

    return items;
  }, [userData]);

  const quickLinks: DoctorQuickLink[] = useMemo(() => {
    return [
      {
        id: "agenda",
        label: "Gerenciar agenda",
        description: "Atualize horários disponíveis e bloqueios",
        icon: CalendarDays,
        onClick: () => navigate("/agenda-medico"),
      },
      {
        id: "dashboard",
        label: "Ver painel completo",
        description: "Acompanhe métricas de desempenho",
        icon: BarChart3,
        onClick: () => navigate("/dashboard-medico"),
      },
      {
        id: "pacientes",
        label: "Pacientes",
        description: "Acesse históricos e anotações",
        icon: Users,
        onClick: () => navigate("/pacientes-medico"),
      },
      {
        id: "telemed",
        label: "Teleconsulta",
        description: "Inicie atendimentos por vídeo",
        icon: Video,
        onClick: () => navigate("/telemedicina"),
      },
      {
        id: "logout",
        label: "Encerrar sessão",
        description: "Saia com segurança da plataforma",
        icon: LogOut,
        onClick: handleLogout,
      },
    ];
  }, [navigate, handleLogout]);

  if (!isLoading && (!user || !userData || userData.userType !== "medico")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <header className="border-b border-blue-100/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <a href="#overview" className="flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 text-sm font-semibold text-white shadow-lg">
              AB
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-blue-700">AgendarBrasil</p>
              <p className="text-xs text-muted-foreground">Painel do médico</p>
            </div>
          </a>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#overview" className="transition-colors hover:text-blue-600">
              Visão geral
            </a>
            <a href="#consultas" className="transition-colors hover:text-blue-600">
              Consultas
            </a>
            <a href="#informacoes" className="transition-colors hover:text-blue-600">
              Informações
            </a>
            <a href="#calendario" className="transition-colors hover:text-blue-600">
              Calendário
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
        <section id="overview" className="space-y-6">
          <DoctorHero
            name={userData?.displayName}
            email={userData?.email}
            crm={userData?.crm}
            specialties={userData?.especialidades}
            avatarUrl={userData?.photoURL}
            statusBadges={statusBadges}
            loading={isLoading}
            primaryAction={{
              label: "Abrir agenda",
              onClick: () => navigate("/agenda-medico"),
              icon: CalendarDays,
            }}
            secondaryAction={{
              label: "Ver dashboard",
              onClick: () => navigate("/dashboard-medico"),
              icon: BarChart3,
              variant: "outline",
            }}
            editProfileAction={
              userData ? (
                <EditProfileDialog
                  userData={userData}
                  onProfileUpdate={handleProfileUpdate}
                />
              ) : undefined
            }
          />

          <DoctorStatsGrid stats={stats} loading={isLoading} />
        </section>

        <section id="consultas" className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <UpcomingAppointmentsList
              appointments={upcomingAppointments}
              loading={isLoading}
              onViewAll={() => navigate("/agenda-medico")}
            />
          </div>
          <div className="space-y-6">
            <NotificationsPanel notifications={notifications} loading={isLoading} />
          </div>
        </section>

        <section>
          <DoctorProfileTabs doctor={userData ?? null} loading={isLoading} />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DoctorCalendar
              appointments={upcomingAppointments}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              loading={isLoading}
            />
          </div>
          <div className="space-y-6">
            <DoctorQuickLinks links={quickLinks} loading={isLoading} />
            <SupportCard loading={isLoading} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default PerfilMedico;
