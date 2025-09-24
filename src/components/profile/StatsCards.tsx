import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

export interface ProfileMetricCard {
  id: string;
  icon: LucideIcon;
  value: string | number;
  label: string;
  helperText?: string;
  tone?: "blue" | "green" | "purple" | "orange" | "emerald" | "slate";
}

interface StatsCardsProps {
  metrics: ProfileMetricCard[];
  loading?: boolean;
  emptyMessage?: string;
}

const toneClassMap: Record<NonNullable<ProfileMetricCard["tone"]>, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  orange: "text-orange-600",
  emerald: "text-emerald-600",
  slate: "text-slate-600",
};

export const StatsCards = ({ metrics, loading, emptyMessage }: StatsCardsProps) => {
  if (!loading && metrics.length === 0) {
    return emptyMessage ? (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-600">
        {emptyMessage}
      </div>
    ) : null;
  }

  const items = loading ? Array.from({ length: metrics.length || 4 }) : metrics;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((metric, index) => (
        <Card key={(metric as ProfileMetricCard)?.id ?? index} className="shadow-lg">
          <CardContent className="p-6 text-center">
            {loading ? (
              <Skeleton className="mx-auto mb-2 h-8 w-8 rounded-full" />
            ) : (
              <metric.icon
                className={`mx-auto mb-2 h-8 w-8 ${toneClassMap[metric.tone ?? "blue"]}`}
              />
            )}
            {loading ? (
              <Skeleton className="mx-auto mb-2 h-7 w-20" />
            ) : (
              <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
            )}
            {loading ? (
              <Skeleton className="mx-auto h-4 w-32" />
            ) : (
              <p className="text-sm text-gray-600">{metric.label}</p>
            )}
            {!loading && metric.helperText ? (
              <p className="mt-2 text-xs text-muted-foreground">{metric.helperText}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
