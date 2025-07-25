
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  MedicalCertificate, 
  CreateCertificateData,
  DocumentValidation,
  ValidationResult
} from '@/types/certificates';

export const certificateService = {
  // Get user's certificates
  async getCertificates(): Promise<MedicalCertificate[]> {
    logger.info("Fetching certificates", "CertificateService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medical_certificates')
        .select(`
          *,
          doctor:profiles!medical_certificates_doctor_id_fkey(display_name),
          patient:profiles!medical_certificates_patient_id_fkey(display_name)
        `)
        .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error("Error fetching certificates", "CertificateService", error);
        throw new Error(`Erro ao buscar certificados: ${error.message}`);
      }

      return (data || []).map((cert: any) => ({
        ...cert,
        doctor_name: cert.doctor?.display_name,
        patient_name: cert.patient?.display_name
      }));
    } catch (error) {
      logger.error("Failed to fetch certificates", "CertificateService", error);
      throw error;
    }
  },

  // Create a new certificate
  async createCertificate(certificateData: CreateCertificateData): Promise<MedicalCertificate> {
    logger.info("Creating certificate", "CertificateService", { type: certificateData.certificate_type });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medical_certificates')
        .insert({
          ...certificateData,
          doctor_id: user.id
        })
        .select(`
          *,
          doctor:profiles!medical_certificates_doctor_id_fkey(display_name),
          patient:profiles!medical_certificates_patient_id_fkey(display_name)
        `)
        .single();

      if (error) {
        logger.error("Error creating certificate", "CertificateService", error);
        throw new Error(`Erro ao criar certificado: ${error.message}`);
      }

      return {
        ...data,
        doctor_name: data.doctor?.display_name,
        patient_name: data.patient?.display_name
      };
    } catch (error) {
      logger.error("Failed to create certificate", "CertificateService", error);
      throw error;
    }
  },

  // Update certificate
  async updateCertificate(certificateId: string, updates: Partial<MedicalCertificate>): Promise<void> {
    logger.info("Updating certificate", "CertificateService", { certificateId });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('medical_certificates')
        .update(updates)
        .eq('id', certificateId)
        .eq('doctor_id', user.id);

      if (error) {
        logger.error("Error updating certificate", "CertificateService", error);
        throw new Error(`Erro ao atualizar certificado: ${error.message}`);
      }

      logger.info("Certificate updated successfully", "CertificateService");
    } catch (error) {
      logger.error("Failed to update certificate", "CertificateService", error);
      throw error;
    }
  },

  // Validate document by hash
  async validateDocument(validationHash: string): Promise<ValidationResult> {
    logger.info("Validating document", "CertificateService", { hash: validationHash.substring(0, 10) + "..." });
    try {
      // Try to find in prescriptions first
      const { data: prescription } = await supabase
        .from('medical_prescriptions')
        .select(`
          *,
          doctor:profiles!medical_prescriptions_doctor_id_fkey(display_name),
          patient:profiles!medical_prescriptions_patient_id_fkey(display_name)
        `)
        .eq('validation_hash', validationHash)
        .single();

      if (prescription) {
        // Log validation attempt
        await supabase.from('document_validations').insert({
          document_id: prescription.id,
          document_type: 'prescription',
          validation_code: validationHash
        });

        return {
          valid: true,
          document: {
            ...prescription,
            type: 'prescription',
            doctor_name: prescription.doctor?.display_name,
            patient_name: prescription.patient?.display_name
          }
        };
      }

      // Try to find in certificates
      const { data: certificate } = await supabase
        .from('medical_certificates')
        .select(`
          *,
          doctor:profiles!medical_certificates_doctor_id_fkey(display_name),
          patient:profiles!medical_certificates_patient_id_fkey(display_name)
        `)
        .eq('validation_hash', validationHash)
        .single();

      if (certificate) {
        // Log validation attempt
        await supabase.from('document_validations').insert({
          document_id: certificate.id,
          document_type: 'certificate',
          validation_code: validationHash
        });

        return {
          valid: true,
          document: {
            ...certificate,
            type: 'certificate',
            doctor_name: certificate.doctor?.display_name,
            patient_name: certificate.patient?.display_name
          }
        };
      }

      return {
        valid: false,
        error: 'Documento não encontrado ou código de validação inválido'
      };
    } catch (error) {
      logger.error("Failed to validate document", "CertificateService", error);
      return {
        valid: false,
        error: 'Erro ao validar documento'
      };
    }
  },

  // Get validation history
  async getValidationHistory(): Promise<DocumentValidation[]> {
    logger.info("Fetching validation history", "CertificateService");
    try {
      const { data, error } = await supabase
        .from('document_validations')
        .select('*')
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error("Error fetching validation history", "CertificateService", error);
        throw new Error(`Erro ao buscar histórico de validações: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Failed to fetch validation history", "CertificateService", error);
      throw error;
    }
  }
};
