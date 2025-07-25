import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PaymentVerificationButton } from "@/components/PaymentVerificationButton";

interface PendingAppointment {
  id: string;
  data_consulta: string;
  tipo_consulta: string;
  status: string;
  status_pagamento: string;
  doctor_profile?: {
    display_name: string;
  };
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
          data_consulta,
          tipo_consulta,
          status,
          status_pagamento,
          doctor_profile:profiles!consultas_medico_id_fkey(display_name)
        `)
        .eq('paciente_id', user.id)
        .eq('status_pagamento', 'pendente')
        .gte('data_consulta', new Date().toISOString())
        .order('data_consulta', { ascending: true });

      if (error) throw error;
      setPendingAppointments(data || []);
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
                    {appointment.tipo_consulta}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(appointment.data_consulta).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(appointment.data_consulta).toLocaleTimeString('pt-BR', { 
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