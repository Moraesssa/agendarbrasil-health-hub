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
  // Busca todos os locais de atendimento do médico logado usando a nova função RPC.
  async getLocations(): Promise<LocalAtendimento[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // MODIFICADO: Agora chama a função RPC 'get_my_locations'
    const { data, error } = await supabase.rpc('get_my_locations');

    if (error) {
      logger.error("Falha ao buscar locais via RPC", "locationService", error);
      throw error;
    }
    // O retorno da RPC já está corretamente tipado se os tipos do Supabase estiverem atualizados.
    return (data as LocalAtendimento[]) || [];
  },

  // Adiciona um novo local de atendimento (esta função permanece a mesma).
  async addLocation(locationData: Omit<LocalAtendimento, 'id' | 'ativo' | 'medico_id'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { error } = await supabase
      .from('locais_atendimento')
      .insert({ ...locationData, medico_id: user.id });

    if (error) {
      logger.error("Falha ao adicionar local", "locationService", error);
      throw error;
    }
  },
};

export default locationService;
