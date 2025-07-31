import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  try {
    // Tentar uma operação simples para verificar a conectividade
    const { data, error } = await supabase.from('medicos').select('count').limit(1);
    
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
    isConfigured: !!(url && key && url !== 'https://your-project-ref.supabase.co' && key !== 'your-anon-key-here')
  };
};