/**
 * Serviço de Agendamento Inteligente
 * Integração completa entre médicos e pacientes
 */

import { supabase } from '@/integrations/supabase/client';

// ========= TIPOS CORRIGIDOS =========

export interface Doctor {
  id: string;
  user_id: string;
  crm?: string;
  uf_crm?: string;
  especialidade?: string;
  nome: string;
  email: string;
  display_name?: string;
  telefone?: string;
  foto_perfil_url?: string;
  bio_perfil?: string;
  rating?: number;
  total_avaliacoes?: number;
  especialidades?: string[];
  valor_consulta_presencial?: number;
  valor_consulta_teleconsulta?: number;
  duracao_consulta_padrao?: number;
  duracao_consulta_inicial?: number;
  aceita_teleconsulta?: boolean;
  aceita_consulta_presencial?: boolean;
  ativo?: boolean;
  created_at?: string;
  cidade?: string;
  estado?: string;
}

export interface Patient {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  cpf?: string;
  data_nascimento: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  created_at: string;
}

export interface AttendanceLocation {
  id: string;
  medico_id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep?: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
}

export interface WorkingHours {
  id: string;
  medico_id: string;
  local_id?: string;
  dia_semana: number; // 0=domingo, 6=sábado
  hora_inicio: string;
  hora_fim: string;
  tipo_consulta: 'presencial' | 'teleconsulta';
  intervalo_consultas: number;
  ativo: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  medico_id: string;
  paciente_id: string;
  local_id?: string;
  data_hora_agendada: string;
  duracao_estimada: number;
  duracao_real?: number;
  tipo: 'presencial' | 'teleconsulta';
  status: 'agendada' | 'confirmada' | 'em_andamento' | 'realizada' | 'cancelada' | 'nao_compareceu' | 'reagendada';
  prioridade?: string;
  valor_consulta?: number;
  motivo_consulta?: string;
  observacoes_medico?: string;
  buffer_antes?: number;
  buffer_depois?: number;
  permite_reagendamento?: boolean;
  agendado_por: string;
  created_at?: string;
  
  // Dados relacionados (joins)
  medico?: Doctor;
  paciente?: Patient;
  local?: AttendanceLocation;
}

export interface AvailableSlot {
  data_hora: string;
  duracao_disponivel: number;
  local_id?: string;
  tipo_consulta: 'presencial' | 'teleconsulta';
  valor: number;
}

export interface SearchFilters {
  especialidade?: string;
  cidade?: string;
  estado?: string;
  tipo_consulta?: 'presencial' | 'teleconsulta';
  data_inicio?: string;
  data_fim?: string;
  valor_maximo?: number;
}

// ========= SERVIÇO PRINCIPAL =========

export class SchedulingService {
  
  // ========= BUSCA DE MÉDICOS =========
  
