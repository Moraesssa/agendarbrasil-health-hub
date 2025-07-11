
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEncaminhamentos } from "@/hooks/useEncaminhamentos";
import { Encaminhamento } from "@/services/encaminhamentoService";

export const EncaminhamentoNotifications = () => {
  const navigate = useNavigate();
  const { encaminhamentosRecebidos, loading } = useEncaminhamentos();
  const [recentEncaminhamentos, setRecentEncaminhamentos] = useState<Encaminhamento[]>([]);

  useEffect(() => {
    // Filtrar encaminhamentos recentes (últimas 24 horas) e não processados
    const recent = encaminhamentosRecebidos.filter(enc => {
      const isRecent = new Date(enc.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000);
      const isPending = enc.status === 'aguardando';
      return isRecent && isPending;
    }).slice(0, 3);
    
    setRecentEncaminhamentos(recent);
  }, [encaminhamentosRecebidos]);

  if (loading || recentEncaminhamentos.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Mail className="h-5 w-5 text-blue-600" />
          Encaminhamentos Pendentes
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {recentEncaminhamentos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {recentEncaminhamentos.map((encaminhamento) => (
            <div 
              key={encaminhamento.id}
              className="flex items-center gap-3 p-4 bg-white/80 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {encaminhamento.paciente?.display_name}
                  </p>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <Badge variant="outline" className="text-xs">
                    {encaminhamento.especialidade}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  De: Dr. {encaminhamento.medico_origem?.display_name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-400">
                    {new Date(encaminhamento.data_encaminhamento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-3 border-t border-blue-100">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => navigate('/encaminhamentos-medico')}
            >
              Ver todos os encaminhamentos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
