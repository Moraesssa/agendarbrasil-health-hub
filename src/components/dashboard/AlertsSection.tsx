
import { AlertCircle, Heart, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsSection() {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-r from-yellow-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Alertas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-sm">Paciente João Santos precisa de acompanhamento especial</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-sm">Lembrete: Reunião da equipe médica às 16:00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