  static async searchDoctors(filters: SearchFilters = {}): Promise<Doctor[]> {
    try {
      console.log('🔍 Buscando médicos com filtros:', filters);
      
      let query = supabase
        .from('medicos')
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .eq('is_active', true);

      // Aplicar filtros
      if (filters.especialidade) {
        // Buscar em especialidades (array) ou especialidade (string)
        query = query.or(`especialidades.cs.{${filters.especialidade}},especialidade.ilike.%${filters.especialidade}%`);
      }

      if (filters.cidade || filters.estado) {
        // Buscar médicos que atendem na cidade/estado através dos locais
        let locaisQuery = supabase
          .from('locais_atendimento')
          .select('medico_id')
          .eq('ativo', true);
        
        if (filters.cidade) {
          locaisQuery = locaisQuery.ilike('cidade', `%${filters.cidade}%`);
        }
        
        if (filters.estado) {
          locaisQuery = locaisQuery.eq('estado', filters.estado);
        }
        
        const { data: locais } = await locaisQuery;
        
        if (locais && locais.length > 0) {
          const medicoIds = locais.map(l => String(l.medico_id));
          query = query.in('user_id', medicoIds);
        } else {
          console.log('⚠️ Nenhum local encontrado para os filtros especificados');
          return [];
        }
      }

      if (filters.tipo_consulta === 'teleconsulta') {
        query = query.eq('aceita_teleconsulta', true);
      } else if (filters.tipo_consulta === 'presencial') {
        query = query.eq('aceita_consulta_presencial', true);
      }

      if (filters.valor_maximo) {
        if (filters.tipo_consulta === 'teleconsulta') {
          query = query.lte('valor_consulta_teleconsulta', filters.valor_maximo);
        } else {
          query = query.lte('valor_consulta_presencial', filters.valor_maximo);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar médicos:', error);
        throw new Error(`Erro ao buscar médicos: ${error.message}`);
      }

      console.log(`✅ Encontrados ${data?.length || 0} médicos`);
      
      // Mapear dados para o formato esperado
      const doctors: Doctor[] = (data || []).map((m: any) => ({
        id: String(m.id || m.user_id),
        user_id: String(m.user_id),
        nome: m.profiles?.display_name || 'Médico',
        display_name: m.profiles?.display_name || 'Médico',
        email: m.profiles?.email || '',
        crm: m.crm,
        uf_crm: m.estado,
        especialidade: Array.isArray(m.especialidades) ? m.especialidades[0] : m.especialidade,
        especialidades: Array.isArray(m.especialidades) ? m.especialidades : [m.especialidade].filter(Boolean),
        foto_perfil_url: m.foto_perfil_url,
        bio_perfil: m.bio_perfil,
        rating: m.rating || 0,
        total_avaliacoes: m.total_avaliacoes || 0,
        telefone: m.telefone,
        valor_consulta_presencial: m.valor_consulta_presencial,
        valor_consulta_teleconsulta: m.valor_consulta_teleconsulta,
        duracao_consulta_padrao: m.duracao_consulta_inicial || 30,
        duracao_consulta_inicial: m.duracao_consulta_inicial,
        aceita_teleconsulta: m.aceita_teleconsulta,
        aceita_consulta_presencial: m.aceita_consulta_presencial,
        ativo: m.is_active,
        cidade: m.cidade,
        estado: m.estado,
        created_at: m.created_at
      }));

      return doctors;
    } catch (error: any) {
      console.error('❌ Erro fatal na busca de médicos:', error);
      throw error;
    }
  }

  // ========= BUSCA DE HORÁRIOS DISPONÍVEIS =========
  
  static async getAvailableSlots(
    medicoId: string,
    dataInicio: string,
    dataFim: string,
    tipoConsulta?: 'presencial' | 'teleconsulta'
  ): Promise<AvailableSlot[]> {
    
    // 1. Buscar horários de disponibilidade do médico
    let horariosQuery = supabase
      .from('horarios_disponibilidade')
      .select(`
        *,
        locais_atendimento(*)
      `)
      .eq('medico_id', medicoId)
      .eq('ativo', true);

    if (tipoConsulta) {
      horariosQuery = horariosQuery.eq('tipo_consulta', tipoConsulta);
    }

    const { data: horarios, error: horariosError } = await horariosQuery;

    if (horariosError) {
      throw new Error(`Erro ao buscar horários: ${horariosError.message}`);
    }

    if (!horarios || horarios.length === 0) {
      return [];
    }

    // 2. Buscar consultas já agendadas no período
    const { data: consultasAgendadas, error: consultasError } = await supabase
      .from('consultas')
      .select('data_hora_agendada, duracao_estimada')
      .eq('medico_id', medicoId)
      .gte('data_hora_agendada', dataInicio)
      .lte('data_hora_agendada', dataFim)
      .in('status', ['agendada', 'confirmada']);

    if (consultasError) {
      throw new Error(`Erro ao buscar consultas: ${consultasError.message}`);
    }

    // 3. Buscar dados do médico para valores
    const { data: medico, error: medicoError } = await supabase
      .from('medicos')
      .select('valor_consulta_presencial, valor_consulta_teleconsulta')
      .eq('id', medicoId)
      .single();

    if (medicoError) {
      throw new Error(`Erro ao buscar médico: ${medicoError.message}`);
    }

    // 4. Gerar slots disponíveis
    const slots: AvailableSlot[] = [];
    const dataAtual = new Date(dataInicio);
    const dataFinal = new Date(dataFim);

    while (dataAtual <= dataFinal) {
      const diaSemana = dataAtual.getDay();
      
      // Encontrar horários para este dia da semana
      const horariosHoje = horarios.filter(h => h.dia_semana === diaSemana);
      
      for (const horario of horariosHoje) {
        const horaInicio = new Date(`${dataAtual.toISOString().split('T')[0]}T${horario.hora_inicio}`);
        const horaFim = new Date(`${dataAtual.toISOString().split('T')[0]}T${horario.hora_fim}`);
        
        let horaAtual = new Date(horaInicio);
        
        while (horaAtual < horaFim) {
          const slotDateTime = horaAtual.toISOString();
          
          // Verificar se não há conflito com consultas agendadas
          const temConflito = consultasAgendadas?.some(consulta => {
            const inicioConsulta = new Date(consulta.data_hora_agendada);
            const fimConsulta = new Date(inicioConsulta.getTime() + consulta.duracao_estimada * 60000);
            return horaAtual >= inicioConsulta && horaAtual < fimConsulta;
          });

          if (!temConflito && horaAtual > new Date()) {
            slots.push({
              data_hora: slotDateTime,
              duracao_disponivel: horario.intervalo_consultas,
              local_id: horario.local_id,
              tipo_consulta: horario.tipo_consulta,
              valor: horario.tipo_consulta === 'presencial' 
                ? medico?.valor_consulta_presencial || 0
                : medico?.valor_consulta_teleconsulta || 0
            });
          }
          
          horaAtual = new Date(horaAtual.getTime() + horario.intervalo_consultas * 60000);
        }
      }
      
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return slots.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  }

  // ========= AGENDAR CONSULTA =========
  
  static async scheduleAppointment(appointmentData: {
    medico_id: string;
    paciente_id: string;
    local_id?: string;
    data_hora_agendada: string;
    duracao_estimada: number;
    tipo: 'presencial' | 'teleconsulta';
    valor_consulta: number;
    motivo_consulta?: string;
    agendado_por: string;
  }): Promise<Appointment> {
    
    // Verificar se o slot ainda está disponível
    const { data: conflito } = await supabase
      .from('consultas')
      .select('id')
      .eq('medico_id', appointmentData.medico_id)
      .eq('data_hora_agendada', appointmentData.data_hora_agendada)
      .in('status', ['agendada', 'confirmada'])
      .single();

    if (conflito) {
      throw new Error('Este horário não está mais disponível');
    }

    const { data, error } = await supabase
      .from('consultas')
      .insert([appointmentData])
      .select(`
        *,
        medicos(*),
        pacientes(*),
        locais_atendimento(*)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao agendar consulta: ${error.message}`);
    }

    return data;
  }

  // ========= LISTAR CONSULTAS =========
  
  static async getAppointments(filters: {
    medico_id?: string;
    paciente_id?: string;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  } = {}): Promise<Appointment[]> {
    
    let query = supabase
      .from('consultas')
      .select(`
        *,
        medicos(*),
        pacientes(*),
        locais_atendimento(*)
      `);

    if (filters.medico_id) {
      query = query.eq('medico_id', filters.medico_id);
    }

    if (filters.paciente_id) {
      query = query.eq('paciente_id', filters.paciente_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.data_inicio) {
      query = query.gte('data_hora_agendada', filters.data_inicio);
    }

    if (filters.data_fim) {
      query = query.lte('data_hora_agendada', filters.data_fim);
    }

    const { data, error } = await query.order('data_hora_agendada');

    if (error) {
      throw new Error(`Erro ao buscar consultas: ${error.message}`);
    }

    return data || [];
  }

  // ========= CANCELAR CONSULTA =========
  
  static async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('consultas')
      .update({ 
        status: 'cancelada',
        observacoes_medico: reason 
      })
      .eq('id', appointmentId);

    if (error) {
      throw new Error(`Erro ao cancelar consulta: ${error.message}`);
    }
  }

  // ========= BUSCAR ESPECIALIDADES =========
  
  static async getSpecialties(): Promise<string[]> {
    const { data, error } = await supabase
      .from('medicos')
      .select('especialidade')
      .eq('ativo', true);

    if (error) {
      throw new Error(`Erro ao buscar especialidades: ${error.message}`);
    }

    const especialidades = [...new Set(data?.map(m => m.especialidade) || [])];
    return especialidades.sort();
  }

  // ========= BUSCAR CIDADES =========
  
  static async getCities(estado?: string): Promise<string[]> {
    let query = supabase
      .from('locais_atendimento')
      .select('cidade')
      .eq('ativo', true);

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar cidades: ${error.message}`);
    }

    const cidades = [...new Set(data?.map(l => l.cidade) || [])];
    return cidades.sort();
  }

  // ========= BUSCAR ESTADOS =========
  
  static async getStates(): Promise<string[]> {
    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('estado')
      .eq('ativo', true);

    if (error) {
      throw new Error(`Erro ao buscar estados: ${error.message}`);
    }

    const estados = [...new Set(data?.map(l => l.estado) || [])];
    return estados.sort();
  }

  // ========= BUSCAR MÉDICOS COM FILTROS =========
  
  static async searchDoctorsWithFilters(filters: SearchFilters): Promise<Doctor[]> {
    let query = supabase
      .from('medicos')
      .select(`
        *,
        profiles!inner(display_name, email)
      `);

    // Filtro por especialidade
    if (filters.especialidade) {
      query = query.contains('especialidades', [filters.especialidade]);
    }

    // Filtro por tipo de consulta - usar colunas que existem
    if (filters.tipo_consulta === 'teleconsulta') {
      // Assumir que médicos que aceitam teleconsulta têm valor_consulta definido
      query = query.not('valor_consulta', 'is', null);
    } else if (filters.tipo_consulta === 'presencial') {
      // Para consultas presenciais, verificar se há locais de atendimento
      const { data: locais } = await supabase
        .from('locais_atendimento')
        .select('medico_id')
        .eq('ativo', true);
      
      if (locais && locais.length > 0) {
        const medicoIds = locais.map(l => l.medico_id);
        query = query.in('user_id', medicoIds);
      } else {
        return [];
      }
    }

    // Filtro por localização (se presencial)
    if (filters.cidade || filters.estado) {
      let locaisQuery = supabase
        .from('locais_atendimento')
        .select('medico_id')
        .eq('ativo', true);

      if (filters.cidade) {
        locaisQuery = locaisQuery.ilike('cidade', `%${filters.cidade}%`);
      }
      if (filters.estado) {
        locaisQuery = locaisQuery.eq('estado', filters.estado);
      }

      const { data: locais } = await locaisQuery;

      if (locais && locais.length > 0) {
        const medicoIds = locais.map(l => l.medico_id);
        query = query.in('user_id', medicoIds);
      } else {
        // Se não há locais que atendem aos critérios, retorna array vazio
        return [];
      }
    }

    // Filtro por valor máximo
    if (filters.valor_maximo) {
      query = query.lte('valor_consulta', filters.valor_maximo);
    }

    const { data, error } = await query.order('crm');

    if (error) {
      throw new Error(`Erro ao buscar médicos: ${error.message}`);
    }

    // Mapear dados para o formato correto
    return data?.map(medico => ({
      ...medico,
      id: medico.id || medico.user_id,
      user_id: medico.user_id,
      nome: medico.profiles?.display_name || '',
      email: medico.profiles?.email || '',
      especialidade: Array.isArray(medico.especialidades) ? medico.especialidades.join(', ') : '',
      ativo: true, // Assumir ativo se retornado pela query
      aceita_teleconsulta: !!medico.valor_consulta,
      aceita_consulta_presencial: true, // Assumir que aceita presencial se tem locais
      valor_consulta_presencial: medico.valor_consulta,
      valor_consulta_teleconsulta: medico.valor_consulta,
      duracao_consulta_padrao: 30, // Valor padrão
      created_at: medico.created_at || new Date().toISOString()
    })) || [];
  }

  // ========= DISPONIBILIDADE =========
  
  static async getDoctorAvailability(
    doctorId: string,
    startDate: string,
    endDate: string,
    consultationType?: 'presencial' | 'teleconsulta'
  ): Promise<AvailableSlot[]> {
    
    // 1. Buscar horários de funcionamento
    const { data: workingHours } = await supabase
      .from('horarios_funcionamento')
      .select(`
        *,
        locais_atendimento(*)
      `)
      .eq('medico_id', doctorId)
      .eq('ativo', true)
      .modify((query) => {
        if (consultationType) {
          query.or(`tipo_consulta.eq.${consultationType},tipo_consulta.is.null`);
        }
      });

    // 2. Buscar consultas já agendadas
    const { data: existingAppointments } = await supabase
      .from('consultas')
      .select('data_hora_agendada, duracao_estimada, buffer_antes, buffer_depois')
      .eq('medico_id', doctorId)
      .gte('data_hora_agendada', startDate)
      .lte('data_hora_agendada', endDate)
      .in('status', ['agendada', 'confirmada', 'em_andamento']);

    // 3. Buscar bloqueios
    const { data: blocks } = await supabase
      .from('bloqueios_agenda')
      .select('data_inicio, data_fim')
      .eq('medico_id', doctorId)
      .eq('ativo', true)
      .or(`data_inicio.lte.${endDate},data_fim.gte.${startDate}`);

    // 4. Buscar dados do médico para durações e valores
    const { data: doctor } = await supabase
      .from('medicos')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (!doctor || !workingHours) return [];

    // 5. Gerar slots disponíveis
    const availableSlots: AvailableSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Verificar se há horário de funcionamento para este dia
      const dayWorkingHours = workingHours?.filter(wh => wh.dia_semana === dayOfWeek) || [];
      
      for (const workingHour of dayWorkingHours) {
        const slots = this.generateSlotsForDay(
          date,
          workingHour,
          existingAppointments || [],
          blocks || [],
          doctor,
          consultationType
        );
        availableSlots.push(...slots);
      }
    }

    return availableSlots.sort((a, b) => 
      new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );
  }

  private static generateSlotsForDay(
    date: Date,
    workingHour: any,
    existingAppointments: any[],
    blocks: any[],
    doctor: any,
    consultationType?: string
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    
    // Configurar horários do dia
    const startTime = new Date(date);
    const [startHour, startMinute] = workingHour.hora_inicio.split(':');
    startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const endTime = new Date(date);
    const [endHour, endMinute] = workingHour.hora_fim.split(':');
    endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Determinar duração do slot baseado no tipo de consulta
    const slotDuration = consultationType === 'teleconsulta' 
      ? doctor.duracao_teleconsulta 
      : doctor.duracao_consulta_padrao;

    // Gerar slots de 15 em 15 minutos
    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 15)) {
      const slotEnd = new Date(time.getTime() + slotDuration * 60000);
      
      // Verificar se o slot cabe no horário de funcionamento
      if (slotEnd > endTime) break;

      // Verificar conflitos com consultas existentes
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.data_hora_agendada);
        const aptEnd = new Date(aptStart.getTime() + 
          (apt.duracao_estimada + apt.buffer_antes + apt.buffer_depois) * 60000);
        
        return (time < aptEnd && slotEnd > aptStart);
      });

      // Verificar bloqueios
      const isBlocked = blocks.some(block => {
        const blockStart = new Date(block.data_inicio);
        const blockEnd = new Date(block.data_fim);
        return (time >= blockStart && time < blockEnd);
      });

      if (!hasConflict && !isBlocked) {
        // Determinar valor baseado no tipo de consulta
        const valor = consultationType === 'teleconsulta'
          ? doctor.valor_consulta_teleconsulta
          : doctor.valor_consulta_presencial;

        slots.push({
          data_hora: time.toISOString(),
          duracao_disponivel: slotDuration,
          local_id: workingHour.local_id,
          tipo_consulta: consultationType || workingHour.tipo_consulta || 'presencial',
          valor: valor || 0
        });
      }
    }

    return slots;
  }

  // ========= AGENDAMENTO =========
  
  static async createAppointment(appointmentData: {
    medico_id: string;
    paciente_id: string;
    data_hora_agendada: string;
    tipo: 'presencial' | 'teleconsulta';
    local_id?: string;
    motivo_consulta?: string;
    observacoes_paciente?: string;
    prioridade?: 'baixa' | 'normal' | 'alta' | 'emergencia';
    agendado_por: string;
  }): Promise<Appointment> {
    
    // 1. Buscar dados do médico para durações
    const { data: doctor } = await supabase
      .from('medicos')
      .select('*')
      .eq('id', appointmentData.medico_id)
      .single();

    if (!doctor) throw new Error('Médico não encontrado');

    // 2. Determinar duração baseada no tipo
    const duracao_estimada = appointmentData.tipo === 'teleconsulta'
      ? doctor.duracao_teleconsulta
      : doctor.duracao_consulta_padrao;

    // 3. Verificar disponibilidade
    const isAvailable = await this.checkSlotAvailability(
      appointmentData.medico_id,
      appointmentData.data_hora_agendada,
      duracao_estimada
    );

    if (!isAvailable) {
      throw new Error('Horário não disponível');
    }

    // 4. Criar consulta
    const consultaData = {
      ...appointmentData,
      duracao_estimada,
      valor_consulta: appointmentData.tipo === 'teleconsulta'
        ? doctor.valor_consulta_teleconsulta
        : doctor.valor_consulta_presencial,
      buffer_antes: 5,
      buffer_depois: 5,
      permite_reagendamento: true,
      status: 'agendada' as const
    };

    const { data, error } = await supabase
      .from('consultas')
      .insert(consultaData)
      .select(`
        *,
        medicos!inner(*, usuarios!inner(nome, email)),
        pacientes!inner(*, usuarios!inner(nome, email)),
        locais_atendimento(*)
      `)
      .single();

    if (error) throw error;

    // 5. Criar notificações
    await this.createAppointmentNotifications(data.id);

    return this.formatAppointmentResponse(data);
  }

  private static async checkSlotAvailability(
    doctorId: string,
    dateTime: string,
    duration: number
  ): Promise<boolean> {
    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const { data: conflicts } = await supabase
      .from('consultas')
      .select('id')
      .eq('medico_id', doctorId)
      .in('status', ['agendada', 'confirmada', 'em_andamento'])
      .or(`
        and(data_hora_agendada.lt.${endTime.toISOString()},
            data_hora_agendada.gte.${startTime.toISOString()}),
        and(data_hora_agendada.lt.${startTime.toISOString()},
            data_hora_agendada.gte.${endTime.toISOString()})
      `);

    return !conflicts || conflicts.length === 0;
  }

  // ========= GESTÃO DE CONSULTAS =========
  
  static async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('consultas')
      .select(`
        *,
        medicos!inner(*, usuarios!inner(nome, email)),
        locais_atendimento(*)
      `)
      .eq('paciente_id', patientId)
      .order('data_hora_agendada', { ascending: true });

    if (error) throw error;

    return data?.map(this.formatAppointmentResponse) || [];
  }

  static async getDoctorAppointments(
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Appointment[]> {
    let query = supabase
      .from('consultas')
      .select(`
        *,
        pacientes!inner(*, usuarios!inner(nome, email)),
        locais_atendimento(*)
      `)
      .eq('medico_id', doctorId);

    if (startDate) query = query.gte('data_hora_agendada', startDate);
    if (endDate) query = query.lte('data_hora_agendada', endDate);

    const { data, error } = await query.order('data_hora_agendada', { ascending: true });

    if (error) throw error;

    return data?.map(this.formatAppointmentResponse) || [];
  }

  static async updateAppointmentStatus(
    appointmentId: string,
    status: Appointment['status'],
    observations?: string
  ): Promise<Appointment> {
    const updateData: any = { status };
    
    if (status === 'em_andamento') {
      updateData.data_hora_inicio_real = new Date().toISOString();
    } else if (status === 'realizada') {
      updateData.data_hora_fim_real = new Date().toISOString();
      if (observations) {
        updateData.observacoes_medico = observations;
      }
    }

    const { data, error } = await supabase
      .from('consultas')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        medicos!inner(*, usuarios!inner(nome, email)),
        pacientes!inner(*, usuarios!inner(nome, email)),
        locais_atendimento(*)
      `)
      .single();

    if (error) throw error;

    return this.formatAppointmentResponse(data);
  }

