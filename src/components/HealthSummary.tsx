import { Heart, Activity, Thermometer, Weight, Ruler, Droplet, Zap, Plus } from "lucide-react";
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
        {/* Skeleton loading state */}
      </Card>
    );
  }

  return (
    <>
      <style jsx global>{`
        .health-summary-heart-icon {
          color: #2563EB !important;
        }
        .health-summary-score-card {
          background-color: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(4px) !important;
          border: 1px solid rgba(0, 128, 128, 0.1) !important;
        }
        .health-summary-recommendation-bullet {
          color: #2563EB !important;
          font-weight: bold !important;
        }
      `}</style>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 text-transparent bg-clip-text">
              <Heart className="h-5 w-5 health-summary-heart-icon" />
              Resumo da Saúde
            </CardTitle>
            <AddHealthMetricModal
              className="flex items-center gap-2 bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 text-white hover:opacity-90 transition"
              onAddMetric={createMetric}
              isSubmitting={isSubmitting}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {displayMetrics.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <div>
                <p className="text-muted-foreground mb-2">Nenhuma métrica registrada ainda</p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  Comece adicionando suas primeiras medições para acompanhar sua saúde
                </p>
                <AddHealthMetricModal
                  className="flex items-center gap-2 bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 text-white hover:opacity-90 transition"
                  onAddMetric={createMetric}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          ) : (
            <>
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
                      <p className="font-medium bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 text-transparent bg-clip-text text-sm truncate">
                        {metric.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.lastRecorded
                          ? `${format(new Date(metric.lastRecorded), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                          : 'Sem registro'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 text-transparent bg-clip-text text-sm">
                      {metric.value}{' '}
                      <span className="text-xs text-muted-foreground">{metric.unit}</span>
                    </p>
                    <Badge className={cn("border-0", getStatusClasses(metric.status))}>
                      {metric.status === 'normal' || metric.status === 'ideal' ? 'Normal' :
                        metric.status === 'attention' ? 'Atenção' : 'Crítico'}
                    </Badge>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 rounded-xl health-summary-score-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 text-transparent bg-clip-text">
                    Score de Saúde
                  </h3>
                  <span className={`text-2xl font-bold ${getScoreColor(healthScore.score)}`}>
                    {healthScore.score}%
                  </span>
                </div>
                <Progress value={healthScore.score} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">{healthScore.message}</p>
                {healthScore.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Recomendações:</p>
                    <ul className="text-xs text-muted-foreground/80 space-y-1">
                      {healthScore.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="health-summary-recommendation-bullet">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default HealthSummary;
