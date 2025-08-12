import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Stethoscope, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'consulta' | 'exame' | 'retorno';
  title: string;
  time?: string;
}

interface ResponsiveCalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: () => void;
  className?: string;
}

const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const EVENT_COLORS = {
  consulta: 'bg-teal-500 hover:bg-teal-600',
  exame: 'bg-blue-500 hover:bg-blue-600',
  retorno: 'bg-purple-500 hover:bg-purple-600'
};

const SIDEBAR_COLORS = {
  consulta: 'bg-teal-500',
  exame: 'bg-blue-500',
  retorno: 'bg-pink-500'
};

export function ResponsiveCalendar({ 
  events = [], 
  onDateSelect, 
  onEventClick, 
  onAddEvent,
  className 
}: ResponsiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { calendarDays, monthYear } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return {
      calendarDays: days,
      monthYear: `${MONTHS[month]} ${year}`
    };
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                AgendarBrasil
              </h1>
              <p className="text-sm text-gray-600">Health Hub</p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onAddEvent}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium"
        >
          AGENDAR
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar com indicadores */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="flex lg:flex-col gap-2 lg:gap-4 justify-center lg:justify-start">
            <div className={cn("w-8 h-16 lg:w-full lg:h-20 rounded-lg", SIDEBAR_COLORS.consulta)} />
            <div className={cn("w-8 h-16 lg:w-full lg:h-20 rounded-lg", SIDEBAR_COLORS.exame)} />
            <div className={cn("w-8 h-16 lg:w-full lg:h-20 rounded-lg", SIDEBAR_COLORS.retorno)} />
          </div>
          
          {/* Legenda - apenas em desktop */}
          <div className="hidden lg:block mt-6 space-y-2">
            <div className="text-xs font-medium text-gray-700">Tipos:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded-full" />
                <span className="text-xs text-gray-600">Consulta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-xs text-gray-600">Exame</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full" />
                <span className="text-xs text-gray-600">Retorno</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendário principal */}
        <div className="lg:col-span-11 order-1 lg:order-2">
          <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            {/* Header do calendário */}
            <div className="flex justify-between items-center mb-6">
              <Button
                variant="ghost"
                onClick={() => navigateMonth('prev')}
                className="p-2"
              >
                ←
              </Button>
              
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {monthYear}
              </h2>
              
              <Button
                variant="ghost"
                onClick={() => navigateMonth('next')}
                className="p-2"
              >
                →
              </Button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-medium text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const hasEvents = dayEvents.length > 0;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "relative aspect-square flex flex-col items-center justify-center cursor-pointer rounded-lg transition-all duration-200 hover:bg-gray-50",
                      "min-h-[40px] sm:min-h-[60px]",
                      !isCurrentMonth(date) && "text-gray-300",
                      isToday(date) && "bg-blue-50 border-2 border-blue-200",
                      isSelected(date) && "bg-blue-100 border-2 border-blue-400",
                      hasEvents && "font-semibold"
                    )}
                  >
                    <span className="text-sm sm:text-base">
                      {date.getDate()}
                    </span>
                    
                    {/* Eventos do dia */}
                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {dayEvents.slice(0, 3).map((event, eventIndex) => {
                          if (event.type === 'consulta' || event.type === 'exame') {
                            return (
                              <Button
                                key={eventIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEventClick?.(event);
                                }}
                                className={cn(
                                  "h-4 sm:h-6 px-2 sm:px-3 text-xs rounded-full text-white font-medium",
                                  EVENT_COLORS[event.type]
                                )}
                              >
                                {event.type === 'consulta' ? 'Consulta' : 'Exame'}
                              </Button>
                            );
                          }
                          return (
                            <div
                              key={eventIndex}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                event.type === 'consulta' && "bg-teal-500",
                                event.type === 'exame' && "bg-blue-500",
                                event.type === 'retorno' && "bg-pink-500"
                              )}
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                        )}
                      </div>
                    )}
                    
                    {/* Indicador especial para dias destacados */}
                    {date.getDate() === 20 && isCurrentMonth(date) && (
                      <div className="absolute inset-0 rounded-lg border-2 border-blue-500 bg-blue-500 text-white flex items-center justify-center font-bold">
                        20
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Botão flutuante para mobile */}
      <Button
        onClick={onAddEvent}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>

      {/* Legenda mobile */}
      <div className="lg:hidden mt-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-3">Tipos de Agendamento:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-500 rounded-full" />
            <span className="text-sm text-gray-600">Consulta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-sm text-gray-600">Exame</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full" />
            <span className="text-sm text-gray-600">Retorno</span>
          </div>
        </div>
      </div>
    </div>
  );
}