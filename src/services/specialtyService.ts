
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const specialtyService = {
  async getAllSpecialties(): Promise<string[]> {
    logger.info("Fetching all specialties", "SpecialtyService");
    try {
      const { data, error } = await supabase.rpc('get_specialties');
      
      if (error) {
        logger.error("Error fetching specialties", "SpecialtyService", error);
        throw new Error(`Erro ao buscar especialidades: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      logger.error("Failed to fetch specialties", "SpecialtyService", error);
      throw error;
    }
  },

  async getSpecialtiesByDoctor(doctorId: string): Promise<string[]> {
    logger.info("Fetching specialties by doctor", "SpecialtyService", { doctorId });
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('especialidades')
        .eq('user_id', doctorId)
        .single();

      if (error) {
        logger.error("Error fetching doctor specialties", "SpecialtyService", error);
        throw new Error(`Erro ao buscar especialidades do médico: ${error.message}`);
      }

      return (data?.especialidades as string[]) || [];
    } catch (error) {
      logger.error("Failed to fetch doctor specialties", "SpecialtyService", { doctorId, error });
      throw error;
    }
  }
};