  // ========= REAGENDAMENTO =========
  
  static async rescheduleAppointment(
    appointmentId: string,
    newDateTime: string,
    reason?: string
  ): Promise<Appointment> {
    
    // 1. Buscar consulta atual
    const { data: currentAppointment } = await supabase
      .from('consultas')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (!currentAppointment) throw new Error('Consulta não encontrada');

    // 2. Verificar se permite reagendamento
    if (!currentAppointment.permite_reagendamento) {
      throw new Error('Esta consulta não permite reagendamento');
    }

    // 3. Verificar disponibilidade do novo horário
    const isAvailable = await this.checkSlotAvailability(
      currentAppointment.medico_id,
      newDateTime,
      currentAppointment.duracao_estimada
    );

    if (!isAvailable) {
      throw new Error('Novo horário não disponível');
    }

    // 4. Registrar histórico
    await supabase
      .from('historico_reagendamentos')
      .insert({
        consulta_id: appointmentId,
        data_hora_anterior: currentAppointment.data_hora_agendada,
        data_hora_nova: newDateTime,
        motivo: reason,
        reagendado_por: currentAppointment.agendado_por
      });

    // 5. Atualizar consulta
    const { data, error } = await supabase
      .from('consultas')
      .update({
        data_hora_agendada: newDateTime,
        status: 'reagendada'
      })
      .eq('id', appointmentId)
      .select(`
        *,
        medicos!inner(*, usuarios!inner(nome, email)),
        pacientes!inner(*, usuarios!inner(nome, email)),
        locais_atendimento(*)
      `)
      .single();

    if (error) throw error;

    return this.formatAppointmentResponse(data);
  }

