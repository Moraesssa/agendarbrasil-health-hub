import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  MedicalPrescription, 
  PrescriptionRenewal, 
  CreatePrescriptionData,
  CreateRenewalRequest,
  PrescriptionWithRenewals
} from '@/types/prescription';

export const prescriptionService = {
  // Get user's prescriptions with doctor information
  async getPrescriptions(): Promise<PrescriptionWithRenewals[]> {
    logger.info("Fetching prescriptions", "PrescriptionService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medical_prescriptions')
        .select(`
          *,
          doctor:profiles!medical_prescriptions_doctor_id_fkey(display_name)
        `)
        .eq('patient_id', user.id)
        .order('prescribed_date', { ascending: false });

      if (error) {
        logger.error("Error fetching prescriptions", "PrescriptionService", error);
        throw new Error(`Erro ao buscar prescrições: ${error.message}`);
      }

      // Get renewals for each prescription
      const prescriptionsWithRenewals = await Promise.all(
        (data || []).map(async (prescription: any) => {
          const { data: renewals } = await supabase
            .from('prescription_renewals')
            .select(`
              *,
              doctor:profiles!prescription_renewals_doctor_id_fkey(display_name)
            `)
            .eq('prescription_id', prescription.id)
            .order('request_date', { ascending: false });

          return {
            ...prescription,
            doctor_name: prescription.doctor?.display_name,
            renewals: renewals || [],
            latest_renewal: renewals?.[0] || null
          };
        })
      );

      return prescriptionsWithRenewals;
    } catch (error) {
      logger.error("Failed to fetch prescriptions", "PrescriptionService", error);
      throw error;
    }
  },

  // Get active prescriptions
  async getActivePrescriptions(): Promise<MedicalPrescription[]> {
    logger.info("Fetching active prescriptions", "PrescriptionService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medical_prescriptions')
        .select(`
          *,
          doctor:profiles!medical_prescriptions_doctor_id_fkey(display_name)
        `)
        .eq('patient_id', user.id)
        .eq('is_active', true)
        .order('prescribed_date', { ascending: false });

      if (error) {
        logger.error("Error fetching active prescriptions", "PrescriptionService", error);
        throw new Error(`Erro ao buscar prescrições ativas: ${error.message}`);
      }

      return (data || []).map((prescription: any) => ({
        ...prescription,
        doctor_name: prescription.doctor?.display_name
      }));
    } catch (error) {
      logger.error("Failed to fetch active prescriptions", "PrescriptionService", error);
      throw error;
    }
  },

  // Request prescription renewal
  async requestRenewal(renewalData: CreateRenewalRequest): Promise<void> {
    logger.info("Requesting prescription renewal", "PrescriptionService", { prescriptionId: renewalData.prescription_id });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get prescription to get doctor_id
      const { data: prescription, error: prescriptionError } = await supabase
        .from('medical_prescriptions')
        .select('doctor_id')
        .eq('id', renewalData.prescription_id)
        .eq('patient_id', user.id)
        .single();

      if (prescriptionError) {
        logger.error("Error fetching prescription for renewal", "PrescriptionService", prescriptionError);
        throw new Error(`Prescrição não encontrada: ${prescriptionError.message}`);
      }

      const { error } = await supabase
        .from('prescription_renewals')
        .insert({
          ...renewalData,
          patient_id: user.id,
          doctor_id: prescription.doctor_id
        });

      if (error) {
        logger.error("Error creating renewal request", "PrescriptionService", error);
        throw new Error(`Erro ao solicitar renovação: ${error.message}`);
      }

      logger.info("Prescription renewal requested successfully", "PrescriptionService");
    } catch (error) {
      logger.error("Failed to request prescription renewal", "PrescriptionService", error);
      throw error;
    }
  },

  // Get prescription renewals
  async getRenewals(): Promise<PrescriptionRenewal[]> {
    logger.info("Fetching prescription renewals", "PrescriptionService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('prescription_renewals')
        .select(`
          *,
          prescription:medical_prescriptions(*),
          doctor:profiles!prescription_renewals_doctor_id_fkey(display_name)
        `)
        .eq('patient_id', user.id)
        .order('request_date', { ascending: false });

      if (error) {
        logger.error("Error fetching renewals", "PrescriptionService", error);
        throw new Error(`Erro ao buscar renovações: ${error.message}`);
      }

      return (data || []).map((renewal: any) => ({
        ...renewal,
        doctor_name: renewal.doctor?.display_name
      }));
    } catch (error) {
      logger.error("Failed to fetch renewals", "PrescriptionService", error);
      throw error;
    }
  },

  // Get prescription history (all prescriptions for the same medication)
  async getPrescriptionHistory(medicationName: string): Promise<MedicalPrescription[]> {
    logger.info("Fetching prescription history", "PrescriptionService", { medicationName });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('medical_prescriptions')
        .select(`
          *,
          doctor:profiles!medical_prescriptions_doctor_id_fkey(display_name)
        `)
        .eq('patient_id', user.id)
        .ilike('medication_name', `%${medicationName}%`)
        .order('prescribed_date', { ascending: false });

      if (error) {
        logger.error("Error fetching prescription history", "PrescriptionService", error);
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      return (data || []).map((prescription: any) => ({
        ...prescription,
        doctor_name: prescription.doctor?.display_name
      }));
    } catch (error) {
      logger.error("Failed to fetch prescription history", "PrescriptionService", error);
      throw error;
    }
  }
};