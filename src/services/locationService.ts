
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
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
      .from('locais_atendimento')
      .select('*')
      .eq('medico_id', user.id)
      .order('nome_local');

    if (error) {
      logger.error("Falha ao buscar locais", "locationService", error);
      throw error;
    }
    return (data as LocalAtendimento[]) || [];
  },

  async addLocation(locationData: Omit<LocalAtendimento, 'id' | 'ativo' | 'medico_id'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { error } = await supabase
      .from('locais_atendimento')
      .insert({ 
        ...locationData, 
        endereco: locationData.endereco as any,
        medico_id: user.id 
      });

    if (error) {
      logger.error("Falha ao adicionar local", "locationService", error);
      throw error;
    }
  },
};

export default locationService;
