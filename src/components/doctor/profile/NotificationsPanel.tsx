import { AlertCircle, Bell, CalendarDays, CheckCircle2, Info, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorNotification } from "./types";

interface NotificationsPanelProps {
  notifications: DoctorNotification[];
  loading?: boolean;
}

const NotificationSkeleton = () => (
  <div className="flex flex-col gap-2 rounded-lg border border-blue-100/70 bg-white/70 p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
    <Skeleton className="h-3 w-24" />
  </div>
);

const notificationIconMap = {
  appointment: CalendarDays,
  system: Bell,
  message: MessageSquare,
  info: Info,
  warning: AlertCircle,
  success: CheckCircle2,
} satisfies Record<DoctorNotification["type"], typeof Bell>;

const notificationVariantMap = {
  appointment: "bg-blue-50 text-blue-700",
  system: "bg-slate-100 text-slate-600",
  message: "bg-purple-50 text-purple-600",
  info: "bg-sky-50 text-sky-600",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
} satisfies Record<DoctorNotification["type"], string>;

const NotificationItem = ({ notification }: { notification: DoctorNotification }) => {
  const Icon = notificationIconMap[notification.type] ?? Bell;
  const badgeStyles = notificationVariantMap[notification.type] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-lg border border-blue-100/70 bg-white/80 p-4 transition-colors hover:border-blue-200">
      <div className="flex items-start gap-3">
        <div className={cn("rounded-full p-2", badgeStyles)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
            <Badge className="text-xs font-medium text-slate-500" variant="outline">
              {notification.time}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">{notification.description}</p>
        </div>
      </div>
    </div>
  );
};

export const NotificationsPanel = ({ notifications, loading }: NotificationsPanelProps) => {
  return (
    <Card className="border border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <NotificationSkeleton key={`notification-skeleton-${index}`} />
          ))
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-100 p-8 text-center text-sm text-slate-500">
            Nenhuma notificação recente. Assim que houver atualizações importantes, elas aparecerão aqui.
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </CardContent>
    </Card>
  );
};
