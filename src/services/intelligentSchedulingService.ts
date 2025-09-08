/**
 * Serviço de Agendamento Inteligente
 * Implementação funcional das inovações para produção
 */

import { supabase } from '@/integrations/supabase/client';

export interface Doctor {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  uf_crm: string;
  valor_consulta_presencial: number;
  valor_consulta_teleconsulta: number;
  duracao_consulta_padrao: number;
  duracao_teleconsulta: number;
  aceita_teleconsulta: boolean;
  aceita_consulta_presencial: boolean;
  rating: number;
  foto_perfil_url?: string;
  bio_perfil?: string;
  locais_atendimento: AttendanceLocation[];
}

export interface AttendanceLocation {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep?: string;
  telefone?: string;
  ativo: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  type: 'presencial' | 'teleconsulta';
  location_id?: string;
  estimated_duration: number;
  confidence_score: number; // IA: confiança na disponibilidade
  traffic_factor?: number; // Fator de trânsito para consultas presenciais
}

export interface SmartRecommendation {
  doctor_id: string;
  recommended_time: string;
  type: 'presencial' | 'teleconsulta';
  confidence: number;
  reasons: string[];
  estimated_wait_time: number;
}

class IntelligentSchedulingService {
  
  /**
   * Busca médicos com IA - considera histórico, localização e preferências
   */
  async searchDoctorsIntelligent(params: {
    specialty?: string;
    city?: string;
    state?: string;
    consultation_type?: 'presencial' | 'teleconsulta' | 'both';
    patient_id?: string;
    urgency?: 'low' | 'normal' | 'high' | 'emergency';
    family_members?: string[]; // Para agendamento familiar
  }): Promise<Doctor[]> {
    
    let query = supabase
      .from('medicos')
      .select(`
        *,
        usuarios!inner(nome, email, foto_perfil_url),
        locais_atendimento!inner(*)
      `)
      .eq('ativo', true);

    // Filtros básicos
    if (params.specialty) {
      query = query.ilike('especialidade', `%${params.specialty}%`);
    }

    if (params.consultation_type === 'teleconsulta') {
      query = query.eq('aceita_teleconsulta', true);
    } else if (params.consultation_type === 'presencial') {
      query = query.eq('aceita_consulta_presencial', true);
    }

    // Filtro por localização para consultas presenciais
    if (params.city || params.state) {
      if (params.city) {
        query = query.eq('locais_atendimento.cidade', params.city);
      }
      if (params.state) {
        query = query.eq('locais_atendimento.estado', params.state);
      }
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) {
      console.error('Erro ao buscar médicos:', error);
      throw new Error('Erro ao buscar médicos disponíveis');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Processar dados e aplicar IA
    const doctors: Doctor[] = data.map(medico => ({
      id: medico.id,
      nome: medico.usuarios?.nome || medico.nome || 'Nome não disponível',
      especialidade: medico.especialidade,
      crm: medico.crm,
      uf_crm: medico.uf_crm,
      valor_consulta_presencial: medico.valor_consulta_presencial || 150,
      valor_consulta_teleconsulta: medico.valor_consulta_teleconsulta || 120,
      duracao_consulta_padrao: medico.duracao_consulta_padrao || 30,
      duracao_teleconsulta: medico.duracao_teleconsulta || 25,
      aceita_teleconsulta: medico.aceita_teleconsulta,
      aceita_consulta_presencial: medico.aceita_consulta_presencial,
      rating: medico.rating || 0,
      foto_perfil_url: medico.usuarios?.foto_perfil_url || medico.foto_perfil_url,
      bio_perfil: medico.bio_perfil,
      locais_atendimento: medico.locais_atendimento || []
    }));

    // IA: Ordenar por relevância considerando histórico do paciente
    if (params.patient_id) {
      return this.applyIntelligentRanking(doctors, params.patient_id, params.urgency);
    }

    return doctors;
  }

  /**
   * IA: Aplica ranking inteligente baseado no histórico do paciente
   */
  private async applyIntelligentRanking(
    doctors: Doctor[], 
    patientId: string, 
    urgency?: string
  ): Promise<Doctor[]> {
    
    // Buscar histórico do paciente
    const { data: history } = await supabase
      .from('consultas')
      .select('medico_id, rating_medico, data_hora_agendada')
      .eq('paciente_id', patientId)
      .order('data_hora_agendada', { ascending: false })
      .limit(10);

    // Aplicar pontuação inteligente
    const scoredDoctors = doctors.map(doctor => {
      let score = doctor.rating * 10; // Base score

      // Bonus por histórico positivo
      const pastConsultations = history?.filter(h => h.medico_id === doctor.id) || [];
      if (pastConsultations.length > 0) {
        const avgRating = pastConsultations.reduce((sum, c) => sum + (c.rating_medico || 0), 0) / pastConsultations.length;
        score += avgRating * 5; // Bonus por histórico
        score += pastConsultations.length * 2; // Bonus por familiaridade
      }

      // Ajuste por urgência
      if (urgency === 'emergency' && doctor.aceita_teleconsulta) {
        score += 20; // Priorizar teleconsulta para emergências
      }

      return { ...doctor, intelligentScore: score };
    });

    // Ordenar por pontuação inteligente
    return scoredDoctors
      .sort((a, b) => (b as any).intelligentScore - (a as any).intelligentScore)
      .map(({ intelligentScore, ...doctor }) => doctor);
  }

  /**
   * Busca horários disponíveis com otimização inteligente
   */
  async getIntelligentTimeSlots(params: {
    doctor_id: string;
    date: string;
    consultation_type?: 'presencial' | 'teleconsulta';
    patient_id?: string;
    duration_needed?: number;
  }): Promise<TimeSlot[]> {
    
    const doctorId = params.doctor_id;
    const date = new Date(params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar horários de funcionamento
    const { data: workingHours } = await supabase
      .from('horarios_disponibilidade')
      .select(`
        *,
        locais_atendimento(*)
      `)
      .eq('medico_id', doctorId)
      .eq('ativo', true)
      .eq('dia_semana', date.getDay());

    // Buscar consultas já agendadas
    const { data: existingAppointments } = await supabase
      .from('consultas')
      .select('data_hora_agendada, duracao_estimada, tipo')
      .eq('medico_id', doctorId)
      .gte('data_hora_agendada', startOfDay.toISOString())
      .lte('data_hora_agendada', endOfDay.toISOString())
      .in('status', ['agendada', 'confirmada', 'em_andamento']);

    if (!workingHours || workingHours.length === 0) {
      return [];
    }

    const timeSlots: TimeSlot[] = [];

    // Gerar slots para cada horário de funcionamento
    for (const workingHour of workingHours) {
      const slots = await this.generateIntelligentSlots(
        date,
        workingHour,
        existingAppointments || [],
        params
      );
      timeSlots.push(...slots);
    }

    // IA: Aplicar otimização e scoring
    return this.optimizeTimeSlots(timeSlots, params);
  }

  /**
   * Gera slots inteligentes considerando múltiplos fatores
   */
  private async generateIntelligentSlots(
    date: Date,
    workingHour: any,
    existingAppointments: any[],
    params: any
  ): Promise<TimeSlot[]> {
    
    const slots: TimeSlot[] = [];
    
    // Configurar horários
    const [startHour, startMinute] = workingHour.hora_inicio.split(':').map(Number);
    const [endHour, endMinute] = workingHour.hora_fim.split(':').map(Number);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Determinar duração baseada no tipo
    const slotDuration = params.duration_needed || 
      (params.consultation_type === 'teleconsulta' ? 25 : 30);

    // Gerar slots a cada 15 minutos
    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 15)) {
      const slotEnd = new Date(time.getTime() + slotDuration * 60000);
      
      if (slotEnd > endTime) break;

      // Verificar conflitos
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.data_hora_agendada);
        const aptEnd = new Date(aptStart.getTime() + apt.duracao_estimada * 60000);
        return (time < aptEnd && slotEnd > aptStart);
      });

      if (!hasConflict) {
        // IA: Calcular confiança baseada em padrões históricos
        const confidence = await this.calculateSlotConfidence(time, workingHour, params);
        
        slots.push({
          time: time.toISOString(),
          available: true,
          type: params.consultation_type || workingHour.tipo_consulta || 'presencial',
          location_id: workingHour.local_id,
          estimated_duration: slotDuration,
          confidence_score: confidence,
          traffic_factor: params.consultation_type === 'presencial' ? 
            await this.getTrafficFactor(time, workingHour.locais_atendimento) : undefined
        });
      }
    }

    return slots;
  }

  /**
   * IA: Calcula confiança na disponibilidade do slot
   */
  private async calculateSlotConfidence(
    time: Date, 
    workingHour: any, 
    params: any
  ): Promise<number> {
    
    let confidence = 0.8; // Base confidence

    // Ajustar por horário do dia
    const hour = time.getHours();
    if (hour >= 9 && hour <= 11) confidence += 0.1; // Manhã é mais confiável
    if (hour >= 14 && hour <= 16) confidence += 0.05; // Tarde moderada
    if (hour >= 17) confidence -= 0.1; // Final do dia menos confiável

    // Ajustar por dia da semana
    const dayOfWeek = time.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 4) confidence += 0.05; // Seg-Qui mais confiável
    if (dayOfWeek === 5) confidence -= 0.05; // Sexta menos confiável

    // Ajustar por tipo de consulta
    if (params.consultation_type === 'teleconsulta') {
      confidence += 0.1; // Teleconsulta mais flexível
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Obtém fator de trânsito para consultas presenciais
   */
  private async getTrafficFactor(time: Date, location: any): Promise<number> {
    // Simulação de API de trânsito - em produção integrar com Google Maps/Waze
    const hour = time.getHours();
    
    // Horários de pico
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.5; // 50% mais tempo no trânsito
    }
    
    // Horários normais
    if (hour >= 10 && hour <= 16) {
      return 1.0; // Tempo normal
    }
    
    // Horários tranquilos
    return 0.8; // 20% menos tempo
  }

  /**
   * IA: Otimiza e ordena os slots por relevância
   */
  private optimizeTimeSlots(slots: TimeSlot[], params: any): TimeSlot[] {
    return slots
      .map(slot => ({
        ...slot,
        // Score combinado: confiança + fatores externos
        optimizationScore: slot.confidence_score * 0.6 + 
          (slot.traffic_factor ? (2 - slot.traffic_factor) * 0.4 : 0.4)
      }))
      .sort((a, b) => (b as any).optimizationScore - (a as any).optimizationScore)
      .map(({ optimizationScore, ...slot }) => slot);
  }

  /**
   * Recomendações inteligentes para o paciente
   */
  async getSmartRecommendations(params: {
    patient_id: string;
    specialty?: string;
    urgency?: 'low' | 'normal' | 'high' | 'emergency';
    preferred_type?: 'presencial' | 'teleconsulta';
    family_members?: string[];
  }): Promise<SmartRecommendation[]> {
    
    // Buscar histórico e preferências do paciente
    const { data: patientHistory } = await supabase
      .from('consultas')
      .select(`
        *,
        medicos(id, nome, especialidade, rating)
      `)
      .eq('paciente_id', params.patient_id)
      .order('data_hora_agendada', { ascending: false })
      .limit(5);

    // Buscar médicos disponíveis
    const doctors = await this.searchDoctorsIntelligent({
      specialty: params.specialty,
      consultation_type: params.preferred_type || 'both',
      patient_id: params.patient_id,
      urgency: params.urgency
    });

    const recommendations: SmartRecommendation[] = [];

    // Gerar recomendações para os top 3 médicos
    for (const doctor of doctors.slice(0, 3)) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Buscar próximos slots disponíveis
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() + i + 1);

        const slots = await this.getIntelligentTimeSlots({
          doctor_id: doctor.id,
          date: checkDate.toISOString().split('T')[0],
          consultation_type: params.preferred_type,
          patient_id: params.patient_id
        });

        if (slots.length > 0) {
          const bestSlot = slots[0]; // Já otimizado
          
          recommendations.push({
            doctor_id: doctor.id,
            recommended_time: bestSlot.time,
            type: bestSlot.type,
            confidence: bestSlot.confidence_score,
            reasons: this.generateRecommendationReasons(doctor, bestSlot, patientHistory),
            estimated_wait_time: this.calculateEstimatedWaitTime(bestSlot)
          });
          break;
        }
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Gera razões para a recomendação
   */
  private generateRecommendationReasons(
    doctor: Doctor, 
    slot: TimeSlot, 
    history: any[]
  ): string[] {
    const reasons: string[] = [];

    if (doctor.rating >= 4.5) {
      reasons.push('Médico com excelente avaliação');
    }

    if (history?.some(h => h.medicos?.id === doctor.id)) {
      reasons.push('Você já consultou com este médico');
    }

    if (slot.confidence_score >= 0.9) {
      reasons.push('Horário com alta disponibilidade');
    }

    if (slot.type === 'teleconsulta') {
      reasons.push('Consulta online - sem deslocamento');
    }

    if (slot.traffic_factor && slot.traffic_factor <= 1.0) {
      reasons.push('Trânsito favorável para este horário');
    }

    return reasons;
  }

  /**
   * Calcula tempo estimado de espera
   */
  private calculateEstimatedWaitTime(slot: TimeSlot): number {
    // Baseado na confiança e fatores de trânsito
    let waitTime = 5; // Base: 5 minutos

    if (slot.confidence_score < 0.8) {
      waitTime += 10;
    }

    if (slot.traffic_factor && slot.traffic_factor > 1.2) {
      waitTime += 15;
    }

    return waitTime;
  }

  /**
   * Agendamento inteligente com otimização automática
   */
  async createIntelligentAppointment(params: {
    doctor_id: string;
    patient_id: string;
    date_time: string;
    type: 'presencial' | 'teleconsulta';
    location_id?: string;
    family_member_id?: string;
    notes?: string;
  }): Promise<{ success: boolean; appointment_id?: string; message: string }> {
    
    try {
      // Verificar disponibilidade em tempo real
      const slots = await this.getIntelligentTimeSlots({
        doctor_id: params.doctor_id,
        date: params.date_time.split('T')[0],
        consultation_type: params.type,
        patient_id: params.patient_id
      });

      const requestedTime = new Date(params.date_time);
      const availableSlot = slots.find(slot => {
        const slotTime = new Date(slot.time);
        return Math.abs(slotTime.getTime() - requestedTime.getTime()) < 60000; // 1 minuto de tolerância
      });

      if (!availableSlot) {
        return {
          success: false,
          message: 'Horário não disponível. Tente outro horário.'
        };
      }

      // Buscar dados do médico para durações
      const { data: doctor } = await supabase
        .from('medicos')
        .select('*')
        .eq('id', params.doctor_id)
        .single();

      if (!doctor) {
        return {
          success: false,
          message: 'Médico não encontrado.'
        };
      }

      // Criar consulta com dados otimizados
      const appointmentData = {
        medico_id: params.doctor_id,
        paciente_id: params.family_member_id || params.patient_id,
        data_hora_agendada: params.date_time,
        tipo: params.type,
        local_id: params.location_id,
        duracao_estimada: params.type === 'teleconsulta' ? 
          doctor.duracao_teleconsulta : doctor.duracao_consulta_padrao,
        valor_consulta: params.type === 'teleconsulta' ? 
          doctor.valor_consulta_teleconsulta : doctor.valor_consulta_presencial,
        status: 'agendada',
        observacoes_paciente: params.notes,
        agendado_por: params.patient_id,
        confidence_score: availableSlot.confidence_score,
        estimated_wait_time: this.calculateEstimatedWaitTime(availableSlot)
      };

      const { data, error } = await supabase
        .from('consultas')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar consulta:', error);
        return {
          success: false,
          message: 'Erro ao agendar consulta. Tente novamente.'
        };
      }

      // Criar notificações inteligentes
      await this.createIntelligentNotifications(data.id, availableSlot);

      return {
        success: true,
        appointment_id: data.id,
        message: 'Consulta agendada com sucesso!'
      };

    } catch (error) {
      console.error('Erro no agendamento inteligente:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  /**
   * Cria notificações inteligentes baseadas no tipo de consulta
   */
  private async createIntelligentNotifications(
    appointmentId: string, 
    slot: TimeSlot
  ): Promise<void> {
    
    const appointmentTime = new Date(slot.time);
    
    // Notificações baseadas no tipo de consulta
    const notifications = [];

    if (slot.type === 'teleconsulta') {
      // Lembrete para testar conexão
      notifications.push({
        consulta_id: appointmentId,
        tipo: 'lembrete_tecnico',
        titulo: 'Teste sua conexão',
        mensagem: 'Teste sua câmera e microfone antes da teleconsulta',
        enviar_em: new Date(appointmentTime.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2h antes
      });
    } else {
      // Lembrete sobre trânsito para consulta presencial
      if (slot.traffic_factor && slot.traffic_factor > 1.2) {
        notifications.push({
          consulta_id: appointmentId,
          tipo: 'alerta_transito',
          titulo: 'Atenção ao trânsito',
          mensagem: 'Saia com antecedência devido ao trânsito intenso neste horário',
          enviar_em: new Date(appointmentTime.getTime() - 3 * 60 * 60 * 1000).toISOString() // 3h antes
        });
      }
    }

    // Lembrete padrão
    notifications.push({
      consulta_id: appointmentId,
      tipo: 'lembrete',
      titulo: 'Consulta amanhã',
      mensagem: `Você tem uma ${slot.type} agendada para amanhã às ${appointmentTime.toLocaleTimeString('pt-BR')}`,
      enviar_em: new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000).toISOString() // 24h antes
    });

    if (notifications.length > 0) {
      await supabase.from('notificacoes').insert(notifications);
    }
  }
}

export const intelligentSchedulingService = new IntelligentSchedulingService();
export default intelligentSchedulingService;