
import { useState, useEffect } from "react";
import { Stethoscope, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

// Type for recent appointments with patient info from profiles table
type RecentAppointment = {
  id: string;
  status: string;
  data_consulta: string;
  patient_profile: {
    display_name: string | null;
  } | null;
};

export function PacientesRecentes() {
  const { user } = useAuth();
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      logger.info("Fetching recent appointments", "PacientesRecentes", { userId: user.id });
      
      try {
        const { data, error } = await supabase
          .from('consultas')
          .select(`
            id,
            status,
            data_consulta,
            patient_profile:profiles!consultas_paciente_id_fkey (display_name)
          `)
          .eq('medico_id', user.id)
          .order('data_consulta', { ascending: false })
          .limit(4);

        if (error) {
          logger.error("Failed to fetch recent appointments", "PacientesRecentes", error);
          throw error;
        }
        
        logger.info("Recent appointments fetched successfully", "PacientesRecentes", { 
          count: data?.length || 0 
        });
        setRecentAppointments(data || []);
      } catch (error) {
        logger.error("Error fetching recent appointments", "PacientesRecentes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAppointments();
  }, [user]);

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'confirmada': 'Confirmada',
      'agendada': 'Agendada',
      'pendente': 'Pendente',
      'cancelada': 'Cancelada',
      'realizada': 'Realizada'
    };
    return statusMap[status] || status;
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          Pacientes Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentAppointments.map((consulta) => (
              <div key={consulta.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {consulta.patient_profile?.display_name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </div>
                    {consulta.status === "agendada" && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{consulta.patient_profile?.display_name || "Paciente"}</h4>
                    <p className="text-sm text-gray-600">
                      Paciente
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {new Date(consulta.data_consulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Badge 
                    variant={consulta.status === "realizada" ? "default" : 
                             consulta.status === "agendada" ? "secondary" : "outline"}
                    className={
                      consulta.status === "realizada" ? "bg-green-100 text-green-800 border-green-200 shadow-sm" :
                      consulta.status === "agendada" ? "bg-blue-100 text-blue-800 border-blue-200 shadow-sm" :
                      "bg-orange-100 text-orange-800 border-orange-200 shadow-sm"
                    }
                  >
                    {getStatusText(consulta.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
