
import { Heart, Activity, Thermometer, Weight, Ruler, Droplet, Zap, Calendar, Pill, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";
import { AddHealthMetricModal } from "@/components/health/AddHealthMetricModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const HealthSummary = () => {
  const { displayMetrics, healthScore, loading, isSubmitting, createMetric } = useHealthMetrics();

  const getStatusClasses = (status: string): string => {
    switch (status) {
      case 'ideal':
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const primaryColor = '#2563EB'; // Cor azul para o ícone e bullets

  // Métricas específicas solicitadas pelo usuário
  const specificMetrics = [
    {
      icon: Calendar,
      label: "Consultas este mês",
      value: "3",
      unit: "",
      status: "normal",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Pill,
      label: "Medicamentos ativos",
      value: "2",
      unit: "",
      status: "normal",
      color: "from-green-500 to-green-600"
    },
    {
      icon: FileText,
      label: "Próximos exames",
      value: "1",
      unit: "",
      status: "attention",
      color: "from-purple-500 to-purple-600"
    }
  ];

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Heart className="h-3 w-3 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-800 to-green-700 bg-clip-text text-transparent font-bold">
              Resumo da Saúde
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Heart className="h-3 w-3 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-800 to-green-700 bg-clip-text text-transparent font-bold">
              Resumo da Saúde
            </span>
          </CardTitle>
          <AddHealthMetricModal onAddMetric={createMetric} isSubmitting={isSubmitting} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Specific Health Metrics */}
        <div className="space-y-3">
          {specificMetrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-white via-white to-gray-50 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-3 rounded-full bg-gradient-to-r ${metric.color} shadow-md`}>
                  <metric.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-base">{metric.label}</p>
                  <p className="text-sm text-gray-500">
                    Atualizado hoje
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                  {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                </p>
                <Badge className={cn("border-0 text-xs", getStatusClasses(metric.status))}>
                  {metric.status === 'normal' || metric.status === 'ideal' ? 'Normal' :
                    metric.status === 'attention' ? 'Atenção' : 'Crítico'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Health Metrics from API */}
        {displayMetrics.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Métricas Adicionais</h3>
            {displayMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2 rounded-full flex-shrink-0", getStatusClasses(metric.status))}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">{metric.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.lastRecorded
                        ? `${format(new Date(metric.lastRecorded), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        : 'Sem registro'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-semibold text-foreground text-sm">
                    {metric.value} <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  </p>
                  <Badge className={cn("border-0", getStatusClasses(metric.status))}>
                    {metric.status === 'normal' || metric.status === 'ideal' ? 'Normal' :
                      metric.status === 'attention' ? 'Atenção' : 'Crítico'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Health Score */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold bg-gradient-to-r from-blue-700 to-green-700 bg-clip-text text-transparent">
              Score de Saúde
            </h3>
            <span className={`text-2xl font-bold ${getScoreTextColor(healthScore.score)}`}>
              {healthScore.score}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress 
              value={healthScore.score} 
              className="h-2 flex-1"
              style={{
                background: 'linear-gradient(to right, #3B82F6, #10B981)'
              }}
            />
            <span className="text-sm text-muted-foreground">{healthScore.score}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{healthScore.message}</p>
          {healthScore.recommendations.length > 0 && (
            <div className="space-y-1 mt-3">
              <p className="text-xs font-medium text-muted-foreground">Recomendações:</p>
              <ul className="text-xs text-muted-foreground/80 space-y-1">
                {healthScore.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Empty State */}
        {displayMetrics.length === 0 && (
          <div className="text-center py-6 space-y-4 border-t border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground mb-2">Adicione suas métricas de saúde</p>
              <p className="text-sm text-muted-foreground/80 mb-4">
                Monitore sua saúde com métricas personalizadas
              </p>
              <AddHealthMetricModal onAddMetric={createMetric} isSubmitting={isSubmitting} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthSummary;
