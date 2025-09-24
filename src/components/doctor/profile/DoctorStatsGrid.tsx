import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorStat } from "./types";

interface DoctorStatsGridProps {
  stats: DoctorStat[];
  loading?: boolean;
}

export const DoctorStatsGrid = ({ stats, loading }: DoctorStatsGridProps) => {
  const items = loading ? Array.from({ length: 4 }) : stats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((stat, index) => (
        <Card key={stat?.label ?? index} className="border-blue-100/80 bg-white/80 shadow-sm backdrop-blur">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
              {loading ? (
                <Skeleton className="h-11 w-11 rounded-xl" />
              ) : stat?.icon ? (
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600")}> 
                  <stat.icon className="h-5 w-5" />
                </span>
              ) : null}

              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </span>
              )}
            </div>

            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-3xl font-semibold text-slate-900">{stat.value}</span>
            )}

            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : stat?.description ? (
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            ) : null}

            {loading ? (
              <Skeleton className="h-4 w-28" />
            ) : stat?.trend ? (
              <div
                className={cn(
                  "text-xs font-medium", 
                  stat.trend.isPositive ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {stat.trend.value}
                {stat.trend.label ? (
                  <span className="ml-1 text-muted-foreground">{stat.trend.label}</span>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
