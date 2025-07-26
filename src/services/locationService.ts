
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface LocalAtendimento {
  id: string;
  medico_id: string;
  nome_local: string;
  endereco: Endereco;
  telefone?: string;
  ativo: boolean;
}

const locationService = {
  async getLocations(): Promise<LocalAtendimento[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error("Usuário não autenticado", "locationService");
      throw new Error("Usuário não autenticado.");
    }

    logger.info("Buscando locais para médico", "locationService", { userId: user.id });

    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('*')
      .eq('medico_id', user.id)
      .order('nome_local');

    if (error) {
      logger.error("Falha ao buscar locais", "locationService", error);
      
      // Fornecer mensagens de erro mais específicas
      if (error.code === 'PGRST301') {
        throw new Error("Você não tem permissão para acessar os locais de atendimento.");
      } else if (error.code === 'PGRST116') {
        logger.info("Nenhum local encontrado para o médico", "locationService", { userId: user.id });
        return []; // Retorna array vazio ao invés de erro
      } else {
        throw new Error(`Erro ao buscar locais: ${error.message}`);
      }
    }
    
    // Converter Json para Endereco e validar estrutura
    const locais = (data || []).map(item => {
      const endereco = item.endereco as any;
      return {
        id: item.id,
        medico_id: item.medico_id,
        nome_local: item.nome_local,
        endereco: {
          cep: endereco?.cep || '',
          logradouro: endereco?.logradouro || '',
          numero: endereco?.numero || '',
          complemento: endereco?.complemento || '',
          bairro: endereco?.bairro || '',
          cidade: endereco?.cidade || '',
          uf: endereco?.uf || ''
        } as Endereco,
        telefone: item.telefone || undefined,
        ativo: item.ativo
      } as LocalAtendimento;
    });
    
    logger.info("Locais carregados com sucesso", "locationService", { count: locais.length });
    return locais;
  },

  async addLocation(locationData: Omit<LocalAtendimento, 'id' | 'ativo' | 'medico_id'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error("Usuário não autenticado para adicionar local", "locationService");
      throw new Error("Usuário não autenticado.");
    }

    const { error } = await supabase
      .from('locais_atendimento')
      .insert({ 
        ...locationData, 
        medico_id: user.id,
        endereco: locationData.endereco as any
      });

    if (error) {
      logger.error("Falha ao adicionar local", "locationService", error);
      throw new Error(`Erro ao adicionar local: ${error.message}`);
    }

    logger.info("Local adicionado com sucesso", "locationService");
  },
};

export default locationService;
