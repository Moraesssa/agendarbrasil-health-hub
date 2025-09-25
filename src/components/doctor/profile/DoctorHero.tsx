import { Fragment } from "react";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorHeroProps } from "./types";

const getInitials = (name?: string | null) => {
  if (!name) return "MD";
  const parts = name
    .split(" ")
    .filter((part) => part.trim().length > 0)
    .slice(0, 2);

  if (parts.length === 0) return "MD";

  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
};

const renderActionButton = (
  action: DoctorHeroProps["primaryAction"],
  defaultVariant: "default" | "outline" = "default"
) => {
  if (!action) return null;

  const Icon = action.icon;

  return (
    <Button
      key={action.label}
      onClick={action.onClick}
      variant={action.variant ?? defaultVariant}
      className={cn(
        "h-10 rounded-lg px-4 text-sm font-medium transition-all",
        action.variant === "outline"
          ? "border-blue-200 text-blue-700 hover:bg-blue-50"
          : "bg-blue-600 text-white hover:bg-blue-700"
      )}
    >
      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
      {action.label}
    </Button>
  );
};

export const DoctorHero = ({
  name,
  email,
  crm,
  specialties,
  avatarUrl,
  statusBadges = [],
  primaryAction,
  secondaryAction,
  editProfileAction,
  loading,
}: DoctorHeroProps) => {
  return (
    <Card className="border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/60 to-emerald-50 shadow-sm">
      <CardHeader className="flex flex-col gap-6 pb-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
          <div className="relative">
            {loading ? (
              <Skeleton className="h-24 w-24 rounded-full" />
            ) : (
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={avatarUrl ?? undefined} alt={name ?? "Médico"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-lg font-semibold text-white">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            )}
            {!loading ? (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                Ativo
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <CardTitle className="flex flex-col gap-1 text-2xl font-semibold text-slate-900 md:flex-row md:items-center md:gap-3">
              {loading ? <Skeleton className="h-7 w-48" /> : name || "Médico sem nome"}
              {crm ? (
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  CRM {crm}
                </Badge>
              ) : null}
            </CardTitle>
            <CardDescription className="flex flex-col gap-1 text-sm text-slate-600 md:flex-row md:items-center md:gap-3">
              {loading ? (
                <Skeleton className="h-4 w-60" />
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {email ?? "E-mail não informado"}
                </span>
              )}
              {!loading ? (
                <span className="flex items-center gap-2 text-emerald-600">
                  <Sparkles className="h-4 w-4" />
                  {specialties && specialties.length > 0
                    ? specialties.join(", ")
                    : "Especialidade não informada"}
                </span>
              ) : null}
            </CardDescription>
            {loading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`badge-${index}`} className="h-6 w-32 rounded-full" />
                ))}
              </div>
            ) : statusBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {statusBadges.map((badge) => (
                  <Badge
                    key={badge.label}
                    variant={badge.variant === "outline" ? "outline" : "secondary"}
                    className={cn(
                      "border border-blue-200/80 bg-white/80 text-xs font-medium text-blue-700",
                      badge.variant === "destructive" &&
                        "border-red-200 bg-red-50 text-red-600",
                      badge.variant === "default" && "border-emerald-200 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          {loading ? (
            <div className="flex gap-3">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-36" />
            </div>
          ) : (
            <Fragment>
              {secondaryAction ? renderActionButton(secondaryAction, "outline") : null}
              {primaryAction ? renderActionButton(primaryAction, "default") : null}
            </Fragment>
          )}
          {!loading && editProfileAction ? editProfileAction : null}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Esta visão reúne informações estratégicas do seu consultório. Acompanhe métricas de atendimento, agenda,
            notificações e atualize seus dados profissionais em um único lugar.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
