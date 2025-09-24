import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorAppointment } from "./types";

interface DoctorCalendarProps {
  appointments: DoctorAppointment[];
  selectedDate?: Date;
  onSelectDate: (date: Date | undefined) => void;
  loading?: boolean;
}

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const DoctorCalendar = ({
  appointments,
  selectedDate,
  onSelectDate,
  loading,
}: DoctorCalendarProps) => {
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>();

    appointments.forEach((appointment) => {
      const key = appointment.start.toDateString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(appointment);
    });

    return map;
  }, [appointments]);

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter((appointment) => isSameDay(appointment.start, selectedDate));
  }, [appointments, selectedDate]);

  const bookedDates = useMemo(() => appointments.map((appointment) => appointment.start), [appointments]);

  return (
    <Card id="calendario" className="border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-900">Calendário</CardTitle>
        <CardDescription>Selecione uma data para visualizar seus compromissos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={loading ? "pointer-events-none opacity-60" : undefined}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            locale={ptBR}
            modifiers={{ booked: bookedDates }}
            modifiersClassNames={{
              booked: "bg-blue-100 text-blue-700 font-semibold",
            }}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {selectedDate
              ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
              : "Selecione uma data"}
          </h3>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : eventsForSelectedDate.length ? (
            <ul className="space-y-3">
              {eventsForSelectedDate.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{event.patientName}</p>
                      <p className="text-xs text-blue-800/70">{event.type}</p>
                    </div>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {format(event.start, "HH:mm")}h
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : selectedDate ? (
            <p className="text-sm text-muted-foreground">
              Nenhum compromisso para a data selecionada.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolha uma data para visualizar seus atendimentos.
            </p>
          )}
        </div>

        {!loading && appointments.length ? (
          <div className="rounded-xl border border-dashed border-blue-200 p-4 text-xs text-slate-500">
            {eventsByDate.size} dias com atendimentos agendados este mês.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
