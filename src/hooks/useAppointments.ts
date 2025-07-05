import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useHealthDataCache } from "@/contexts/HealthDataCacheContext";

// Temporary local type definition to avoid issues with generated types
type Consulta = {
  id: string;
  created_at: string;
  paciente_id: string | null;
  medico_id: string | null;
  data_consulta: string;
  tipo_consulta: string | null;
  status: string;
  local_consulta: string | null;
  observacoes: string | null;
  preco: number | null;
  pago: boolean;
  metodo_pagamento: string | null;
  pagamento_id: string | null;
};

// Type for appointments with doctor info from profiles table
export type AppointmentWithDoctor = Consulta & {
  doctor_profile: {
    display_name: string | null;
  } | null;
};

export const useAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lastUpdated, triggerRefetch } = useHealthDataCache();
  
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consultas")
        .select(`
          *,
          doctor_profile:profiles!consultas_medico_id_fkey (display_name)
        `)
        .order("data_consulta", { ascending: false });

      if (error) throw error;
      
      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
      toast({ title: "Erro", description: "Não foi possível carregar sua agenda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, lastUpdated]);

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: 'confirmada' })
        .eq('id', appointmentId);

      if (error) throw error;
      
      toast({
        title: "Consulta confirmada!",
        description: "Obrigado por confirmar sua presença. O médico foi notificado.",
      });
      triggerRefetch();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível confirmar a consulta.", variant: "destructive"});
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('consultas')
        .update({ status: 'cancelada' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Consulta cancelada",
        description: "Sua consulta foi cancelada com sucesso",
      });
      triggerRefetch();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível cancelar a consulta.", variant: "destructive"});
    }
  };

  return {
    appointments,
    loading,
    handleConfirmAppointment,
    handleCancelAppointment,
    refetchAppointments: fetchAppointments,
  };
};