import { Users, TrendingUp, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsData {
  pacientesHoje: number;
  receitaSemanal: number;
  proximasConsultas: number;
  tempoMedio: number;
}

interface MetricsCardsProps {
  data: MetricsData | null;
  loading: boolean;
}

const MetricCard = ({ title, value, subtext, icon: Icon, colorClass, loading }: any) => (
  <Card className={`${colorClass} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative`}>
    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
    <CardHeader className="pb-2 relative z-10">
      <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
    </CardHeader>
    <CardContent className="relative z-10">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24 bg-white/30" />
          <Skeleton className="h-4 w-32 bg-white/30" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-white/80 text-sm">{subtext}</p>
          </div>
          <Icon className="h-8 w-8 opacity-80" />
        </div>
      )}
    </CardContent>
  </Card>
);

export function MetricsCards({ data, loading }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  };

  const metrics = [
    { title: "Pacientes Hoje", value: data?.pacientesHoje ?? 0, subtext: "Consultas hoje", icon: Users, colorClass: "bg-gradient-to-br from-blue-500 to-blue-600" },
    { title: "Receita Semanal", value: formatCurrency(data?.receitaSemanal ?? 0), subtext: "Estimativa", icon: TrendingUp, colorClass: "bg-gradient-to-br from-green-500 to-green-600" },
    { title: "Próximas Consultas", value: data?.proximasConsultas ?? 0, subtext: "Hoje restante", icon: Calendar, colorClass: "bg-gradient-to-br from-purple-500 to-purple-600" },
    { title: "Tempo Médio", value: `${data?.tempoMedio ?? 0}min`, subtext: "Por consulta", icon: Clock, colorClass: "bg-gradient-to-br from-orange-500 to-orange-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} loading={loading} />
      ))}
    </div>
  );
}