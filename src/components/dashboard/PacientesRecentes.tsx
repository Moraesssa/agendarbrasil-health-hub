
import { Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pacientesRecentes = [
  { id: 1, nome: "Maria Silva", idade: 45, tipo: "Consulta Regular", status: "Concluída", horario: "09:00" },
  { id: 2, nome: "João Santos", idade: 32, tipo: "Retorno", status: "Em andamento", horario: "10:30" },
  { id: 3, nome: "Ana Costa", idade: 28, tipo: "Emergência", status: "Agendada", horario: "14:00" },
  { id: 4, nome: "Carlos Lima", idade: 55, tipo: "Telemedicina", status: "Agendada", horario: "15:30" }
];

export function PacientesRecentes() {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          Pacientes Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pacientesRecentes.map((paciente) => (
            <div key={paciente.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {paciente.nome.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{paciente.nome}</h4>
                  <p className="text-sm text-gray-600">{paciente.idade} anos • {paciente.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{paciente.horario}</span>
                <Badge 
                  variant={paciente.status === "Concluída" ? "default" : 
                           paciente.status === "Em andamento" ? "secondary" : "outline"}
                  className={
                    paciente.status === "Concluída" ? "bg-green-100 text-green-800 border-green-200" :
                    paciente.status === "Em andamento" ? "bg-blue-100 text-blue-800 border-blue-200" :
                    "bg-orange-100 text-orange-800 border-orange-200"
                  }
                >
                  {paciente.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
