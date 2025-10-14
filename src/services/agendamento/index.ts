/**
 * Serviço unificado de agendamento
 * Substitui schedulingService.ts, realTimeScheduler.ts e outros serviços legados
 */

import { supabase } from '@/integrations/supabase/client';
import { validateUUID } from '@/utils/uuid';
import type { Medico, LocalAtendimento, Consulta, CriarConsultaInput } from './types';

class AgendamentoService {
  /**
   * Buscar médicos por especialidade, estado e cidade
   */
  async buscarMedicos(
    especialidade?: string,
    estado?: string,
    cidade?: string
  ): Promise<Medico[]> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase.rpc('get_doctors_by_location_and_specialty', {
      p_specialty: especialidade || null,
      p_state: estado || null,
      p_city: cidade || null
    });

    if (error) throw error;

    return (data || []).map((doc: any) => ({
      id: doc.id,
      display_name: doc.display_name,
      especialidades: Array.isArray(doc.especialidades) 
        ? doc.especialidades 
        : [],
      crm: doc.crm,
      foto_perfil_url: doc.foto_perfil_url,
      rating: doc.rating,
      total_avaliacoes: doc.total_avaliacoes,
      aceita_teleconsulta: doc.aceita_teleconsulta,
      aceita_consulta_presencial: doc.aceita_consulta_presencial,
      valor_consulta_presencial: doc.valor_consulta_presencial,
      valor_consulta_teleconsulta: doc.valor_consulta_teleconsulta
    }));
  }

  /**
   * Buscar horários disponíveis para um médico em uma data
   */
  async buscarHorarios(
    medicoId: string,
    data: string
  ): Promise<LocalAtendimento[]> {
    if (!supabase) throw new Error('Supabase não configurado');
    
    const medicoIdValidado = validateUUID(medicoId, 'ID do médico');
    const dataObj = new Date(data);
    const diaSemana = dataObj.getDay();

    // Buscar locais de atendimento
    const { data: locais, error: locaisError } = await supabase
      .from('locais_atendimento')
      .select('*')
      .eq('medico_id', medicoIdValidado)
      .eq('ativo', true);

    if (locaisError) throw locaisError;

    // Buscar horários configurados
    const { data: horarios, error: horariosError } = await supabase
      .from('horarios_disponibilidade')
      .select('*')
      .eq('medico_id', medicoIdValidado)
      .eq('dia_semana', diaSemana)
      .eq('ativo', true);

    if (horariosError) throw horariosError;

    // Buscar consultas agendadas para a data
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);

    const { data: consultasAgendadas, error: consultasError } = await supabase
      .from('consultas')
      .select('consultation_date')
      .eq('medico_id', medicoIdValidado)
      .gte('consultation_date', dataInicio.toISOString())
      .lte('consultation_date', dataFim.toISOString())
      .in('status', ['pending', 'agendada', 'confirmada']);

    if (consultasError) throw consultasError;

    const horariosOcupados = new Set(
      (consultasAgendadas || []).map((c: any) => {
        const dt = new Date(c.consultation_date);
        return `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
      })
    );

    // Montar resposta
    return (locais || []).map((local: any) => {
      const horariosDoLocal = (horarios || []).filter((h: any) => 
        !h.local_id || h.local_id === local.id
      );

      const horariosDisponiveis = horariosDoLocal.flatMap((h: any) => {
        const slots: any[] = [];
        const [horaInicio, minInicio] = h.hora_inicio.split(':').map(Number);
        const [horaFim, minFim] = h.hora_fim.split(':').map(Number);
        
        let horaAtual = horaInicio * 60 + minInicio;
        const horaFimMin = horaFim * 60 + minFim;
        const intervalo = h.intervalo_minutos || 30;

        while (horaAtual < horaFimMin) {
          const hora = Math.floor(horaAtual / 60);
          const min = horaAtual % 60;
          const timeStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          
          slots.push({
            time: timeStr,
            available: !horariosOcupados.has(timeStr),
            tipo: h.tipo_consulta
          });

          horaAtual += intervalo;
        }

        return slots;
      });

      return {
        id: local.id,
        nome_local: local.nome_local,
        endereco: typeof local.endereco === 'object' ? local.endereco : {},
        horarios_disponiveis: horariosDisponiveis
      };
    });
  }

  /**
   * Criar uma nova consulta
   */
  async criarConsulta(input: CriarConsultaInput): Promise<Consulta> {
    if (!supabase) throw new Error('Supabase não configurado');

    const medicoIdValidado = validateUUID(input.medico_id, 'ID do médico');
    const pacienteIdValidado = validateUUID(input.paciente_id, 'ID do paciente');

    const { data, error } = await supabase
      .from('consultas')
      .insert({
        medico_id: medicoIdValidado,
        paciente_id: pacienteIdValidado,
        consultation_date: input.consultation_date,
        consultation_type: input.consultation_type,
        status: 'pending',
        status_pagamento: 'pendente',
        notes: input.notes
      })
      .select()
      .single();

    if (error) throw error;
    return data as Consulta;
  }

  /**
   * Listar consultas de um paciente
   */
  async listarConsultas(pacienteId: string): Promise<Consulta[]> {
    if (!supabase) throw new Error('Supabase não configurado');

    const pacienteIdValidado = validateUUID(pacienteId, 'ID do paciente');

    const { data, error } = await supabase
      .from('consultas')
      .select(`
        *,
        medico:profiles!consultas_medico_id_fkey(display_name)
      `)
      .eq('paciente_id', pacienteIdValidado)
      .order('consultation_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Consulta[];
  }

  /**
   * Buscar estados disponíveis
   */
  async buscarEstados(): Promise<Array<{ uf: string; nome: string }>> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('estado')
      .eq('ativo', true)
      .eq('status', 'ativo');

    if (error) throw error;

    const estados = [...new Set((data || []).map((l: any) => l.estado))];
    return estados.map(uf => ({ uf, nome: uf }));
  }

  /**
   * Buscar cidades de um estado
   */
  async buscarCidades(estado: string): Promise<Array<{ cidade: string }>> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('cidade')
      .eq('estado', estado)
      .eq('ativo', true)
      .eq('status', 'ativo');

    if (error) throw error;

    const cidades = [...new Set((data || []).map((l: any) => l.cidade))];
    return cidades.map(cidade => ({ cidade }));
  }

  /**
   * Buscar especialidades
   */
  async buscarEspecialidades(): Promise<string[]> {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
      .from('especialidades_medicas')
      .select('nome')
      .eq('ativa', true)
      .order('nome');

    if (error) throw error;
    return (data || []).map((e: any) => e.nome);
  }
}

export const agendamentoService = new AgendamentoService();
export default agendamentoService;
