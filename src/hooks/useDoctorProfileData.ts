import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addMinutes, differenceInCalendarDays, format, isAfter, isSameDay, isValid, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DoctorAppointment, DoctorNotification } from '@/components/doctor/profile/types';
import { timeToMinutes } from '@/utils/timeSlotUtils';

interface DoctorProfileMetrics {
  totalConsultations: number;
  todaysConsultations: number;
  upcomingConsultations: number;
  uniquePatients: number;
  occupancyRate: number;
  satisfactionRate: number;
}

interface UseDoctorProfileDataResult {
  metrics: DoctorProfileMetrics;
  upcomingAppointments: DoctorAppointment[];
  calendarAppointments: DoctorAppointment[];
  notifications: DoctorNotification[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type SupabaseDoctorConsultaRow = {
  id: number;
  consultation_date: string | null;
  consultation_type: string | null;
  status: string | null;
  patient_name: string | null;
  paciente_id: string | null;
  notes: string | null;
  status_pagamento: string | null;
  patient_profiles?: {
    display_name: string | null;
  } | null;
};

const INITIAL_METRICS: DoctorProfileMetrics = {
  totalConsultations: 0,
  todaysConsultations: 0,
  upcomingConsultations: 0,
  uniquePatients: 0,
  occupancyRate: 0,
  satisfactionRate: 100,
};

const normalizeStatus = (status?: string | null): DoctorAppointment['status'] => {
  const value = (status ?? '').toLowerCase();

  if (['cancelada', 'cancelado', 'cancelada_pelo_paciente', 'cancelada_pelo_medico', 'nao_compareceu'].includes(value)) {
    return 'cancelada';
  }

  if (['pendente', 'agendada', 'aguardando_confirmacao', 'solicitada'].includes(value)) {
    return 'pendente';
  }

  return 'confirmada';
};

const isValidString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const useDoctorProfileData = (): UseDoctorProfileDataResult => {
  const { user, userData } = useAuth();
  const [metrics, setMetrics] = useState<DoctorProfileMetrics>(INITIAL_METRICS);
  const [upcomingAppointments, setUpcomingAppointments] = useState<DoctorAppointment[]>([]);
  const [calendarAppointments, setCalendarAppointments] = useState<DoctorAppointment[]>([]);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const estimatedDailyCapacity = useMemo(() => {
    const configuracoes = userData?.configuracoes;
    const horarioAtendimento = configuracoes?.horarioAtendimento;
    const consultaDuration = configuracoes?.duracaoConsulta && configuracoes.duracaoConsulta > 0
      ? configuracoes.duracaoConsulta
      : 30;

    if (!horarioAtendimento || typeof horarioAtendimento !== 'object') {
      return 8;
    }

    let totalSlots = 0;
    let activeDays = 0;

    Object.values(horarioAtendimento as Record<string, unknown>).forEach((value) => {
      if (!Array.isArray(value)) return;

      let daySlots = 0;

      value.forEach((block) => {
        if (!block || typeof block !== 'object') return;
        const { inicio, fim, ativo } = block as { inicio?: string; fim?: string; ativo?: boolean };

        if (!ativo || !isValidString(inicio) || !isValidString(fim)) {
          return;
        }

        const availableMinutes = Math.max(timeToMinutes(fim) - timeToMinutes(inicio), 0);
        if (availableMinutes > 0) {
          daySlots += Math.floor(availableMinutes / consultaDuration);
        }
      });

      if (daySlots > 0) {
        activeDays += 1;
        totalSlots += daySlots;
      }
    });

    if (activeDays === 0) {
      return 8;
    }

    return Math.max(1, Math.round(totalSlots / activeDays));
  }, [userData?.configuracoes]);

  const refetch = useCallback(async () => {
    if (!user || userData?.userType !== 'medico') {
      if (isMountedRef.current) {
        setMetrics(INITIAL_METRICS);
        setUpcomingAppointments([]);
        setCalendarAppointments([]);
        setNotifications([]);
        setLoading(false);
        setError(null);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const startDate = subDays(new Date(), 30).toISOString();

      const { data, error: consultasError } = await supabase
        .from('consultas')
        .select(`
          id,
          consultation_date,
          consultation_type,
          status,
          patient_name,
          paciente_id,
          notes,
          status_pagamento,
          patient_profiles:profiles!consultas_paciente_id_fkey (display_name)
        `)
        .eq('medico_id', user.id)
        .gte('consultation_date', startDate)
        .order('consultation_date', { ascending: true });

      if (consultasError) {
        throw consultasError;
      }

      const processedConsultations = (data ?? [])
        .filter((item): item is SupabaseDoctorConsultaRow => Boolean(item))
        .flatMap((item) => {
          if (!item?.consultation_date) {
            return [];
          }

          const parsedDate = parseISO(item.consultation_date);

          if (!isValid(parsedDate)) {
            return [];
          }

          return [{
            id: String(item.id),
            start: parsedDate,
            status: item.status ?? 'agendada',
            consultationType: item.consultation_type ?? 'Consulta',
            patientId: item.paciente_id ?? null,
            patientName: item.patient_profiles?.display_name
              ?? item.patient_name
              ?? 'Paciente',
            notes: item.notes,
          }];
        });

      const now = new Date();
      const appointmentDuration = userData?.configuracoes?.duracaoConsulta && userData.configuracoes.duracaoConsulta > 0
        ? userData.configuracoes.duracaoConsulta
        : 30;

      const doctorAppointments = processedConsultations.map<DoctorAppointment>((consulta) => ({
        id: consulta.id,
        patientName: consulta.patientName,
        start: consulta.start.toISOString(),
        end: addMinutes(consulta.start, appointmentDuration).toISOString(),
        type: consulta.consultationType,
        status: normalizeStatus(consulta.status),
        notes: consulta.notes ?? undefined,
        location: consulta.consultationType?.toLowerCase() === 'teleconsulta'
          ? 'Teleconsulta'
          : 'Atendimento presencial',
      }));

      const upcomingList = doctorAppointments
        .filter((appointment) => isAfter(parseISO(appointment.start), now) || isSameDay(parseISO(appointment.start), now))
        .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

      const nextAppointments = upcomingList.slice(0, 5);

      const nextSevenDaysCount = upcomingList.filter((appointment) => {
        const diff = differenceInCalendarDays(parseISO(appointment.start), now);
        return diff >= 0 && diff <= 6;
      }).length;

      const completedCount = processedConsultations.filter((consulta) => (consulta.status ?? '').toLowerCase() === 'realizada').length;
      const cancelledCount = processedConsultations.filter((consulta) =>
        ['cancelada', 'cancelado', 'cancelada_pelo_paciente', 'cancelada_pelo_medico', 'nao_compareceu']
          .includes((consulta.status ?? '').toLowerCase())
      ).length;

      const metricsData: DoctorProfileMetrics = {
        totalConsultations: processedConsultations.length,
        todaysConsultations: processedConsultations.filter((consulta) => isSameDay(consulta.start, now)).length,
        upcomingConsultations: upcomingList.length,
        uniquePatients: processedConsultations.reduce((acc, consulta) => {
          if (consulta.patientId) {
            acc.add(consulta.patientId);
          }
          return acc;
        }, new Set<string>()).size,
        occupancyRate: (() => {
          const capacity = estimatedDailyCapacity * 7;
          if (capacity <= 0) return nextSevenDaysCount > 0 ? 100 : 0;
          return Math.min(100, Math.round((nextSevenDaysCount / capacity) * 100));
        })(),
        satisfactionRate: (() => {
          const totalEvaluated = completedCount + cancelledCount;
          if (totalEvaluated === 0) return 100;
          return Math.min(100, Math.max(0, Math.round((completedCount / totalEvaluated) * 100)));
        })(),
      };

      const pendingCount = upcomingList.filter((appointment) => appointment.status === 'pendente' || appointment.status === 'scheduled').length;
      const nextAppointment = upcomingList[0];

      const notificationsData: DoctorNotification[] = [];

      if (nextAppointment) {
        notificationsData.push({
          id: 'next-appointment',
          title: 'Próxima consulta',
          description: `Atendimento com ${nextAppointment.patientName} em ${format(parseISO(nextAppointment.start), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}.`,
          time: 'Atualizado agora',
          type: 'info',
        });
      }

      if (pendingCount > 0) {
        notificationsData.push({
          id: 'pending-appointments',
          title: 'Confirme os próximos atendimentos',
          description: `${pendingCount} consulta(s) aguardando confirmação para os próximos dias.`,
          time: 'Requer ação',
          type: 'warning',
        });
      }

      notificationsData.push({
        id: 'occupancy-rate',
        title: 'Ocupação da agenda',
        description: `Sua agenda está com ${metricsData.occupancyRate}% de ocupação para os próximos 7 dias.`,
        time: 'Visão geral da agenda',
        type: metricsData.occupancyRate >= 80 ? 'success' : 'info',
      });

      notificationsData.push({
        id: 'satisfaction-index',
        title: 'Índice de satisfação',
        description: metricsData.satisfactionRate >= 85
          ? 'Excelente desempenho nas últimas consultas realizadas.'
          : 'Revise os atendimentos recentes para melhorar a satisfação dos pacientes.',
        time: 'Indicador de qualidade',
        type: metricsData.satisfactionRate >= 85 ? 'success' : 'warning',
      });

      if (userData?.crm) {
        notificationsData.push({
          id: 'crm-status',
          title: 'CRM verificado',
          description: 'Seu número de CRM está atualizado e validado na plataforma.',
          time: 'Credenciais profissionais',
          type: 'success',
        });
      } else {
        notificationsData.push({
          id: 'crm-pending',
          title: 'Informe seu CRM',
          description: 'Adicione seu CRM para liberar todos os recursos da plataforma.',
          time: 'Requer atenção',
          type: 'warning',
        });
      }

      if (userData?.preferences?.notifications) {
        notificationsData.push({
          id: 'notifications-enabled',
          title: 'Notificações ativadas',
          description: 'Você receberá alertas de novos agendamentos em tempo real.',
          time: 'Configurações da conta',
          type: 'success',
        });
      } else {
        notificationsData.push({
          id: 'notifications-disabled',
          title: 'Ative as notificações',
          description: 'Ative os avisos para não perder solicitações de pacientes.',
          time: 'Sugestão',
          type: 'warning',
        });
      }

      if (isMountedRef.current) {
        setMetrics(metricsData);
        setUpcomingAppointments(nextAppointments);
        setCalendarAppointments(doctorAppointments);
        setNotifications(notificationsData);
        setError(null);
      }
    } catch (fetchError) {
      console.error('Erro ao carregar dados do perfil do médico:', fetchError);
      if (isMountedRef.current) {
        setError('Não foi possível carregar as informações do perfil. Tente novamente.');
        setMetrics(INITIAL_METRICS);
        setUpcomingAppointments([]);
        setCalendarAppointments([]);
        setNotifications([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    estimatedDailyCapacity,
    user,
    userData?.configuracoes?.duracaoConsulta,
    userData?.crm,
    userData?.preferences?.notifications,
    userData?.userType,
  ]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    metrics,
    upcomingAppointments,
    calendarAppointments,
    notifications,
    loading,
    error,
    refetch,
  };
};

export type { DoctorProfileMetrics, UseDoctorProfileDataResult };
