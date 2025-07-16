
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  nome_local: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  telefone?: string;
}

export const useLocationData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchLocationById = async (localId: string): Promise<LocationData | null> => {
    if (!localId) return null;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locais_atendimento')
        .select('nome_local, endereco, telefone')
        .eq('id', localId)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar localização:', error);
        toast({
          title: "Erro ao carregar localização",
          description: "Não foi possível obter os dados do local da consulta.",
          variant: "destructive",
        });
        return null;
      }

      return data as LocationData;
    } catch (error) {
      console.error('Erro inesperado ao buscar localização:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao buscar os dados de localização.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchLocationById,
    loading
  };
};
