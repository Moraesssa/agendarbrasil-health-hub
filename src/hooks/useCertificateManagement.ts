
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { certificateService } from '@/services/certificateService';
import { 
  MedicalCertificate,
  CreateCertificateData,
  DocumentValidation,
  ValidationResult
} from '@/types/certificates';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useCertificateManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [validationHistory, setValidationHistory] = useState<DocumentValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCertificateData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [certificatesData, validationData] = await Promise.all([
        certificateService.getCertificates(),
        certificateService.getValidationHistory()
      ]);

      setCertificates(certificatesData);
      setValidationHistory(validationData);
    } catch (error) {
      logger.error("Error loading certificate data", "useCertificateManagement", error);
      toast({
        title: "Erro ao carregar certificados",
        description: "Não foi possível carregar os dados dos certificados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCertificate = async (certificateData: CreateCertificateData) => {
    try {
      setIsSubmitting(true);
      await certificateService.createCertificate(certificateData);
      await loadCertificateData();
      toast({
        title: "Certificado criado",
        description: "O certificado médico foi criado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error creating certificate", "useCertificateManagement", error);
      toast({
        title: "Erro ao criar certificado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCertificate = async (certificateId: string, updates: Partial<MedicalCertificate>) => {
    try {
      setIsSubmitting(true);
      await certificateService.updateCertificate(certificateId, updates);
      await loadCertificateData();
      toast({
        title: "Certificado atualizado",
        description: "O certificado foi atualizado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error updating certificate", "useCertificateManagement", error);
      toast({
        title: "Erro ao atualizar certificado",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateDocument = async (validationHash: string): Promise<ValidationResult> => {
    try {
      const result = await certificateService.validateDocument(validationHash);
      
      if (result.valid) {
        toast({
          title: "Documento válido",
          description: "O documento foi validado com sucesso",
        });
      } else {
        toast({
          title: "Documento inválido",
          description: result.error || "Documento não encontrado",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      logger.error("Error validating document", "useCertificateManagement", error);
      toast({
        title: "Erro na validação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return {
        valid: false,
        error: "Erro ao validar documento"
      };
    }
  };

  useEffect(() => {
    loadCertificateData();
  }, [user]);

  return {
    certificates,
    validationHistory,
    loading,
    isSubmitting,
    createCertificate,
    updateCertificate,
    validateDocument,
    refetch: loadCertificateData
  };
};
