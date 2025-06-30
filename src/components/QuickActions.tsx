
import { Calendar, Pill, Heart, Phone, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions = ({ onAction }: QuickActionsProps) => {
  const actions = [
    {
      icon: Calendar,
      label: "Agendar Consulta",
      color: "bg-blue-500 hover:bg-blue-600",
      action: "Agendamento de consulta",
      description: "Marque uma nova consulta"
    },
    {
      icon: Pill,
      label: "Lembrete Remédio",
      color: "bg-green-500 hover:bg-green-600",
      action: "Lembrete de medicamento",
      description: "Configure alertas para medicamentos"
    },
    {
      icon: Heart,
      label: "Check-up",
      color: "bg-red-500 hover:bg-red-600",
      action: "Agendamento de check-up",
      description: "Agende exames preventivos"
    },
    {
      icon: Phone,
      label: "Telemedicina",
      color: "bg-purple-500 hover:bg-purple-600",
      action: "Consulta por telemedicina",
      description: "Consulta online com especialistas"
    },
    {
      icon: Clock,
      label: "Urgência",
      color: "bg-orange-500 hover:bg-orange-600",
      action: "Agendamento urgente",
      description: "Para casos que precisam de atenção rápida"
    },
    {
      icon: Users,
      label: "Família",
      color: "bg-teal-500 hover:bg-teal-600",
      action: "Agendamento familiar",
      description: "Gerencie consultas da família"
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-3 sm:mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => onAction(action.action)}
              className={`${action.color} text-white flex flex-col items-center gap-1 sm:gap-2 h-auto py-3 sm:py-4 px-2 sm:px-3 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 group relative`}
              title={action.description}
            >
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {action.description}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
