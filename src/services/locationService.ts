
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface LocalAtendimento {
  id: string;
  nome_local: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  telefone?: string;
  ativo: boolean;
}

const locationService = {
  // Busca todos os locais de atendimento do médico logado.
  async getLocations(): Promise<LocalAtendimento[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('*')
      .eq('medico_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error("Falha ao buscar locais", "locationService", error);
      throw error;
    }
    return (data || []).map(local => ({
      ...local,
      endereco: typeof local.endereco === 'object' ? local.endereco as any : {}
    })) as LocalAtendimento[];
  },

  // Adiciona um novo local de atendimento.
  async addLocation(locationData: Omit<LocalAtendimento, 'id' | 'ativo'>): Promise<void> {
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
  
  // (Opcional) Adicione aqui funções para `updateLocation` e `deleteLocation` se necessário.
};

export default locationService;
