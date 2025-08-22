
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const specialtyService = {
  async getAllSpecialties(): Promise<string[]> {
    logger.info("Fetching all specialties", "SpecialtyService");
    const fetchFromTable = async (): Promise<string[]> => {
      const { data: tableData, error: tableError } = await supabase
        .from('especialidades_medicas')
        .select('nome')
        .eq('ativa', true)
        .order('nome');

      if (tableError) {
        logger.error("Fallback select failed", "SpecialtyService", tableError);
        throw new Error(`Erro ao buscar especialidades (fallback): ${tableError.message}`);
      }

      return (tableData || []).map((row: any) => row.nome);
    };

    try {
      const { data, error } = await supabase.rpc('get_specialties');

      if (error) {
        logger.warn("RPC get_specialties failed, using fallback", "SpecialtyService", error);
        return await fetchFromTable();
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        logger.warn("RPC returned empty list, using fallback", "SpecialtyService");
        return await fetchFromTable();
      }

      return data || [];
    } catch (error) {
      logger.error("Failed to fetch specialties, trying fallback", "SpecialtyService", error);
      // Last attempt: fallback
      return await fetchFromTable();
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
