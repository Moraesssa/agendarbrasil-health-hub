import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, ArrowRightLeft, Calendar } from "lucide-react";
import { Encaminhamento } from "@/services/encaminhamentoService";
import { getStatusColor, getStatusText } from "@/utils/encaminhamentoUtils";

interface EncaminhamentosRecebidosTabProps {
  encaminhamentosRecebidos: Encaminhamento[];
  onAceitar: (id: string, pacienteNome: string) => Promise<void>;
  onRejeitar: (id: string) => Promise<void>;
}

export const EncaminhamentosRecebidosTab = ({ 
  encaminhamentosRecebidos, 
  onAceitar, 
  onRejeitar 
}: EncaminhamentosRecebidosTabProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-green-600" />
          Encaminhamentos Recebidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {encaminhamentosRecebidos.map((encaminhamento) => (
          <Card key={encaminhamento.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{encaminhamento.paciente?.display_name || 'Paciente'}</h4>
                  <p className="text-gray-600">De: {encaminhamento.medico_origem?.display_name || 'Médico'}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className={getStatusColor(encaminhamento.status)}>
                    {getStatusText(encaminhamento.status)}
                  </Badge>
                  {encaminhamento.status === 'aguardando' && (
                    <>
                      <Button 
                        size="sm"
                        onClick={() => onAceitar(encaminhamento.id, encaminhamento.paciente?.display_name || 'Paciente')}
                      >
                        Aceitar
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onRejeitar(encaminhamento.id)}
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  <span>Especialidade: {encaminhamento.especialidade}</span>
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