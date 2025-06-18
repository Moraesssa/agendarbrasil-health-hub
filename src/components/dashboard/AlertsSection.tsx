
import { AlertCircle, Heart, Clock, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsSection() {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Alertas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-red-100 hover:border-red-200 transition-colors shadow-sm">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-1">Acompanhamento Especial</p>
              <p className="text-xs text-gray-600">Paciente João Santos precisa de acompanhamento especial</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors shadow-sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-1">Reunião Agendada</p>
              <p className="text-xs text-gray-600">Reunião da equipe médica às 16:00</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-purple-100 hover:border-purple-200 transition-colors shadow-sm">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-1">Notificação</p>
              <p className="text-xs text-gray-600">3 novos resultados de exames disponíveis</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
