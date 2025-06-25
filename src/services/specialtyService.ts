
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const specialtyService = {
  // Busca todas as especialidades (padronizadas + customizadas dos médicos)
  async getAllSpecialties(): Promise<string[]> {
    logger.info("Fetching all specialties", "SpecialtyService");
    try {
      // Usar a função RPC que combina especialidades padronizadas e customizadas
      const { data, error } = await supabase.rpc('get_all_specialties');

      if (error) {
        logger.error("RPC get_all_specialties failed", "SpecialtyService", error);
        throw new Error(`Erro ao buscar especialidades: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        logger.warn("No specialties found in database", "SpecialtyService");
        
        // Retornar especialidades padrão se não houver nenhuma no banco
        return [
          'Cardiologia',
          'Neurologia', 
          'Dermatologia',
          'Ortopedia',
          'Ginecologia',
          'Pediatria',
          'Oftalmologia',
          'Otorrinolaringologia',
          'Urologia',
          'Psiquiatria'
        ];
      }
      
      const specialties = (data as string[] || []).sort();
      logger.info("All specialties fetched successfully", "SpecialtyService", { 
        count: specialties.length 
      });
      return specialties;
    } catch (error) {
      logger.error("Failed to fetch all specialties", "SpecialtyService", error);
      throw error;
    }
  },

  // Busca apenas especialidades padronizadas
  async getStandardSpecialties(): Promise<string[]> {
    logger.info("Fetching standard specialties", "SpecialtyService");
    try {
      const { data, error } = await supabase
        .from('especialidades_medicas')
        .select('nome')
        .eq('ativa', true)
        .order('nome');

      if (error) {
        logger.error("Failed to fetch standard specialties", "SpecialtyService", error);
        throw new Error(`Erro ao buscar especialidades padronizadas: ${error.message}`);
      }
      
      const specialties = data?.map(item => item.nome) || [];
      logger.info("Standard specialties fetched successfully", "SpecialtyService", { 
        count: specialties.length 
      });
      return specialties;
    } catch (error) {
      logger.error("Failed to fetch standard specialties", "SpecialtyService", error);
      throw error;
    }
  },

  // Busca especialidades com descrições (para interfaces administrativas futuras)
  async getSpecialtiesWithDetails(): Promise<Array<{id: string, nome: string, codigo?: string, descricao?: string}>> {
    logger.info("Fetching specialties with details", "SpecialtyService");
    try {
      const { data, error } = await supabase
        .from('especialidades_medicas')
        .select('id, nome, codigo, descricao')
        .eq('ativa', true)
        .order('nome');

      if (error) {
        logger.error("Failed to fetch specialties with details", "SpecialtyService", error);
        throw new Error(`Erro ao buscar detalhes das especialidades: ${error.message}`);
      }
      
      logger.info("Specialties with details fetched successfully", "SpecialtyService", { 
        count: data?.length || 0 
      });
      return data || [];
    } catch (error) {
      logger.error("Failed to fetch specialties with details", "SpecialtyService", error);
      throw error;
    }
  }
};
