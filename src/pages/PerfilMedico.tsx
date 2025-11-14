import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
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
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { handleLogout as utilHandleLogout } from "@/utils/authUtils";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DoctorHero } from "@/components/doctor/profile/DoctorHero";
import { DoctorStatsGrid } from "@/components/doctor/profile/DoctorStatsGrid";
import { UpcomingAppointmentsList } from "@/components/doctor/profile/UpcomingAppointmentsList";
import { NotificationsPanel } from "@/components/doctor/profile/NotificationsPanel";
import { DoctorProfileTabs } from "@/components/doctor/profile/DoctorProfileTabs";
import { DoctorQuickLinks } from "@/components/doctor/profile/DoctorQuickLinks";
import { SupportCard } from "@/components/doctor/profile/SupportCard";
import { useDoctorProfileData } from "@/hooks/useDoctorProfileData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DoctorQuickLink,
  DoctorStat,
  DoctorStatusBadge,
} from "@/components/doctor/profile/types";

// Lazy load do calendário para melhor performance inicial
const DoctorCalendar = lazy(() => import("@/components/doctor/profile/DoctorCalendar").then(m => ({ default: m.DoctorCalendar })));

const PerfilMedico = () => {
  const { userData, user, loading, logout, refreshUserData } = useAuth();
  const {
    metrics: doctorMetrics,
    upcomingAppointments,
    calendarAppointments,
    notifications: profileNotifications,
    loading: dataLoading,
    error: dataError,
    refetch: refetchProfileData,
  } = useDoctorProfileData(userData?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasInitializedDate = useRef(false);

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
    await refetchProfileData();
  };

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchProfileData();
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchProfileData, toast]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      refetchProfileData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetchProfileData]);

  const isAuthLoading = loading || !userData;
  const isProfileLoading = isAuthLoading || dataLoading;

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
      {
        label: userData.verificacao?.aprovado
          ? "Perfil verificado"
          : userData.verificacao?.documentosEnviados
            ? "Verificação em análise"
            : "Verificação pendente",
        variant: userData.verificacao?.aprovado ? "secondary" : "outline",
      },
    ];
  }, [userData]);

  const stats: DoctorStat[] = useMemo(() => {
    if (!userData || !doctorMetrics) {
      return [];
    }

    const todaysConsultations = doctorMetrics.todaysConsultations ?? 0;
    const upcomingCount = doctorMetrics.upcomingConsultations ?? 0;
    const uniquePatients = doctorMetrics.uniquePatients ?? 0;
    const totalConsultations = doctorMetrics.totalConsultations ?? 0;
    const satisfactionRate = Number.isFinite(doctorMetrics.satisfactionRate)
      ? doctorMetrics.satisfactionRate
      : 0;
    const occupancyRate = Number.isFinite(doctorMetrics.occupancyRate)
      ? doctorMetrics.occupancyRate
      : 0;

    return [
      {
        label: "Atendimentos hoje",
        value: String(todaysConsultations),
        description: todaysConsultations
          ? "Consultas confirmadas para o dia"
          : "Sem atendimentos confirmados hoje",
        icon: CalendarCheck,
        trend: upcomingCount
          ? {
              value: `${upcomingCount} próximas`,
              isPositive: true,
              label: "próximos 7 dias",
            }
          : undefined,
      },
      {
        label: "Pacientes ativos",
        value: String(uniquePatients),
        description: uniquePatients
          ? "Pacientes únicos acompanhados nos últimos 30 dias"
          : "Nenhum paciente atendido no período",
        icon: Users,
        trend: uniquePatients
          ? {
              value: `${totalConsultations} consultas`,
              isPositive: true,
              label: "30 dias",
            }
          : undefined,
      },
      {
        label: "Índice de satisfação",
        value: `${satisfactionRate}%`,
        description: "Estimativa com base nos atendimentos recentes",
        icon: Star,
        trend: {
          value: satisfactionRate >= 85 ? "Excelente" : "Ajuste necessário",
          isPositive: satisfactionRate >= 85,
        },
      },
      {
        label: "Taxa de ocupação",
        value: `${occupancyRate}%`,
        description: "Ocupação da agenda para os próximos 7 dias",
        icon: Activity,
        trend: upcomingCount
          ? {
              value: `${upcomingCount} consultas agendadas`,
              isPositive: occupancyRate >= 70,
              label: "próximos 7 dias",
            }
          : undefined,
      },
    ];
  }, [doctorMetrics, userData]);

  useEffect(() => {
    if (hasInitializedDate.current) {
      return;
    }

    if (calendarAppointments.length > 0) {
      setSelectedDate(calendarAppointments[0].start);
      hasInitializedDate.current = true;
    }
  }, [calendarAppointments]);

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

  if (!isAuthLoading && (!user || !userData || userData.userType !== "medico")) {
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
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-blue-600"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
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
            loading={isProfileLoading}
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

          {dataError ? (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar dados</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <span>{dataError}</span>
                <Button size="sm" variant="outline" onClick={refetchProfileData}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <DoctorStatsGrid stats={stats} loading={isProfileLoading} />
        </section>

        <section id="consultas" className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <UpcomingAppointmentsList
              appointments={upcomingAppointments}
              loading={isProfileLoading}
              onViewAll={() => navigate("/agenda-medico")}
            />
          </div>
          <div className="space-y-6">
            <NotificationsPanel
              notifications={profileNotifications}
              loading={isProfileLoading}
            />
          </div>
        </section>

        <section>
          <DoctorProfileTabs doctor={userData ?? null} loading={isProfileLoading} />
        </section>

        <section id="calendario" className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Suspense fallback={
              <div className="rounded-lg border border-blue-100/80 bg-white/80 p-6 shadow-sm">
                <Skeleton className="h-[400px] w-full" />
              </div>
            }>
              <DoctorCalendar
                appointments={calendarAppointments}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                loading={isProfileLoading}
              />
            </Suspense>
          </div>
          <div className="space-y-6">
            <DoctorQuickLinks links={quickLinks} loading={isProfileLoading} />
            <SupportCard loading={isProfileLoading} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default PerfilMedico;
