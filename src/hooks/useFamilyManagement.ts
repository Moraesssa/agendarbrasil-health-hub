
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { familyService } from '@/services/familyService';
import { FamilyMember, AddFamilyMemberData } from '@/types/family';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export const useFamilyManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFamilyMembers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const members = await familyService.getFamilyMembers();
      setFamilyMembers(members);
    } catch (error) {
      logger.error("Error loading family members", "useFamilyManagement", error);
      toast({
        title: "Erro ao carregar família",
        description: "Não foi possível carregar os membros da família",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFamilyMember = async (memberData: AddFamilyMemberData) => {
    try {
      setIsSubmitting(true);
      await familyService.addFamilyMember(memberData);
      await loadFamilyMembers(); // Recarregar a lista
      toast({
        title: "Membro adicionado",
        description: "O membro da família foi adicionado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error adding family member", "useFamilyManagement", error);
      toast({
        title: "Erro ao adicionar membro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFamilyMember = async (memberId: string, updates: Partial<FamilyMember>) => {
    try {
      setIsSubmitting(true);
      await familyService.updateFamilyMember(memberId, updates);
      await loadFamilyMembers(); // Recarregar a lista
      toast({
        title: "Membro atualizado",
        description: "As informações do membro foram atualizadas",
      });
      return true;
    } catch (error) {
      logger.error("Error updating family member", "useFamilyManagement", error);
      toast({
        title: "Erro ao atualizar membro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFamilyMember = async (memberId: string) => {
    try {
      setIsSubmitting(true);
      await familyService.removeFamilyMember(memberId);
      await loadFamilyMembers(); // Recarregar a lista
      toast({
        title: "Membro removido",
        description: "O membro foi removido da família",
      });
      return true;
    } catch (error) {
      logger.error("Error removing family member", "useFamilyManagement", error);
      toast({
        title: "Erro ao remover membro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, [user]);

  return {
    familyMembers,
    loading,
    isSubmitting,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    refetch: loadFamilyMembers
  };
};
