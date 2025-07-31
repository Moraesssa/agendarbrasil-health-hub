import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle2, ArrowLeft, ArrowRight, Calendar, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeArrayAccess, safeArrayLength, isEmptyOrUndefined } from "@/utils/arrayUtils";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  timeSlots: TimeSlot[] | undefined | null;
  selectedTime: string;
  isLoading: boolean;
  onChange: (time: string) => void;
  disabled?: boolean;
  locaisInfo?: Array<{
    id: string;
    nome_local: string;
    endereco: any;
    horarios_disponiveis: Array<{ time: string; available: boolean }>;
  }>;
}

export function TimeSlotGrid({ 
  timeSlots, 
  selectedTime, 
  isLoading, 
  onChange, 
  disabled = false,
  locaisInfo = []
}: TimeSlotGridProps) {
  // Use defensive programming to safely access timeSlots array
  const safeTimeSlots = safeArrayAccess(timeSlots);
  const timeSlotsLength = safeArrayLength(timeSlots);
  const hasNoTimeSlots = isEmptyOrUndefined(timeSlots);
  const availableSlots = safeTimeSlots.filter(slot => slot && slot.available);
  
  console.log("🔍 TimeSlotGrid - Debug:", {
    timeSlots,
    safeTimeSlots: safeTimeSlots.length,
    hasNoTimeSlots,
    availableSlots: availableSlots.length,
    isLoading
  });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-orange-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          Selecione o Horário
        </CardTitle>
        <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estabelecimentos Disponíveis */}
        {locaisInfo.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-600" />
              Estabelecimentos Disponíveis
            </h3>
            <div className="grid gap-2">
              {locaisInfo.map((local) => (
                <div key={local.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Building className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{local.nome_local}</p>
                      <p className="text-xs text-gray-600">
                        {local.endereco?.logradouro}, {local.endereco?.numero} - {local.endereco?.bairro}
                      </p>
                      <p className="text-xs text-gray-500">
                        {local.endereco?.cidade}, {local.endereco?.uf}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-700">
                      {local.horarios_disponiveis?.filter(h => h.available).length || 0} horários
                    </p>
                    <p className="text-xs text-gray-500">disponíveis</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Slots Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="p-3 bg-blue-100 rounded-full mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
              <p className="font-medium text-gray-700">Carregando horários disponíveis</p>
              <p className="text-sm text-gray-500">Verificando agenda...</p>
            </div>
          ) : hasNoTimeSlots || availableSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="p-3 bg-amber-100 rounded-full mb-4">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <p className="font-medium text-amber-700">Nenhum horário disponível</p>
              <p className="text-sm text-amber-600">Selecione outra data para ver os horários</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {safeTimeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant="outline"
                    onClick={() => onChange(slot.time)}
                    disabled={disabled || !slot.available}
                    className={cn(
                      "h-14 flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 relative",
                      "hover:shadow-md hover:scale-105 active:scale-95",
                      !slot.available && "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 line-through",
                      slot.available && selectedTime !== slot.time && "border-gray-200 hover:border-orange-300 hover:bg-orange-50 bg-white",
                      selectedTime === slot.time && slot.available && "border-orange-500 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 shadow-lg ring-2 ring-orange-300"
                    )}
                    aria-label={`Horário ${slot.time} ${slot.available ? 'disponível' : 'indisponível'}`}
                  >
                    <Clock className={cn(
                      "h-4 w-4",
                      selectedTime === slot.time && slot.available ? "text-orange-600" : "text-gray-500"
                    )} />
                    <span className="text-sm font-semibold">{slot.time}</span>
                    {selectedTime === slot.time && slot.available && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                    )}
                  </Button>
                ))}
              </div>

              {/* Status Information */}
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-700 font-medium">
                  {availableSlots.length} horário{availableSlots.length !== 1 ? 's' : ''} disponível{availableSlots.length !== 1 ? 'eis' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
