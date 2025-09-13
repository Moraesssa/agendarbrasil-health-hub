
import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PaymentVerificationButton } from "@/components/PaymentVerificationButton";

interface PendingAppointment {
  id: string;
  consultation_date: string;
  consultation_type: string;
  status: string;
  status_pagamento: string;
  doctor_profile?: {
    display_name: string | null;
  } | null;
}

export function PendingAppointmentsAlert() {
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('consultas')
        .select(`
          id,
          consultation_date,
          consultation_type,
          status,
          status_pagamento,
          doctor_profile:profiles (display_name)
        `)
        .eq('paciente_id', user.id)
        .eq('status_pagamento', 'pendente')
        .gte('consultation_date', new Date().toISOString())
        .order('consultation_date', { ascending: true });

      if (error) throw error;
      
      // Process data and handle cases where profile might be missing
      const processedData: PendingAppointment[] = (data || []).map(item => ({
        id: String(item.id), // Convert number to string
        consultation_date: item.consultation_date,
        consultation_type: item.consultation_type,
        status: item.status,
        status_pagamento: item.status_pagamento,
        doctor_profile: Array.isArray(item.doctor_profile) 
          ? item.doctor_profile[0] || { display_name: null }
          : item.doctor_profile || { display_name: null }
      }));
      
      setPendingAppointments(processedData);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAppointments();

    // Listen for consultation updates
    const handleConsultaUpdate = () => {
      fetchPendingAppointments();
    };

    window.addEventListener('consultaUpdated', handleConsultaUpdate);
    return () => window.removeEventListener('consultaUpdated', handleConsultaUpdate);
  }, []);

  if (loading || pendingAppointments.length === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        Consultas com Pagamento Pendente
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          {pendingAppointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {appointment.doctor_profile?.display_name || 'Médico'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {appointment.consultation_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(appointment.consultation_date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(appointment.consultation_date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pagamento Pendente
                  </Badge>
                </div>
              </div>
              <PaymentVerificationButton
                consultaId={appointment.id}
                onSuccess={() => {
                  fetchPendingAppointments();
                  window.dispatchEvent(new CustomEvent('consultaUpdated'));
                }}
              />
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
