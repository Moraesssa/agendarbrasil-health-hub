import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { prescriptionService } from '@/services/prescriptionService';
import { 
  PrescriptionWithRenewals,
  PrescriptionRenewal,
  CreateRenewalRequest,
  MedicalPrescription
} from '@/types/prescription';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const usePrescriptionManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithRenewals[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<MedicalPrescription[]>([]);
  const [renewals, setRenewals] = useState<PrescriptionRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPrescriptionData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load all data in parallel
      const [prescriptionsData, activePrescriptionsData, renewalsData] = await Promise.all([
        prescriptionService.getPrescriptions(),
        prescriptionService.getActivePrescriptions(),
        prescriptionService.getRenewals()
      ]);

      setPrescriptions(prescriptionsData);
      setActivePrescriptions(activePrescriptionsData);
      setRenewals(renewalsData);
    } catch (error) {
      logger.error("Error loading prescription data", "usePrescriptionManagement", error);
      toast({
        title: "Erro ao carregar prescrições",
        description: "Não foi possível carregar os dados das prescrições",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestRenewal = async (renewalData: CreateRenewalRequest) => {
    try {
      setIsSubmitting(true);
      await prescriptionService.requestRenewal(renewalData);
      await loadPrescriptionData(); // Reload data
      toast({
        title: "Renovação solicitada",
        description: "A solicitação de renovação foi enviada com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error requesting renewal", "usePrescriptionManagement", error);
      toast({
        title: "Erro ao solicitar renovação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrescriptionHistory = async (medicationName: string) => {
    try {
      return await prescriptionService.getPrescriptionHistory(medicationName);
    } catch (error) {
      logger.error("Error getting prescription history", "usePrescriptionManagement", error);
      toast({
        title: "Erro ao buscar histórico",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return [];
    }
  };

  // Get prescriptions that are expiring soon (within 7 days)
  const getExpiringSoon = () => {
    const today = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(today.getDate() + 7);

    return activePrescriptions.filter(prescription => {
      if (!prescription.valid_until) return false;
      const validUntil = new Date(prescription.valid_until);
      return validUntil >= today && validUntil <= inSevenDays;
    });
  };

  // Get pending renewal requests
  const getPendingRenewals = () => {
    return renewals.filter(renewal => renewal.status === 'pending');
  };

  useEffect(() => {
    loadPrescriptionData();
  }, [user]);

  return {
    prescriptions,
    activePrescriptions,
    renewals,
    loading,
    isSubmitting,
    requestRenewal,
    getPrescriptionHistory,
    getExpiringSoon,
    getPendingRenewals,
    refetch: loadPrescriptionData
  };
};