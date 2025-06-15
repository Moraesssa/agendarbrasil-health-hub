
import { Activity, Heart, Thermometer, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const HealthSummary = () => {
  const healthMetrics = [
    {
      label: "Pressão Arterial",
      value: "120/80",
      unit: "mmHg",
      status: "normal",
      icon: Heart,
      color: "text-green-600"
    },
    {
      label: "Frequência Cardíaca",
      value: "72",
      unit: "bpm",
      status: "normal",
      icon: Activity,
      color: "text-blue-600"
    },
    {
      label: "Temperatura",
      value: "36.5",
      unit: "°C",
      status: "normal",
      icon: Thermometer,
      color: "text-orange-600"
    },
    {
      label: "Peso",
      value: "70.2",
      unit: "kg",
      status: "ideal",
      icon: Weight,
      color: "text-purple-600"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'ideal': return 'bg-green-100 text-green-700';
      case 'atenção': return 'bg-yellow-100 text-yellow-700';
      case 'crítico': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Heart className="h-5 w-5" />
          Resumo da Saúde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthMetrics.map((metric, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-gray-50 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-gray-100 ${metric.color}`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {metric.label}
                </p>
                <p className="text-xs text-gray-500">
                  Última medição
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {metric.value} <span className="text-sm text-gray-500">{metric.unit}</span>
              </p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
          </div>
        ))}

        {/* Health Score */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">Score de Saúde</h3>
            <span className="text-2xl font-bold text-blue-600">85%</span>
          </div>
          <Progress value={85} className="h-2 mb-2" />
          <p className="text-sm text-gray-600">
            Excelente! Continue mantendo seus hábitos saudáveis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthSummary;
