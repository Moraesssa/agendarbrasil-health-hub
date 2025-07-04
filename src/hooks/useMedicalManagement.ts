
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { medicalService } from '@/services/medicalService';
import { 
  MedicalService, 
  MedicalTriage, 
  VaccinationRecord, 
  MedicalExam, 
  FamilyActivity,
  FamilyNotification,
  CreateTriageData,
  CreateVaccineData,
  CreateExamData
} from '@/types/medical';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useMedicalManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [medicalServices, setMedicalServices] = useState<MedicalService[]>([]);
  const [triages, setTriages] = useState<MedicalTriage[]>([]);
  const [vaccines, setVaccines] = useState<VaccinationRecord[]>([]);
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<FamilyActivity[]>([]);
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMedicalData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Carregar todos os dados em paralelo
      const [
        servicesData,
        triagesData,
        vaccinesData,
        examsData,
        activitiesData,
        notificationsData
      ] = await Promise.all([
        medicalService.getMedicalServices(),
        medicalService.getFamilyTriages(),
        medicalService.getFamilyVaccines(),
        medicalService.getFamilyExams(),
        medicalService.getFamilyUpcomingActivities(),
        medicalService.getFamilyNotifications()
      ]);

      setMedicalServices(servicesData);
      setTriages(triagesData);
      setVaccines(vaccinesData);
      setExams(examsData);
      setUpcomingActivities(activitiesData);
      setNotifications(notificationsData);
    } catch (error) {
      logger.error("Error loading medical data", "useMedicalManagement", error);
      toast({
        title: "Erro ao carregar dados médicos",
        description: "Não foi possível carregar os dados médicos da família",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createTriage = async (triageData: CreateTriageData) => {
    try {
      setIsSubmitting(true);
      await medicalService.createTriage(triageData);
      await loadMedicalData(); // Recarregar dados
      toast({
        title: "Triagem criada",
        description: "A triagem médica foi registrada com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error creating triage", "useMedicalManagement", error);
      toast({
        title: "Erro ao criar triagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createVaccineRecord = async (vaccineData: CreateVaccineData) => {
    try {
      setIsSubmitting(true);
      await medicalService.createVaccineRecord(vaccineData);
      await loadMedicalData(); // Recarregar dados
      toast({
        title: "Vacina registrada",
        description: "O registro de vacina foi criado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error creating vaccine record", "useMedicalManagement", error);
      toast({
        title: "Erro ao registrar vacina",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVaccineRecord = async (vaccineId: string, updates: Partial<VaccinationRecord>) => {
    try {
      setIsSubmitting(true);
      await medicalService.updateVaccineRecord(vaccineId, updates);
      await loadMedicalData(); // Recarregar dados
      toast({
        title: "Vacina atualizada",
        description: "O registro de vacina foi atualizado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error updating vaccine record", "useMedicalManagement", error);
      toast({
        title: "Erro ao atualizar vacina",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createExamRecord = async (examData: CreateExamData) => {
    try {
      setIsSubmitting(true);
      await medicalService.createExamRecord(examData);
      await loadMedicalData(); // Recarregar dados
      toast({
        title: "Exame registrado",
        description: "O registro de exame foi criado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error creating exam record", "useMedicalManagement", error);
      toast({
        title: "Erro ao registrar exame",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateExamRecord = async (examId: string, updates: Partial<MedicalExam>) => {
    try {
      setIsSubmitting(true);
      await medicalService.updateExamRecord(examId, updates);
      await loadMedicalData(); // Recarregar dados
      toast({
        title: "Exame atualizado",
        description: "O registro de exame foi atualizado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error updating exam record", "useMedicalManagement", error);
      toast({
        title: "Erro ao atualizar exame",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await medicalService.markNotificationAsRead(notificationId);
      // Atualizar localmente sem recarregar tudo
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      logger.error("Error marking notification as read", "useMedicalManagement", error);
      toast({
        title: "Erro ao marcar notificação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMedicalData();
  }, [loadMedicalData]);

  return {
    medicalServices,
    triages,
    vaccines,
    exams,
    upcomingActivities,
    notifications,
    loading,
    isSubmitting,
    createTriage,
    createVaccineRecord,
    updateVaccineRecord,
    createExamRecord,
    updateExamRecord,
    markNotificationAsRead,
    refetch: loadMedicalData
  };
};
