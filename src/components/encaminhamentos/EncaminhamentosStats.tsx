import { Card, CardContent } from "@/components/ui/card";
import { Send, Inbox, Clock, CheckCircle } from "lucide-react";
import { Encaminhamento } from "@/services/encaminhamentoService";

interface EncaminhamentosStatsProps {
  encaminhamentosEnviados: Encaminhamento[];
  encaminhamentosRecebidos: Encaminhamento[];
}

export const EncaminhamentosStats = ({
  encaminhamentosEnviados,
  encaminhamentosRecebidos
}: EncaminhamentosStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="shadow-lg">
        <CardContent className="p-4 text-center">
          <Send className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{encaminhamentosEnviados.length}</h3>
          <p className="text-sm text-gray-600">Enviados</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardContent className="p-4 text-center">
          <Inbox className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{encaminhamentosRecebidos.length}</h3>
          <p className="text-sm text-gray-600">Recebidos</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">
            {encaminhamentosEnviados.filter(e => e.status === "aguardando").length}
          </h3>
          <p className="text-sm text-gray-600">Aguardando</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardContent className="p-4 text-center">
          <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">
            {encaminhamentosEnviados.filter(e => e.status === "aceito").length}
          </h3>
          <p className="text-sm text-gray-600">Confirmados</p>
        </CardContent>
      </Card>
    </div>
  );
};