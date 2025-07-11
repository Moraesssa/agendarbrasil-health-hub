
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Phone, X, UserPlus } from "lucide-react";

interface Medico {
  id: string;
  display_name: string;
}

interface ResultadoBuscaMedicosProps {
  especialidade: string;
  medicos: Medico[];
  isVisible: boolean;
  onClose: () => void;
  onSelecionarMedico: (medico: Medico, especialidade: string) => void;
}

export const ResultadoBuscaMedicos = ({
  especialidade,
  medicos,
  isVisible,
  onClose,
  onSelecionarMedico
}: ResultadoBuscaMedicosProps) => {
  if (!isVisible) return null;

  return (
    <Card className="shadow-lg border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Médicos - {especialidade}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {medicos.length > 0 
              ? `${medicos.length} médico(s) encontrado(s)` 
              : 'Nenhum médico encontrado'
            }
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        {medicos.length > 0 ? (
          <div className="space-y-3">
            {medicos.map((medico) => (
              <div
                key={medico.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {medico.display_name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {especialidade}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => onSelecionarMedico(medico, especialidade)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Encaminhar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum médico encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Não há médicos disponíveis para a especialidade "{especialidade}" no momento.
            </p>
            <Badge variant="outline" className="text-gray-600">
              Tente outra especialidade
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
