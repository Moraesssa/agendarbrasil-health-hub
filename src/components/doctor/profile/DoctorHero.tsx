import { Fragment } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorHeroAction, DoctorStatusBadge } from "./types";

interface DoctorHeroProps {
  name?: string;
  email?: string;
  crm?: string;
  specialties?: string[];
  avatarUrl?: string;
  statusBadges: DoctorStatusBadge[];
  loading?: boolean;
  primaryAction: DoctorHeroAction;
  secondaryAction?: DoctorHeroAction;
  editProfileAction?: React.ReactNode;
}

const getInitials = (name?: string) => {
  if (!name) return "MD";
  const [first = "", second = ""] = name.split(" ");
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

export const DoctorHero = ({
  name,
  email,
  crm,
  specialties,
  avatarUrl,
  statusBadges,
  loading,
  primaryAction,
  secondaryAction,
  editProfileAction
}: DoctorHeroProps) => {
  const specialtyList = specialties?.length ? specialties.join(", ") : "Especialidades não informadas";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-400/10 to-emerald-500/10" aria-hidden />
      <div className="relative flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {loading ? (
            <Skeleton className="h-20 w-20 rounded-full" />
          ) : (
            <Avatar className="h-20 w-20 border-2 border-white shadow-lg">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-blue-500/10 text-lg font-semibold text-blue-900">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="space-y-3">
            {loading ? (
              <Fragment>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-64" />
              </Fragment>
            ) : (
              <Fragment>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{name}</h1>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    CRM {crm ?? "não informado"}
                  </span>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-300 sm:inline-flex" aria-hidden />
                  <span>{specialtyList}</span>
                </div>
              </Fragment>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {(loading ? Array.from({ length: 2 }) : statusBadges).map((badge, index) => (
                <Fragment key={badge?.label ?? index}>
                  {loading ? (
                    <Skeleton className="h-6 w-28 rounded-full" />
                  ) : (
                    <Badge variant={badge.variant ?? "secondary"} className="bg-white/70 text-slate-700">
                      {badge.label}
                    </Badge>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!loading && editProfileAction ? (
            <div className="sm:order-1">{editProfileAction}</div>
          ) : loading ? (
            <Skeleton className="h-10 w-32 rounded-lg" />
          ) : null}

          {secondaryAction ? (
            loading ? (
              <Skeleton className="h-10 w-36 rounded-lg" />
            ) : (
              <Button
                variant={secondaryAction.variant ?? "outline"}
                onClick={secondaryAction.onClick}
                className="sm:order-3"
              >
                {secondaryAction.icon ? (
                  <secondaryAction.icon className="mr-2 h-4 w-4" />
                ) : null}
                {secondaryAction.label}
              </Button>
            )
          ) : null}

          {loading ? (
            <Skeleton className="h-12 w-44 rounded-lg" />
          ) : (
            <Button
              size="lg"
              className="bg-blue-600 text-white shadow-lg hover:bg-blue-700 sm:order-2"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="mr-2 h-5 w-5" />
              ) : null}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
