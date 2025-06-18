
import { Users, TrendingUp, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Pacientes Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">12</div>
              <p className="text-blue-100 text-sm">+3 vs ontem</p>
            </div>
            <Users className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Receita Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">R$ 24.6k</div>
              <p className="text-green-100 text-sm">+15% vs sem. ant.</p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Próximas Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">8</div>
              <p className="text-purple-100 text-sm">Hoje restante</p>
            </div>
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Tempo Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">32min</div>
              <p className="text-orange-100 text-sm">Por consulta</p>
            </div>
            <Clock className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
