
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
    
    return locais;
  },

  async addLocation(locationData: Omit<LocalAtendimento, 'id' | 'ativo' | 'medico_id'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { error } = await supabase
      .from('locais_atendimento')
      .insert({ 
        ...locationData, 
        medico_id: user.id,
        endereco: locationData.endereco as any
      });

    if (error) {
      logger.error("Falha ao adicionar local", "locationService", error);
      throw error;
    }
  },
};

export default locationService;
