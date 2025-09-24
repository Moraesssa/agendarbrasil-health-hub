import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorAppointment } from "./types";

interface UpcomingAppointmentsListProps {
  appointments: DoctorAppointment[];
  loading?: boolean;
  onViewAll?: () => void;
}

const statusConfig: Record<DoctorAppointment["status"], { label: string; className: string }> = {
  confirmada: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  pendente: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

export const UpcomingAppointmentsList = ({
  appointments,
  loading,
  onViewAll,
}: UpcomingAppointmentsListProps) => {
  const items = loading ? Array.from({ length: 3 }) : appointments;

  return (
    <Card className="h-full border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-slate-900">
          Próximas consultas
        </CardTitle>
        <CardDescription>Organize seus atendimentos futuros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center text-sm text-blue-700">
            Nenhuma consulta agendada para os próximos dias.
          </div>
        ) : null}

        {items.map((appointment, index) => (
          <div
            key={appointment?.id ?? index}
            className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"
          >
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {appointment.patientName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {appointment.type}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit border text-xs font-semibold uppercase tracking-wide",
                      statusConfig[appointment.status].className
                    )}
                  >
                    {statusConfig[appointment.status].label}
                  </Badge>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                    <span>
                      {format(appointment.start, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{format(appointment.start, "HH:mm")}</span>
                  </div>
                  {appointment.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>{appointment.location}</span>
                    </div>
                  ) : null}
                  {appointment.notes ? (
                    <div className="text-sm text-muted-foreground">
                      {appointment.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t border-slate-100 bg-slate-50/50">
        {loading ? (
          <Skeleton className="h-10 w-36 rounded-lg" />
        ) : (
          <Button variant="outline" className="border-blue-200" onClick={onViewAll}>
            <CalendarClock className="mr-2 h-4 w-4" />
            Ver agenda completa
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
