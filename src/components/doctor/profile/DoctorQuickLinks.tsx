import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorQuickLink } from "./types";

interface DoctorQuickLinksProps {
  links: DoctorQuickLink[];
  loading?: boolean;
}

const QuickLinkSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border border-blue-100/70 bg-white/70 p-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

export const DoctorQuickLinks = ({ links, loading }: DoctorQuickLinksProps) => {
  return (
    <Card className="border border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Links rápidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <QuickLinkSkeleton key={`quick-link-skeleton-${index}`} />
          ))
        ) : links.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-100 p-6 text-center text-sm text-slate-500">
            Nenhum atalho configurado. Adicione ações frequentes para acessar as principais áreas em um clique.
          </div>
        ) : (
          links.map((link) => {
            const Icon = link.icon;
            return (
              <Button
                key={link.id}
                variant={link.variant ?? "outline"}
                onClick={link.onClick}
                className={cn(
                  "w-full justify-start gap-3 rounded-lg text-left text-sm font-medium transition-colors",
                  link.variant !== "default" && "border border-blue-100/70 bg-white/70 text-slate-700 hover:border-blue-200",
                  link.variant === "default" && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex flex-col items-start">
                  <span>{link.label}</span>
                  <span className="text-xs font-normal text-slate-500">{link.description}</span>
                </span>
              </Button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
