import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Encaminhamento {
  id: string;
  paciente_id: string;
  medico_origem_id: string;
  medico_destino_id?: string;
  especialidade: string;
  motivo: string;
  status: 'aguardando' | 'aceito' | 'rejeitado' | 'realizado';
  observacoes?: string;
  data_encaminhamento: string;
  data_resposta?: string;
  created_at: string;
  updated_at: string;
  paciente?: {
    display_name: string;
  };
  medico_origem?: {
    display_name: string;
  };
  medico_destino?: {
    display_name: string;
  };
}

export interface CreateEncaminhamentoData {
  paciente_id: string;
  medico_destino_id?: string;
  especialidade: string;
  motivo: string;
  observacoes?: string;
}

export interface UpdateEncaminhamentoData {
  status?: 'aceito' | 'rejeitado' | 'realizado';
  observacoes?: string;
  medico_destino_id?: string;
}

export const encaminhamentoService = {
  /**
   * Busca encaminhamentos enviados pelo médico atual
   */
  async getEncaminhamentosEnviados(medicoId: string): Promise<Encaminhamento[]> {
    logger.info("Buscando encaminhamentos enviados", "encaminhamentoService", { medicoId });

    try {
      const { data, error } = await supabase
        .from('encaminhamentos')
        .select(`
          *,
          paciente:profiles!encaminhamentos_paciente_id_fkey(display_name),
          medico_destino:profiles!encaminhamentos_medico_destino_id_fkey(display_name)
        `)
        .eq('medico_origem_id', medicoId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar encaminhamentos enviados: ${error.message}`);
      }

      return (data || []).map(item => ({
        ...item,
        paciente: item.paciente || { display_name: 'Nome não disponível' },
        medico_destino: item.medico_destino || { display_name: 'Nome não disponível' }
      })) as Encaminhamento[];
    } catch (error) {
      logger.error("Falha ao buscar encaminhamentos enviados", "encaminhamentoService", error);
      throw error;
    }
  },

  /**
   * Busca encaminhamentos recebidos pelo médico atual
   */
  async getEncaminhamentosRecebidos(medicoId: string): Promise<Encaminhamento[]> {
    logger.info("Buscando encaminhamentos recebidos", "encaminhamentoService", { medicoId });

    try {
      const { data, error } = await supabase
        .from('encaminhamentos')
        .select(`
          *,
          paciente:profiles!encaminhamentos_paciente_id_fkey(display_name),
          medico_origem:profiles!encaminhamentos_medico_origem_id_fkey(display_name)
        `)
        .eq('medico_destino_id', medicoId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar encaminhamentos recebidos: ${error.message}`);
      }

      return (data || []).map(item => ({
        ...item,
        paciente: item.paciente || { display_name: 'Nome não disponível' },
        medico_origem: item.medico_origem || { display_name: 'Nome não disponível' }
      })) as Encaminhamento[];
    } catch (error) {
      logger.error("Falha ao buscar encaminhamentos recebidos", "encaminhamentoService", error);
      throw error;
    }
  },

  /**
   * Busca encaminhamentos por especialidade (para médicos que atendem essa especialidade)
   */
  async getEncaminhamentosPorEspecialidade(especialidade: string): Promise<Encaminhamento[]> {
    logger.info("Buscando encaminhamentos por especialidade", "encaminhamentoService", { especialidade });

    try {
      const { data, error } = await supabase
        .from('encaminhamentos')
        .select(`
          *,
          paciente:profiles!encaminhamentos_paciente_id_fkey(display_name),
          medico_origem:profiles!encaminhamentos_medico_origem_id_fkey(display_name)
        `)
        .eq('especialidade', especialidade)
        .is('medico_destino_id', null)
        .eq('status', 'aguardando')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar encaminhamentos por especialidade: ${error.message}`);
      }

      return (data || []).map(item => ({
        ...item,
        paciente: item.paciente || { display_name: 'Nome não disponível' },
        medico_origem: item.medico_origem || { display_name: 'Nome não disponível' }
      })) as Encaminhamento[];
    } catch (error) {
      logger.error("Falha ao buscar encaminhamentos por especialidade", "encaminhamentoService", error);
      throw error;
    }
  },

  /**
   * Cria um novo encaminhamento
   */
  async criarEncaminhamento(data: CreateEncaminhamentoData): Promise<{ success: boolean; error?: Error }> {
    logger.info("Criando encaminhamento", "encaminhamentoService", { data });

    try {
      const { error } = await supabase
        .from('encaminhamentos')
        .insert({
          ...data,
          medico_origem_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw new Error(`Erro ao criar encaminhamento: ${error.message}`);
      }

      logger.info("Encaminhamento criado com sucesso", "encaminhamentoService");
      return { success: true };
    } catch (error) {
      logger.error("Falha ao criar encaminhamento", "encaminhamentoService", error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Atualiza um encaminhamento
   */
  async atualizarEncaminhamento(
    encaminhamentoId: string, 
    data: UpdateEncaminhamentoData
  ): Promise<{ success: boolean; error?: Error }> {
    logger.info("Atualizando encaminhamento", "encaminhamentoService", { encaminhamentoId, data });

    try {
      const updateData: any = { ...data };
      
      // Se está aceitando o encaminhamento, definir data_resposta
      if (data.status === 'aceito' || data.status === 'rejeitado') {
        updateData.data_resposta = new Date().toISOString();
        
        // Se está aceitando, definir o médico de destino como o usuário atual
        if (data.status === 'aceito') {
          updateData.medico_destino_id = (await supabase.auth.getUser()).data.user?.id;
        }
      }

      const { error } = await supabase
        .from('encaminhamentos')
        .update(updateData)
        .eq('id', encaminhamentoId);

      if (error) {
        throw new Error(`Erro ao atualizar encaminhamento: ${error.message}`);
      }

      logger.info("Encaminhamento atualizado com sucesso", "encaminhamentoService");
      return { success: true };
    } catch (error) {
      logger.error("Falha ao atualizar encaminhamento", "encaminhamentoService", error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Busca médicos por especialidade para encaminhamento
   */
  async getMedicosPorEspecialidade(especialidade: string): Promise<Array<{id: string, display_name: string}>> {
    logger.info("Buscando médicos por especialidade", "encaminhamentoService", { especialidade });

    try {
      const { data, error } = await supabase
        .from('medicos')
        .select(`
          user_id,
          profiles!medicos_user_id_fkey(display_name)
        `)
        .contains('especialidades', [especialidade]);

      if (error) {
        throw new Error(`Erro ao buscar médicos: ${error.message}`);
      }

      return data?.map(item => ({
        id: item.user_id,
        display_name: (item.profiles as any)?.display_name || 'Nome não disponível'
      })) || [];
    } catch (error) {
      logger.error("Falha ao buscar médicos por especialidade", "encaminhamentoService", error);
      throw error;
    }
  }
};