  // ========= NOTIFICAÇÕES =========
  
  private static async createAppointmentNotifications(appointmentId: string): Promise<void> {
    const { data: appointment } = await supabase
      .from('consultas')
      .select(`
        *,
        pacientes!inner(usuario_id),
        medicos!inner(usuario_id)
      `)
      .eq('id', appointmentId)
      .single();

    if (!appointment) return;

    const appointmentDate = new Date(appointment.data_hora_agendada);
    
    // Notificações para o paciente
    const notifications = [
      {
        usuario_id: appointment.pacientes.usuario_id,
        consulta_id: appointmentId,
        tipo: 'confirmacao' as const,
        titulo: 'Consulta Agendada',
        mensagem: `Sua consulta foi agendada para ${appointmentDate.toLocaleString('pt-BR')}`,
        enviar_em: new Date().toISOString()
      },
      {
        usuario_id: appointment.pacientes.usuario_id,
        consulta_id: appointmentId,
        tipo: 'lembrete' as const,
        titulo: 'Lembrete: Consulta Amanhã',
        mensagem: `Você tem uma consulta agendada para amanhã às ${appointmentDate.toLocaleTimeString('pt-BR')}`,
        enviar_em: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        usuario_id: appointment.pacientes.usuario_id,
        consulta_id: appointmentId,
        tipo: 'lembrete' as const,
        titulo: 'Lembrete: Consulta em 2 horas',
        mensagem: `Sua consulta está marcada para daqui a 2 horas`,
        enviar_em: new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    await supabase.from('notificacoes').insert(notifications);
  }

  // ========= UTILITÁRIOS =========
  
  private static formatAppointmentResponse(data: any): Appointment {
    return {
      ...data,
      medico: data.medicos ? {
        ...data.medicos,
        nome: data.medicos.usuarios?.nome,
        email: data.medicos.usuarios?.email
      } : undefined,
      paciente: data.pacientes ? {
        ...data.pacientes,
        nome: data.pacientes.usuarios?.nome,
        email: data.pacientes.usuarios?.email
      } : undefined,
      local: data.locais_atendimento || undefined
    };
  }

  // ========= CONFIGURAÇÕES DO MÉDICO =========
  
  static async updateDoctorScheduleSettings(
    doctorId: string,
    settings: {
      duracao_consulta_padrao?: number;
      duracao_consulta_inicial?: number;
      duracao_teleconsulta?: number;
      valor_consulta_presencial?: number;
      valor_consulta_teleconsulta?: number;
      aceita_teleconsulta?: boolean;
      aceita_consulta_presencial?: boolean;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('medicos')
      .update(settings)
      .eq('id', doctorId);

    if (error) throw error;
  }

  static async addWorkingHours(workingHours: Omit<WorkingHours, 'id'>): Promise<WorkingHours> {
    const { data, error } = await supabase
      .from('horarios_funcionamento')
      .insert(workingHours)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addAttendanceLocation(location: Omit<AttendanceLocation, 'id'>): Promise<AttendanceLocation> {
    const { data, error } = await supabase
      .from('locais_atendimento')
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default SchedulingService;