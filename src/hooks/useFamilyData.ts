import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FamilyMember } from '@/types/family';
import { useToast } from '@/hooks/use-toast';

export const useFamilyData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFamilyMembers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_family_members', {
        user_uuid: user.id
      });

      if (error) throw error;
      setFamilyMembers((data || []).map(member => ({
        ...member,
        relationship: member.relationship as "spouse" | "child" | "parent" | "sibling" | "other",
        permission_level: member.permission_level as "admin" | "manager" | "viewer",
        status: member.status as "active" | "pending" | "inactive"
      })));
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast({
        title: "Erro ao carregar membros da família",
        description: "Não foi possível carregar os membros da família.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [user]);

  return {
    familyMembers,
    isLoading,
    refetch: fetchFamilyMembers
  };
};