import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DoctorAppointment } from "./types";

interface DoctorCalendarProps {
  appointments: DoctorAppointment[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  loading?: boolean;
}

const CalendarSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, index) => (
        <Skeleton key={`day-skeleton-${index}`} className="h-16 rounded-lg" />
      ))}
    </div>
  </div>
);

const formatDayKey = (date: Date) => format(date, "yyyy-MM-dd");

export const DoctorCalendar = ({
  appointments,
  selectedDate,
  onSelectDate,
  loading,
}: DoctorCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date())
  );

  useEffect(() => {
    if (!selectedDate) return;
    setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const appointmentsByDay = useMemo(() => {
    return appointments.reduce<Record<string, DoctorAppointment[]>>((acc, appointment) => {
      const key = formatDayKey(appointment.start);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(appointment);
      acc[key].sort((a, b) => a.start.getTime() - b.start.getTime());
      return acc;
    }, {});
  }, [appointments]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedKey = selectedDate ? formatDayKey(selectedDate) : null;
  const todaysKey = formatDayKey(new Date());

  const selectedAppointments = selectedKey ? appointmentsByDay[selectedKey] ?? [] : [];

  const handleSelectDay = (day: Date) => {
    onSelectDate?.(day);
  };

  return (
    <Card className="border border-blue-100/80 bg-white/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Calendário de atendimentos
            </CardTitle>
            <CardDescription>
              Visualize suas consultas agendadas e selecione um dia para ver os detalhes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
              disabled={loading}
              aria-label="Mês anterior"
            >
              ‹
            </Button>
            <span className="min-w-[140px] text-center text-sm font-semibold text-slate-700">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              disabled={loading}
              aria-label="Próximo mês"
            >
              ›
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
              {"Dom Seg Ter Qua Qui Sex Sáb".split(" ").map((day) => (
                <span key={day} className="px-2 py-1">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const key = formatDayKey(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const hasAppointments = Boolean(appointmentsByDay[key]?.length);
                const isSelected = selectedKey ? key === selectedKey : false;
                const isCurrentDay = key === todaysKey;

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                      isCurrentMonth
                        ? "border-blue-100 bg-white/80 text-slate-700 hover:border-blue-200"
                        : "border-transparent bg-slate-50 text-slate-400",
                      isCurrentDay && "border-blue-400 text-blue-700 shadow",
                      isSelected && "border-blue-500 bg-blue-50 text-blue-700",
                      hasAppointments && "relative"
                    )}
                  >
                    {hasAppointments ? (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500" />
                    ) : null}
                    <span>{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg border border-blue-100/70 bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {selectedDate
                    ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                    : "Selecione um dia"}
                </div>
                <Badge variant="outline" className="text-xs text-slate-500">
                  {selectedAppointments.length} compromisso(s)
                </Badge>
              </div>
              {selectedAppointments.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Nenhum compromisso para este dia. Use os links rápidos para adicionar bloqueios ou agendar um retorno.
                </p>
              ) : (
                <ul className="space-y-3">
                  {selectedAppointments.map((appointment) => (
                    <li
                      key={`${appointment.id}-${appointment.start.toISOString()}`}
                      className="flex items-center justify-between rounded-lg border border-blue-100 bg-white/80 p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{appointment.patientName}</p>
                        <p className="text-xs text-slate-500">
                          {format(appointment.start, "HH:mm", { locale: ptBR })}
                          {appointment.end
                            ? ` às ${format(appointment.end, "HH:mm", { locale: ptBR })}`
                            : null}
                          {appointment.location ? ` • ${appointment.location}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1 text-xs text-blue-600">
                        <Users className="h-3.5 w-3.5" /> {appointment.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
