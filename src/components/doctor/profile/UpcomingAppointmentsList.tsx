import { CalendarClock, Video, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorAppointment } from "./types";

interface UpcomingAppointmentsListProps {
  appointments: DoctorAppointment[];
  loading?: boolean;
  onViewAll?: () => void;
}

const AppointmentSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border border-blue-100/70 bg-white/70 p-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
  </div>
);

const getStatusConfig = (status: DoctorAppointment["status"]) => {
  switch (status) {
    case "confirmada":
    case "scheduled":
      return { label: "Confirmada", className: "bg-emerald-50 text-emerald-700" };
    case "pendente":
      return { label: "Pendente", className: "bg-amber-50 text-amber-700" };
    case "cancelada":
    case "cancelled":
      return { label: "Cancelada", className: "bg-red-50 text-red-600" };
    case "completed":
      return { label: "Concluída", className: "bg-blue-50 text-blue-700" };
    default:
      return { label: "Agendada", className: "bg-slate-100 text-slate-600" };
  }
};

const getTypeConfig = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes("tele")) {
    return {
      label: "Telemedicina",
      icon: Video,
      className: "bg-blue-50 text-blue-600",
    };
  }
  return {
    label: "Presencial",
    icon: MapPin,
    className: "bg-slate-100 text-slate-600",
  };
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter((part) => part.trim().length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .padEnd(2, "P");
};

const AppointmentItem = ({ appointment }: { appointment: DoctorAppointment }) => {
  const { label: statusLabel, className: statusClassName } = getStatusConfig(appointment.status);
  const typeConfig = getTypeConfig(appointment.type);
  const start = appointment.start;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-100/70 bg-white/70 p-3 transition-colors hover:border-blue-200">
      <Avatar className="h-10 w-10 bg-blue-100 text-blue-700">
        <AvatarFallback className="text-sm font-semibold">
          {getInitials(appointment.patientName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{appointment.patientName}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {format(start, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </span>
          {appointment.location ? <span>• {appointment.location}</span> : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge className={cn("text-xs font-medium", statusClassName)}>{statusLabel}</Badge>
        <Badge className={cn("flex items-center gap-1 text-xs", typeConfig.className)}>
          <typeConfig.icon className="h-3.5 w-3.5" />
          {typeConfig.label}
        </Badge>
      </div>
    </div>
  );
};

export const UpcomingAppointmentsList = ({
  appointments,
  loading,
  onViewAll,
}: UpcomingAppointmentsListProps) => {
  return (
    <Card className="h-full border border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Próximas consultas</CardTitle>
            <CardDescription>
              Acompanhe os próximos atendimentos confirmados e pendentes na sua agenda.
            </CardDescription>
          </div>
          {onViewAll ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Ver agenda completa
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <AppointmentSkeleton key={`appointment-skeleton-${index}`} />
          ))
        ) : appointments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-100 p-8 text-center text-sm text-slate-500">
            Não há consultas agendadas para os próximos dias. Assim que novas solicitações forem aprovadas, elas aparecerão
            aqui.
          </div>
        ) : (
          appointments.map((appointment) => (
            <AppointmentItem key={appointment.id} appointment={appointment} />
          ))
        )}
      </CardContent>
      <CardFooter className="border-t border-blue-50 bg-blue-50/50 py-4 text-xs text-slate-600">
        Atualizado automaticamente a cada 5 minutos.
      </CardFooter>
    </Card>
  );
};
