
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  MedicalCertificate, 
  CreateCertificateData,
  DocumentValidation,
  ValidationResult
} from '@/types/certificates';

export const certificateService = {
  // Get user's certificates - usando uma implementação temporária com dados mock
  async getCertificates(): Promise<MedicalCertificate[]> {
    logger.info("Fetching certificates (temporary implementation)", "CertificateService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Temporariamente retornando array vazio até que as tabelas sejam sincronizadas
      return [];
    } catch (error) {
      logger.error("Failed to fetch certificates", "CertificateService", error);
      throw error;
    }
  },

  // Create a new certificate - implementação temporária
  async createCertificate(certificateData: CreateCertificateData): Promise<MedicalCertificate> {
    logger.info("Creating certificate (temporary implementation)", "CertificateService", { type: certificateData.certificate_type });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Simulando criação de certificado
      const mockCertificate: MedicalCertificate = {
        id: crypto.randomUUID(),
        patient_id: certificateData.patient_id,
        doctor_id: user.id,
        certificate_type: certificateData.certificate_type,
        title: certificateData.title,
        content: certificateData.content,
        start_date: certificateData.start_date,
        end_date: certificateData.end_date,
        diagnosis: certificateData.diagnosis,
        recommendations: certificateData.recommendations,
        certificate_number: `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        validation_hash: crypto.randomUUID(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logger.info("Certificate created (mock)", "CertificateService");
      return mockCertificate;
    } catch (error) {
      logger.error("Failed to create certificate", "CertificateService", error);
      throw error;
    }
  },

  // Update certificate - implementação temporária
  async updateCertificate(certificateId: string, updates: Partial<MedicalCertificate>): Promise<void> {
    logger.info("Updating certificate (temporary implementation)", "CertificateService", { certificateId });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Simulando atualização
      logger.info("Certificate updated (mock)", "CertificateService");
    } catch (error) {
      logger.error("Failed to update certificate", "CertificateService", error);
      throw error;
    }
  },

  // Validate document by hash - implementação temporária
  async validateDocument(validationHash: string): Promise<ValidationResult> {
    logger.info("Validating document (temporary implementation)", "CertificateService", { hash: validationHash.substring(0, 10) + "..." });
    try {
      // Simulando validação
      return {
        valid: false,
        error: 'Validação temporariamente indisponível - aguarde sincronização das tabelas'
      };
    } catch (error) {
      logger.error("Failed to validate document", "CertificateService", error);
      return {
        valid: false,
        error: 'Erro ao validar documento'
      };
    }
  },

  // Get validation history - implementação temporária
  async getValidationHistory(): Promise<DocumentValidation[]> {
    logger.info("Fetching validation history (temporary implementation)", "CertificateService");
    try {
      // Retornando array vazio temporariamente
      return [];
    } catch (error) {
      logger.error("Failed to fetch validation history", "CertificateService", error);
      throw error;
    }
  }
};
