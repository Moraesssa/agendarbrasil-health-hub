import { supabase } from '@/integrations/supabase/client';

export interface MedicoMetrics {
  totalConsultations: number;
  todaysConsultations: number;
  upcomingConsultations: number;
  uniquePatients: number;
  occupancyRate: number;
  satisfactionRate: number;
}

export interface UpcomingAppointment {
  id: string;
  patientName: string;
  type: string;
  start: Date;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'scheduled' | 'cancelled' | 'completed';
  location: string;
}

export interface CalendarAppointment {
  id: string;
  patientName: string;
  type: string;
  start: Date;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'scheduled' | 'cancelled' | 'completed';
}

export interface MedicoNotification {
  id: string;
  type: 'appointment' | 'system' | 'message' | 'info' | 'warning' | 'success';
  title: string;
  description: string;
  time: string;
}

export const medicoProfileService = {
  async getMedicoMetrics(medicoId: string): Promise<MedicoMetrics> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const today = new Date().toISOString().split('T')[0];
    
    // Consultas hoje
    const { count: todaysCount } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('medico_id', medicoId)
      .gte('consultation_date', `${today}T00:00:00`)
      .lte('consultation_date', `${today}T23:59:59`)
      .in('status', ['agendada', 'confirmada', 'scheduled', 'confirmed']);
    
    // Pacientes únicos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: patients } = await supabase
      .from('consultas')
      .select('paciente_id')
      .eq('medico_id', medicoId)
      .gte('consultation_date', thirtyDaysAgo.toISOString())
      .not('paciente_id', 'is', null);
    
    const uniquePatients = new Set(patients?.map(p => p.paciente_id)).size;
    
    // Próximas consultas (7 dias)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const { count: upcomingCount } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('medico_id', medicoId)
      .gte('consultation_date', new Date().toISOString())
      .lte('consultation_date', sevenDaysLater.toISOString())
      .in('status', ['agendada', 'confirmada', 'scheduled', 'confirmed', 'pending_payment']);
    
    // Total de consultas
    const { count: totalConsultations } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('medico_id', medicoId);
    
    // Taxa de ocupação (próximos 7 dias - assumindo 5 slots por dia)
    const occupancyRate = upcomingCount ? Math.min(100, Math.round((upcomingCount / 35) * 100)) : 0;
    
    // Taxa de satisfação (calculada baseada em consultas concluídas vs canceladas)
    const { count: completedCount } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('medico_id', medicoId)
      .in('status', ['concluida', 'completed']);
    
    const { count: cancelledCount } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .eq('medico_id', medicoId)
      .in('status', ['cancelada', 'cancelled']);
    
    const satisfactionRate = completedCount && (completedCount + (cancelledCount || 0)) > 0
      ? Math.round((completedCount / (completedCount + (cancelledCount || 0))) * 100)
      : 92; // Default
    
    return {
      todaysConsultations: todaysCount || 0,
      upcomingConsultations: upcomingCount || 0,
      uniquePatients,
      totalConsultations: totalConsultations || 0,
      occupancyRate,
      satisfactionRate
    };
  },
  
  async getUpcomingConsultas(medicoId: string): Promise<UpcomingAppointment[]> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('medico_id', medicoId)
      .gte('consultation_date', new Date().toISOString())
      .in('status', ['agendada', 'confirmada', 'scheduled', 'confirmed', 'pending_payment'])
      .order('consultation_date', { ascending: true })
      .limit(5);
    
    if (error) throw error;
    
    return (data || []).map(consulta => ({
      id: String(consulta.id),
      patientName: consulta.patient_name || 'Paciente sem nome',
      type: consulta.consultation_type || 'presencial',
      start: new Date(consulta.consultation_date),
      status: (consulta.status || 'pendente') as 'pendente' | 'confirmada' | 'cancelada' | 'scheduled' | 'cancelled' | 'completed',
      location: consulta.consultation_type === 'telemedicina' ? 'Online' : 'Consultório'
    } as UpcomingAppointment));
  },
  
  async getConsultasByMonth(medicoId: string, month: Date): Promise<CalendarAppointment[]> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('medico_id', medicoId)
      .gte('consultation_date', startOfMonth.toISOString())
      .lte('consultation_date', endOfMonth.toISOString())
      .order('consultation_date', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(consulta => ({
      id: String(consulta.id),
      patientName: consulta.patient_name || 'Paciente',
      type: consulta.consultation_type || 'presencial',
      start: new Date(consulta.consultation_date),
      status: (consulta.status || 'pendente') as 'pendente' | 'confirmada' | 'cancelada' | 'scheduled' | 'cancelled' | 'completed'
    } as CalendarAppointment));
  },
  
  async getMedicoNotifications(medicoId: string): Promise<MedicoNotification[]> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const notifications: MedicoNotification[] = [];
    
    // Buscar consultas pendentes de confirmação
    const { data: pendingConsultas } = await supabase
      .from('consultas')
      .select('*')
      .eq('medico_id', medicoId)
      .in('status', ['pending', 'pending_payment'])
      .gte('consultation_date', new Date().toISOString())
      .order('consultation_date', { ascending: true })
      .limit(3);
    
    pendingConsultas?.forEach(consulta => {
      const consultaDate = new Date(consulta.consultation_date);
      const now = new Date();
      const diffHours = Math.floor((consultaDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      let timeText = 'Agora';
      if (diffHours > 24) {
        timeText = `${Math.floor(diffHours / 24)}d`;
      } else if (diffHours > 0) {
        timeText = `${diffHours}h`;
      }
      
      notifications.push({
        id: `pending-${consulta.id}`,
        type: 'appointment',
        title: 'Consulta pendente de confirmação',
        description: `${consulta.patient_name || 'Paciente'} aguarda confirmação`,
        time: timeText
      });
    });
    
    // Buscar consultas nas próximas 2 horas
    const twoHoursLater = new Date();
    twoHoursLater.setHours(twoHoursLater.getHours() + 2);
    
    const { data: upcomingSoon } = await supabase
      .from('consultas')
      .select('*')
      .eq('medico_id', medicoId)
      .gte('consultation_date', new Date().toISOString())
      .lte('consultation_date', twoHoursLater.toISOString())
      .in('status', ['agendada', 'confirmada', 'scheduled', 'confirmed'])
      .limit(2);
    
    upcomingSoon?.forEach(consulta => {
      const consultaDate = new Date(consulta.consultation_date);
      const diffMinutes = Math.floor((consultaDate.getTime() - new Date().getTime()) / (1000 * 60));
      
      notifications.push({
        id: `upcoming-${consulta.id}`,
        type: 'warning',
        title: 'Consulta em breve',
        description: `${consulta.patient_name || 'Paciente'} em ${diffMinutes} minutos`,
        time: `${diffMinutes}min`
      });
    });
    
    // Verificar tabela de notificações se existir
    try {
      const { data: dbNotifications, error: notifError } = await supabase
        .from('medico_notifications')
        .select('*')
        .eq('medico_id', medicoId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!notifError && dbNotifications) {
        dbNotifications.forEach((notif) => {
          const createdDate = new Date(notif.created_at || new Date());
          const diffMinutes = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60));
          
          let timeText = 'Agora';
          if (diffMinutes > 60) {
            timeText = `${Math.floor(diffMinutes / 60)}h`;
          } else if (diffMinutes > 0) {
            timeText = `${diffMinutes}min`;
          }
          
          notifications.push({
            id: notif.id,
            type: notif.type as 'appointment' | 'system' | 'message' | 'info' | 'warning' | 'success',
            title: notif.title,
            description: notif.description,
            time: timeText
          });
        });
      }
    } catch (error) {
      console.debug('Error fetching medico_notifications:', error);
    }
    
    return notifications.slice(0, 10);
  }
};
