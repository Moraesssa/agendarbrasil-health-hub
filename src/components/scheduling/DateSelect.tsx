import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAvailableDates } from "@/hooks/useAvailableDates";

interface DateSelectProps {
  doctorId: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  disabled?: boolean;
  // Backward compatibility - deprecated props
  onChange?: (date: string) => void;
}

export function DateSelect({ 
  doctorId,
  selectedDate, 
  onDateSelect,
  onNext,
  onPrevious,
  disabled = false,
  // Backward compatibility
  onChange
}: DateSelectProps) {
  const dateValue = selectedDate ? new Date(selectedDate.replace(/-/g, '/')) : undefined;

  // Use the available dates hook
  const { 
    availableDates, 
    isLoading, 
    error, 
    refetch, 
    clearError,
    retryCount,
    isRetrying
  } = useAvailableDates(doctorId, {
    enabled: !!doctorId,
    maxRetries: 3,
    retryDelay: 1000
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      // Use new prop if available, fallback to old prop for backward compatibility
      if (onDateSelect) {
        onDateSelect(formattedDate);
      } else if (onChange) {
        onChange(formattedDate);
      }
    }
  };

  // Function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    const dateString = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateString);
  };

  // Function to disable dates in the calendar
  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    // If we're loading or have an error, don't disable any future dates
    if (isLoading || error) {
      return false;
    }
    
    // If we have available dates, only enable those dates
    if (availableDates.length > 0) {
      return !isDateAvailable(date);
    }
    
    // If no available dates loaded yet, don't disable any future dates
    return false;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="pb-4">
        <CardTitle 
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-lg sm:text-xl font-semibold text-gray-800"
          id="date-select-title"
        >
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span>Selecione a Data da Consulta</span>
        </CardTitle>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </CardHeader>
      
      <CardContent className="space-y-6" role="main" aria-labelledby="date-select-title">
        {/* Date Selection Section */}
        <div className="space-y-4">
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-14 justify-start text-left font-medium border-2 transition-all duration-200",
                    "hover:border-blue-300 hover:bg-blue-50/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    selectedDate 
                      ? "border-green-300 bg-green-50/50 text-green-800" 
                      : "border-gray-200 text-gray-600",
                    disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
                  )}
                  disabled={disabled || isLoading}
                  aria-label={
                    isLoading 
                      ? "Carregando datas disponíveis" 
                      : selectedDate 
                        ? `Data selecionada: ${format(dateValue!, "EEEE, dd 'de' MMMM", { locale: ptBR })}`
                        : "Clique para selecionar uma data"
                  }
                  aria-expanded="false"
                  aria-haspopup="dialog"
                >
                  <div className="flex items-center gap-3 w-full">
                    {isLoading ? (
                      <>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Carregando datas...</p>
                          <p className="text-xs text-gray-500">Aguarde um momento</p>
                        </div>
                      </>
                    ) : selectedDate ? (
                      <>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{format(dateValue!, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                          <p className="text-xs text-gray-500">Data selecionada</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">Escolha uma data</p>
                          <p className="text-xs text-gray-500">Clique para abrir o calendário</p>
                        </div>
                      </>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 shadow-xl border-0" 
                align="start"
                role="dialog"
                aria-label="Seletor de data"
              >
                {isLoading ? (
                  <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-white">
                    <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-700">Carregando datas disponíveis</p>
                    <p className="text-sm text-gray-500">Verificando agenda do médico...</p>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center space-y-4 bg-gradient-to-br from-red-50 to-white">
                    <div className="p-3 bg-red-100 rounded-full w-fit mx-auto">
                      <Clock className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-700 mb-1">
                        {isRetrying ? "Tentando reconectar..." : "Erro ao carregar datas"}
                      </p>
                      <p className="text-sm text-red-600">{error}</p>
                      {retryCount > 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Tentativa {retryCount} de 3
                        </p>
                      )}
                    </div>
                    {!isRetrying && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => {
                          clearError();
                          refetch();
                        }}
                      >
                        Tentar novamente
                      </Button>
                    )}
                    {isRetrying && (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        <span className="text-sm text-red-600">Reconectando...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-white to-blue-50/30">
                    <Calendar
                      locale={ptBR}
                      mode="single"
                      selected={dateValue}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={isDateDisabled}
                      className="rounded-lg border-0"
                      aria-label="Calendário para seleção de data"
                      showOutsideDays={false}
                      fixedWeeks
                    />
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Information */}
          <div className="space-y-2" role="status" aria-live="polite">
            {!isLoading && !error && availableDates.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 font-medium">
                  {availableDates.length} data{availableDates.length !== 1 ? 's' : ''} disponível{availableDates.length !== 1 ? 'eis' : ''} para consulta
                </p>
              </div>
            )}
            
            {!isLoading && !error && availableDates.length === 0 && doctorId && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium">
                  Nenhuma data disponível para este médico no momento
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {onNext && onPrevious && (
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center justify-center gap-2 h-12 px-6 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
              aria-label="Voltar para a etapa anterior"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Anterior</span>
            </Button>
            <Button
              onClick={onNext}
              disabled={!selectedDate}
              className={cn(
                "flex items-center justify-center gap-2 h-12 px-8 font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                selectedDate 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl" 
                  : "bg-gray-300 cursor-not-allowed"
              )}
              aria-label={
                selectedDate 
                  ? "Continuar para a próxima etapa" 
                  : "Selecione uma data para continuar"
              }
            >
              <span>Próximo</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}