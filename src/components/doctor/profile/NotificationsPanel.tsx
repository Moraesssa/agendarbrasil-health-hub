import { AlertCircle, Bell, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorNotification } from "./types";

interface NotificationsPanelProps {
  notifications: DoctorNotification[];
  loading?: boolean;
}

const notificationConfig = {
  info: {
    icon: Bell,
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  warning: {
    icon: AlertCircle,
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  success: {
    icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
} as const;

export const NotificationsPanel = ({ notifications, loading }: NotificationsPanelProps) => {
  const items = loading ? Array.from({ length: 4 }) : notifications;

  return (
    <Card className="h-full border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-slate-900">Notificações</CardTitle>
        <CardDescription>Mantenha-se atualizado com alertas importantes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center text-sm text-blue-700">
            Nenhuma notificação recente.
          </div>
        ) : null}

        {items.map((notification, index) => {
          const config = notification?.type
            ? notificationConfig[notification.type]
            : notificationConfig.info;

          return (
            <div
              key={notification?.id ?? index}
              className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"
            >
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <config.icon className="h-4 w-4" />
                      <span className="font-semibold text-slate-900">{notification.title}</span>
                    </div>
                    <Badge variant="outline" className={config.badgeClass}>
                      {notification.type === "info"
                        ? "Informativo"
                        : notification.type === "warning"
                        ? "Atenção"
                        : "Sucesso"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {notification.time}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
