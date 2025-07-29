import { supabase } from "@/integrations/supabase/client";

export const videoCallService = {
  /**
   * Cria ou retorna uma sala de vídeo existente para uma consulta
   */
  async createOrUpdateVideoRoom(consultaId: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const { data: consultation, error } = await supabase
        .from('consultas')
        .select('notes, consultation_type')
        .eq('id', consultaId)
        .single();

      if (error) {
        console.error('Erro ao buscar consulta:', error);
        return { success: false, error: error.message };
      }

      // Check if room ID is already stored in notes
      const existingRoomId = consultation.notes?.match(/room_[a-zA-Z0-9_]+/)?.[0];
      if (existingRoomId) {
        return { success: true, roomId: existingRoomId };
      }

      // Cria uma nova sala de vídeo
      const roomId = `room_${consultaId}_${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('consultas')
        .update({ 
          notes: `${consultation.notes || ''} Video Room ID: ${roomId}`,
          consultation_type: 'Online' 
        })
        .eq('id', consultaId);

      if (updateError) {
        console.error('Erro ao atualizar consulta:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, roomId };
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error: 'Erro inesperado ao criar sala de vídeo' };
    }
  },

  /**
   * Busca uma sala de vídeo existente
   */
  async getVideoRoom(consultaId: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const { data: consultation, error } = await supabase
        .from('consultas')
        .select('notes')
        .eq('id', consultaId)
        .single();

      if (error) {
        console.error('Erro ao buscar consulta:', error);
        return { success: false, error: error.message };
      }

      const roomId = consultation.notes?.match(/room_[a-zA-Z0-9_]+/)?.[0];
      return { success: true, roomId };
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error: 'Erro inesperado ao buscar sala de vídeo' };
    }
  },

  /**
   * Converte uma consulta para videochamada
   */
  async convertToVideoConsultation(consultaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const roomId = `room_${consultaId}_${Date.now()}`;

      const { error: updateError } = await supabase
        .from('consultas')
        .update({ 
          notes: `Video Room ID: ${roomId}`,
          consultation_type: 'Online' 
        })
        .eq('id', consultaId);

      if (updateError) {
        console.error('Erro ao converter consulta:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error: 'Erro inesperado ao converter consulta' };
    }
  },

  /**
   * Verifica se um usuário pode acessar uma sala de vídeo
   */
  async canAccessVideoRoom(consultaId: string, userId: string): Promise<{ success: boolean; canAccess?: boolean; error?: string }> {
    try {
      const { data: consultation, error } = await supabase
        .from('consultas')
        .select('paciente_id, medico_id')
        .eq('id', consultaId)
        .single();

      if (error) {
        console.error('Erro ao verificar acesso:', error);
        return { success: false, error: error.message };
      }

      const canAccess = consultation.paciente_id === userId || consultation.medico_id === userId;
      return { success: true, canAccess };
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error: 'Erro inesperado ao verificar acesso' };
    }
  },

  /**
   * Busca consultas de videochamada de um usuário
   */
  async getUserVideoConsultations(userId: string): Promise<{ success: boolean; consultations?: any[]; error?: string }> {
    try {
      const { data: consultations, error } = await supabase
        .from('consultas')
        .select(`
          id,
          consultation_date,
          consultation_type,
          status,
          notes,
          medico:medicos!inner(user_id, dados_profissionais),
          paciente:profiles!consultas_paciente_id_fkey(id, display_name, email)
        `)
        .or(`paciente_id.eq.${userId},medico_id.eq.${userId}`)
        .eq('consultation_type', 'Online')
        .order('consultation_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar consultas:', error);
        return { success: false, error: error.message };
      }

      return { success: true, consultations };
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error: 'Erro inesperado ao buscar consultas' };
    }
  }
};