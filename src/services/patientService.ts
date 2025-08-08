import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PatientProfile {
  id: string;
  display_name: string | null;
  email: string | null;
}

export const patientService = {
  async searchPatients(query: string): Promise<PatientProfile[]> {
    try {
      const q = query?.trim() || '';
      if (q.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('user_type', 'paciente')
        .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
        .order('display_name', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('Erro ao buscar pacientes', 'patientService.searchPatients', error);
        return [];
      }

      return (data || []) as PatientProfile[];
    } catch (err) {
      logger.error('Exceção ao buscar pacientes', 'patientService.searchPatients', err);
      return [];
    }
  },
};
