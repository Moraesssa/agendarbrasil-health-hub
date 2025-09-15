
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const medicoService = {
  async saveMedicoData(data: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    try {
      logger.info("Salvando dados do médico", "MedicoService", { userId: user.id });
      
      const { data: existing, error: fetchError } = await supabase
        .from('medicos')
        .select('configuracoes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error("Erro ao buscar médico existente", "MedicoService", fetchError);
        throw fetchError;
      }

      const existingConfig = (existing?.configuracoes as Record<string, any>) || {};
      const newConfiguracoes = (data.configuracoes as Record<string, any>) || {};
      
      const medicoData = {
        user_id: user.id,
        usuario_id: user.id,
        crm: data.crm || '',
        especialidades: data.especialidades || [],
        registro_especialista: data.registroEspecialista || null,
        telefone: data.telefone || '',
        whatsapp: data.whatsapp || null,
        dados_profissionais: data.dadosProfissionais || {},
        configuracoes: { ...existingConfig, ...newConfiguracoes },
        verificacao: data.verificacao || existingConfig.verificacao || {}
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('medicos')
          .update(medicoData)
          .eq('user_id', user.id));
      } else {
        ({ error } = await supabase
          .from('medicos')
          .insert(medicoData));
      }

      if (error) {
        logger.error("Erro ao salvar dados do médico", "MedicoService", error);
        throw error;
      }

      logger.info("Dados do médico salvos com sucesso", "MedicoService");
      return true;
    } catch (error) {
      logger.error("Erro inesperado ao salvar dados do médico", "MedicoService", error);
      throw error;
    }
  }
};
