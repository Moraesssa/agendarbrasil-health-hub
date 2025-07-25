import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export const videoCallService = {
  // Cria ou atualiza o room ID para uma consulta
  async createOrUpdateVideoRoom(consultaId: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      // Primeiro, verifica se a consulta já tem um room ID
      const { data: consulta, error: fetchError } = await supabase
        .from('consultas')
        .select('video_room_id, tipo_consulta')
        .eq('id', consultaId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Se já tem room ID, retorna o existente
      if (consulta.video_room_id) {
        return { success: true, roomId: consulta.video_room_id };
      }

      // Gera um novo room ID único
      const roomId = `room_${uuidv4().replace(/-/g, '_')}`;

      // Atualiza a consulta com o novo room ID
      const { error: updateError } = await supabase
        .from('consultas')
        .update({ 
          video_room_id: roomId,
          tipo_consulta: consulta.tipo_consulta || 'Online' // Garante que seja marcada como online
        })
        .eq('id', consultaId);

      if (updateError) {
        throw updateError;
      }

      return { success: true, roomId };
    } catch (error) {
      console.error('Erro ao criar sala de vídeo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  },

  // Busca o room ID de uma consulta
  async getVideoRoom(consultaId: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const { data: consulta, error } = await supabase
        .from('consultas')
        .select('video_room_id')
        .eq('id', consultaId)
        .single();

      if (error) {
        throw error;
      }

      if (!consulta.video_room_id) {
        return { success: false, error: 'Sala de vídeo não encontrada' };
      }

      return { success: true, roomId: consulta.video_room_id };
    } catch (error) {
      console.error('Erro ao buscar sala de vídeo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  },

  // Marca uma consulta como sendo do tipo "Online" (videochamada)
  async convertToVideoConsultation(consultaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ 
          tipo_consulta: 'Online',
          video_room_id: `room_${uuidv4().replace(/-/g, '_')}`
        })
        .eq('id', consultaId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao converter para videoconsulta:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  },

  // Verifica se o usuário pode acessar a sala de vídeo (segurança)
  async canAccessVideoRoom(consultaId: string, userId: string): Promise<{ success: boolean; canAccess?: boolean; error?: string }> {
    try {
      const { data: consulta, error } = await supabase
        .from('consultas')
        .select('paciente_id, medico_id, agendado_por, paciente_familiar_id')
        .eq('id', consultaId)
        .single();

      if (error) {
        throw error;
      }

      // Verifica se o usuário é o paciente, médico, ou quem agendou
      const canAccess = 
        consulta.paciente_id === userId ||
        consulta.medico_id === userId ||
        consulta.agendado_por === userId ||
        consulta.paciente_familiar_id === userId;

      return { success: true, canAccess };
    } catch (error) {
      console.error('Erro ao verificar acesso à sala:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  },

  // Lista todas as consultas online (videochamadas) do usuário
  async getUserVideoConsultations(userId: string): Promise<{ success: boolean; consultations?: any[]; error?: string }> {
    try {
      const { data: consultations, error } = await supabase
        .from('consultas')
        .select(`
          id,
          data_consulta,
          tipo_consulta,
          video_room_id,
          status,
          medico_id,
          paciente_id,
          profiles!consultas_medico_id_fkey(display_name),
          profiles!consultas_paciente_id_fkey(display_name)
        `)
        .or(`paciente_id.eq.${userId},medico_id.eq.${userId},agendado_por.eq.${userId}`)
        .eq('tipo_consulta', 'Online')
        .order('data_consulta', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, consultations };
    } catch (error) {
      console.error('Erro ao buscar videoconsultas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
};