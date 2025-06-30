
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  MedicalService, 
  MedicalTriage, 
  VaccinationRecord, 
  MedicalExam, 
  FamilyNotification,
  FamilyActivity,
  CreateTriageData,
  CreateVaccineData,
  CreateExamData
} from '@/types/medical';

export const medicalService = {
  // Serviços médicos disponíveis
  async getMedicalServices(): Promise<MedicalService[]> {
    logger.info("Fetching medical services", "MedicalService");
    try {
      const { data, error } = await supabase
        .from('medical_services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        logger.error("Error fetching medical services", "MedicalService", error);
        throw new Error(`Erro ao buscar serviços médicos: ${error.message}`);
      }

      return (data || []).map(service => ({
        ...service,
        category: service.category as MedicalService['category']
      }));
    } catch (error) {
      logger.error("Failed to fetch medical services", "MedicalService", error);
      throw error;
    }
  },

  // Triagem médica
  async createTriage(triageData: CreateTriageData): Promise<void> {
    logger.info("Creating medical triage", "MedicalService", { patient_id: triageData.patient_id });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('medical_triage')
        .insert({
          ...triageData,
          created_by: user.id
        });

      if (error) {
        logger.error("Error creating triage", "MedicalService", error);
        throw new Error(`Erro ao criar triagem: ${error.message}`);
      }

      logger.info("Triage created successfully", "MedicalService");
    } catch (error) {
      logger.error("Failed to create triage", "MedicalService", error);
      throw error;
    }
  },

  async getFamilyTriages(): Promise<MedicalTriage[]> {
    logger.info("Fetching family triages", "MedicalService");
    try {
      const { data, error } = await supabase
        .from('medical_triage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error("Error fetching triages", "MedicalService", error);
        throw new Error(`Erro ao buscar triagens: ${error.message}`);
      }

      return (data || []).map(triage => ({
        ...triage,
        urgency_level: triage.urgency_level as MedicalTriage['urgency_level'],
        status: triage.status as MedicalTriage['status']
      }));
    } catch (error) {
      logger.error("Failed to fetch triages", "MedicalService", error);
      throw error;
    }
  },

  // Controle de vacinas
  async createVaccineRecord(vaccineData: CreateVaccineData): Promise<void> {
    logger.info("Creating vaccine record", "MedicalService", { patient_id: vaccineData.patient_id });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('vaccination_records')
        .insert({
          ...vaccineData,
          created_by: user.id
        });

      if (error) {
        logger.error("Error creating vaccine record", "MedicalService", error);
        throw new Error(`Erro ao criar registro de vacina: ${error.message}`);
      }

      logger.info("Vaccine record created successfully", "MedicalService");
    } catch (error) {
      logger.error("Failed to create vaccine record", "MedicalService", error);
      throw error;
    }
  },

  async getFamilyVaccines(): Promise<VaccinationRecord[]> {
    logger.info("Fetching family vaccines", "MedicalService");
    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .order('next_dose_date', { ascending: true });

      if (error) {
        logger.error("Error fetching vaccines", "MedicalService", error);
        throw new Error(`Erro ao buscar vacinas: ${error.message}`);
      }

      return (data || []).map(vaccine => ({
        ...vaccine,
        vaccine_type: vaccine.vaccine_type as VaccinationRecord['vaccine_type'],
        status: vaccine.status as VaccinationRecord['status']
      }));
    } catch (error) {
      logger.error("Failed to fetch vaccines", "MedicalService", error);
      throw error;
    }
  },

  async updateVaccineRecord(vaccineId: string, updates: Partial<VaccinationRecord>): Promise<void> {
    logger.info("Updating vaccine record", "MedicalService", { vaccineId });
    try {
      const { error } = await supabase
        .from('vaccination_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', vaccineId);

      if (error) {
        logger.error("Error updating vaccine record", "MedicalService", error);
        throw new Error(`Erro ao atualizar vacina: ${error.message}`);
      }

      logger.info("Vaccine record updated successfully", "MedicalService");
    } catch (error) {
      logger.error("Failed to update vaccine record", "MedicalService", error);
      throw error;
    }
  },

  // Exames médicos
  async createExamRecord(examData: CreateExamData): Promise<void> {
    logger.info("Creating exam record", "MedicalService", { patient_id: examData.patient_id });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('medical_exams')
        .insert({
          ...examData,
          created_by: user.id
        });

      if (error) {
        logger.error("Error creating exam record", "MedicalService", error);
        throw new Error(`Erro ao criar registro de exame: ${error.message}`);
      }

      logger.info("Exam record created successfully", "MedicalService");
    } catch (error) {
      logger.error("Failed to create exam record", "MedicalService", error);
      throw error;
    }
  },

  async getFamilyExams(): Promise<MedicalExam[]> {
    logger.info("Fetching family exams", "MedicalService");
    try {
      const { data, error } = await supabase
        .from('medical_exams')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        logger.error("Error fetching exams", "MedicalService", error);
        throw new Error(`Erro ao buscar exames: ${error.message}`);
      }

      return (data || []).map(exam => ({
        ...exam,
        exam_type: exam.exam_type as MedicalExam['exam_type'],
        status: exam.status as MedicalExam['status']
      }));
    } catch (error) {
      logger.error("Failed to fetch exams", "MedicalService", error);
      throw error;
    }
  },

  async updateExamRecord(examId: string, updates: Partial<MedicalExam>): Promise<void> {
    logger.info("Updating exam record", "MedicalService", { examId });
    try {
      const { error } = await supabase
        .from('medical_exams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (error) {
        logger.error("Error updating exam record", "MedicalService", error);
        throw new Error(`Erro ao atualizar exame: ${error.message}`);
      }

      logger.info("Exam record updated successfully", "MedicalService");
    } catch (error) {
      logger.error("Failed to update exam record", "MedicalService", error);
      throw error;
    }
  },

  // Atividades familiares
  async getFamilyUpcomingActivities(): Promise<FamilyActivity[]> {
    logger.info("Fetching family upcoming activities", "MedicalService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.rpc('get_family_upcoming_activities', { 
        user_uuid: user.id 
      });

      if (error) {
        logger.error("Error fetching upcoming activities", "MedicalService", error);
        throw new Error(`Erro ao buscar atividades familiares: ${error.message}`);
      }

      return (data || []).map(activity => ({
        ...activity,
        activity_type: activity.activity_type as FamilyActivity['activity_type'],
        urgency: activity.urgency as FamilyActivity['urgency']
      }));
    } catch (error) {
      logger.error("Failed to fetch upcoming activities", "MedicalService", error);
      throw error;
    }
  },

  // Notificações
  async getFamilyNotifications(): Promise<FamilyNotification[]> {
    logger.info("Fetching family notifications", "MedicalService");
    try {
      const { data, error } = await supabase
        .from('family_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error("Error fetching notifications", "MedicalService", error);
        throw new Error(`Erro ao buscar notificações: ${error.message}`);
      }

      return (data || []).map(notification => ({
        ...notification,
        notification_type: notification.notification_type as FamilyNotification['notification_type'],
        priority: notification.priority as FamilyNotification['priority']
      }));
    } catch (error) {
      logger.error("Failed to fetch notifications", "MedicalService", error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    logger.info("Marking notification as read", "MedicalService", { notificationId });
    try {
      const { error } = await supabase
        .from('family_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        logger.error("Error marking notification as read", "MedicalService", error);
        throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
      }

      logger.info("Notification marked as read successfully", "MedicalService");
    } catch (error) {
      logger.error("Failed to mark notification as read", "MedicalService", error);
      throw error;
    }
  }
};
