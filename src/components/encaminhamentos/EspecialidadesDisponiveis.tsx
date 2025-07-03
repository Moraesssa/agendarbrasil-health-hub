import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EspecialidadesDisponiveisProps {
  especialidades: string[];
}

export const EspecialidadesDisponiveis = ({ especialidades }: EspecialidadesDisponiveisProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Especialidades Disponíveis para Encaminhamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {especialidades.map((especialidade) => (
            <Badge key={especialidade} variant="outline" className="justify-center p-2">
              {especialidade}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};