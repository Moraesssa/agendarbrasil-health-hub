import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, User, Calendar } from "lucide-react";
import { Encaminhamento } from "@/services/encaminhamentoService";
import { getStatusColor, getStatusText } from "@/utils/encaminhamentoUtils";

interface EncaminhamentosEnviadosTabProps {
  encaminhamentosEnviados: Encaminhamento[];
}

export const EncaminhamentosEnviadosTab = ({ encaminhamentosEnviados }: EncaminhamentosEnviadosTabProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          Encaminhamentos Enviados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {encaminhamentosEnviados.map((encaminhamento) => (
          <Card key={encaminhamento.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{encaminhamento.paciente?.display_name || 'Paciente'}</h4>
                  <p className="text-gray-600">{encaminhamento.especialidade}</p>
                </div>
                <Badge 
                  variant={encaminhamento.status === "aceito" ? "default" : "secondary"}
                  className={getStatusColor(encaminhamento.status)}
                >
                  {getStatusText(encaminhamento.status)}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Para: {encaminhamento.medico_destino?.display_name || 'Especialista disponível'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(encaminhamento.data_encaminhamento).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm"><strong>Motivo:</strong> {encaminhamento.motivo}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};