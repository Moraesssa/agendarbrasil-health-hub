
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Search } from "lucide-react";

interface EspecialidadesDisponiveisProps {
  especialidades: string[];
  onEspecialidadeClick: (especialidade: string) => void;
  isSearching?: boolean;
  searchingEspecialidade?: string;
}

export const EspecialidadesDisponiveis = ({ 
  especialidades, 
  onEspecialidadeClick,
  isSearching = false,
  searchingEspecialidade
}: EspecialidadesDisponiveisProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          Especialidades Disponíveis para Encaminhamento
        </CardTitle>
        <p className="text-sm text-gray-600">
          Clique em uma especialidade para buscar médicos disponíveis
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {especialidades.map((especialidade) => (
            <Button
              key={especialidade}
              variant="outline"
              className="h-auto p-3 text-left justify-start transition-all hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
              onClick={() => onEspecialidadeClick(especialidade)}
              disabled={isSearching && searchingEspecialidade === especialidade}
            >
              <div className="flex items-center gap-2 w-full">
                {isSearching && searchingEspecialidade === especialidade ? (
                  <Search className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                )}
                <span className="text-sm font-medium leading-tight break-words">
                  {especialidade}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
