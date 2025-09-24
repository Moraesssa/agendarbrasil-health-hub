import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorQuickLink } from "./types";

interface DoctorQuickLinksProps {
  links: DoctorQuickLink[];
  loading?: boolean;
}

export const DoctorQuickLinks = ({ links, loading }: DoctorQuickLinksProps) => {
  const items = loading ? Array.from({ length: 4 }) : links;

  return (
    <Card className="border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-slate-900">Links rápidos</CardTitle>
        <CardDescription>Acesse recursos essenciais do seu dia a dia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((link, index) => (
          <div
            key={link?.id ?? index}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm"
          >
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-blue-200"
                  onClick={link.onClick}
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  Acessar
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
