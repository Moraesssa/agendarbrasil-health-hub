
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { FamilyMember, AddFamilyMemberData } from '@/types/family';

export const familyService = {
  async getFamilyMembers(): Promise<FamilyMember[]> {
    logger.info("Fetching family members", "FamilyService");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.rpc('get_family_members', { 
        user_uuid: user.id 
      });

      if (error) {
        logger.error("Error fetching family members", "FamilyService", error);
        throw new Error(`Erro ao buscar membros da família: ${error.message}`);
      }

      // Cast the returned data to the correct type
      return (data || []).map((member: any): FamilyMember => ({
        id: member.id,
        family_member_id: member.family_member_id,
        display_name: member.display_name,
        email: member.email,
        relationship: member.relationship as FamilyMember['relationship'],
        permission_level: member.permission_level as FamilyMember['permission_level'],
        can_schedule: member.can_schedule,
        can_view_history: member.can_view_history,
        can_cancel: member.can_cancel,
        status: member.status as FamilyMember['status']
      }));
    } catch (error) {
      logger.error("Failed to fetch family members", "FamilyService", error);
      throw error;
    }
  },

  async addFamilyMember(memberData: AddFamilyMemberData): Promise<void> {
    logger.info("Adding family member", "FamilyService", { email: memberData.email });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Primeiro, verificar se o usuário existe pelo email
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberData.email)
        .single();

      if (userError || !existingUser) {
        throw new Error("Usuário não encontrado com este email");
      }

      // Adicionar o membro da família
      const { error } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          family_member_id: existingUser.id,
          relationship: memberData.relationship,
          permission_level: memberData.permission_level,
          can_schedule: memberData.can_schedule,
          can_view_history: memberData.can_view_history,
          can_cancel: memberData.can_cancel
        });

      if (error) {
        logger.error("Error adding family member", "FamilyService", error);
        throw new Error(`Erro ao adicionar membro da família: ${error.message}`);
      }

      logger.info("Family member added successfully", "FamilyService");
    } catch (error) {
      logger.error("Failed to add family member", "FamilyService", error);
      throw error;
    }
  },

  async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<void> {
    logger.info("Updating family member", "FamilyService", { memberId });
    try {
      const { error } = await supabase
        .from('family_members')
        .update({
          relationship: updates.relationship,
          permission_level: updates.permission_level,
          can_schedule: updates.can_schedule,
          can_view_history: updates.can_view_history,
          can_cancel: updates.can_cancel,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        logger.error("Error updating family member", "FamilyService", error);
        throw new Error(`Erro ao atualizar membro da família: ${error.message}`);
      }

      logger.info("Family member updated successfully", "FamilyService");
    } catch (error) {
      logger.error("Failed to update family member", "FamilyService", error);
      throw error;
    }
  },

  async removeFamilyMember(memberId: string): Promise<void> {
    logger.info("Removing family member", "FamilyService", { memberId });
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        logger.error("Error removing family member", "FamilyService", error);
        throw new Error(`Erro ao remover membro da família: ${error.message}`);
      }

      logger.info("Family member removed successfully", "FamilyService");
    } catch (error) {
      logger.error("Failed to remove family member", "FamilyService", error);
      throw error;
    }
  }
};
