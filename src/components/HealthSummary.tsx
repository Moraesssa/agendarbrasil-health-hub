import { Heart, Activity, Thermometer, Weight, Ruler, Droplet, Zap } from "lucide-react";
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

  // Função que retorna a CLASSE de cor para o TEXTO do score
  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const primaryColor = '#2563EB'; // Cor azul para o ícone e bullets

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
        {/* ... Skeleton loading state ... */}
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Heart className="h-5 w-5" style={{ color: primaryColor }} />
            Resumo da Saúde
          </CardTitle>
          <AddHealthMetricModal onAddMetric={createMetric} isSubmitting={isSubmitting} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayMetrics.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            {/* ... Conteúdo para quando não há métricas ... */}
          </div>
        ) : (
          <>
            {displayMetrics.map((metric, index) => (
              // ... Mapeamento das métricas ...
              null
            ))}

            <div className="mt-6 p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-black/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Score de Saúde</h3>
                <span className={`text-2xl font-bold ${getScoreTextColor(healthScore.score)}`}>
                  {healthScore.score}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={healthScore.score} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground">{healthScore.score}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{healthScore.message}</p>
              {healthScore.recommendations.length > 0 && (
                <div className="space-y-1 mt-3">
                  <p className="text-xs font-medium text-muted-foreground">Recomendações:</p>
                  <ul className="text-xs text-muted-foreground/80 space-y-1">
                    {healthScore.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold" style={{ color: primaryColor }}>•</span>
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