import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorStat } from "./types";

interface DoctorStatsGridProps {
  stats: DoctorStat[];
  loading?: boolean;
}

const StatSkeleton = () => (
  <Card className="border border-blue-100/70">
    <CardContent className="flex flex-col gap-3 p-6">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </CardContent>
  </Card>
);

const StatCard = ({ stat }: { stat: DoctorStat }) => {
  const Icon = stat.icon;
  const trend = stat.trend;
  const isPositive = trend?.isPositive ?? true;

  return (
    <Card className="border border-blue-100/70 bg-white/80 shadow-sm transition-colors hover:border-blue-200">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
          {trend ? (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label ? <span className="text-muted-foreground">• {trend.label}</span> : null}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
        </div>
        {stat.description ? (
          <p className="text-xs text-slate-500">{stat.description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const DoctorStatsGrid = ({ stats, loading }: DoctorStatsGridProps) => {
  return (
    <Card className="border border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Indicadores de desempenho</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatSkeleton key={`stat-skeleton-${index}`} />
            ))}
          </div>
        ) : stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-blue-100 p-10 text-center text-sm text-slate-500">
            Nenhum indicador disponível ainda. Assim que você começar a atender pela plataforma, seus resultados aparecerão aqui.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
