import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  if (!supabase) {
    return {
      connected: false,
      error: 'Supabase não configurado'
    };
  }

  try {
    // Tentar uma operação simples para verificar a conectividade
    const { error } = await supabase.from('medicos').select('count').limit(1);

    if (error) {
      console.error('Erro de conectividade Supabase:', error);
      return {
        connected: false,
        error: `Erro de conectividade: ${error.message}`
      };
    }

    return { connected: true };
  } catch (error) {
    console.error('Erro ao verificar conectividade Supabase:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

export const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    url,
    key,
    isConfigured: !!(url && key && supabase && url !== 'https://your-project-ref.supabase.co' && key !== 'your-anon-key-here')
  };
};
