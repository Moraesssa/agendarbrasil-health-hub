
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, BarChart3, Settings } from "lucide-react";

interface StatCard {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  color: string;
}

const stats: StatCard[] = [
  {
    icon: Calendar,
    value: 24,
    label: "Consultas este mês",
    color: "text-blue-600"
  },
  {
    icon: Users,
    value: 156,
    label: "Pacientes ativos",
    color: "text-green-600"
  },
  {
    icon: BarChart3,
    value: "4.8",
    label: "Avaliação média",
    color: "text-purple-600"
  },
  {
    icon: Settings,
    value: "85%",
    label: "Taxa de ocupação",
    color: "text-orange-600"
  }
];

export const StatsCards = () => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-lg">
          <CardContent className="p-6 text-center">
            <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
