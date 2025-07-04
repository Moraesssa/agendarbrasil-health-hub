
import { Heart, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthMetrics } from "@/hooks/useHealthMetrics";
import { AddHealthMetricModal } from "@/components/health/AddHealthMetricModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HealthSummary = () => {
  const { displayMetrics, healthScore, loading, isSubmitting, createMetric } = useHealthMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'ideal': 
        return 'bg-success/10 text-success border-success/20';
      case 'attention': 
        return 'bg-warning/10 text-warning border-warning/20';
      case 'critical': 
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default: 
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'ideal': 
        return 'text-success bg-success/10';
      case 'attention': 
        return 'text-warning bg-warning/10';
      case 'critical': 
        return 'text-destructive bg-destructive/10';
      default: 
        return 'text-muted-foreground bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Heart className="h-5 w-5" />
            Resumo da Saúde
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
    <Card className="shadow-sm border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Heart className="h-5 w-5" />
            Resumo da Saúde
          </CardTitle>
          <AddHealthMetricModal onAddMetric={createMetric} isSubmitting={isSubmitting} />
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
              <AddHealthMetricModal onAddMetric={createMetric} isSubmitting={isSubmitting} />
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
                  <div className={`p-2 rounded-full flex-shrink-0 ${getIconColor(metric.status)}`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">
                      {metric.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metric.lastRecorded 
                        ? `${format(new Date(metric.lastRecorded), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                        : 'Sem registro'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-semibold text-foreground text-sm">
                    {metric.value} <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(metric.status)}`}>
                    {metric.status === 'normal' || metric.status === 'ideal' ? 'Normal' :
                     metric.status === 'attention' ? 'Atenção' : 'Crítico'}
                  </span>
                </div>
              </div>
            ))}

            {/* Health Score */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-success/5 border border-primary/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Score de Saúde</h3>
                <span className={`text-2xl font-bold ${getScoreColor(healthScore.score)}`}>
                  {healthScore.score}%
                </span>
              </div>
              <Progress value={healthScore.score} className="h-2 mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                {healthScore.message}
              </p>
              {healthScore.recommendations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Recomendações:</p>
                  <ul className="text-xs text-muted-foreground/80 space-y-1">
                    {healthScore.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
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
  );
};

export default HealthSummary;
