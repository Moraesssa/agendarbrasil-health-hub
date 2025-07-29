import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, CheckCircle2, ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { safeArrayAccess, safeArrayLength, isEmptyOrUndefined } from "@/utils/arrayUtils";
import { cn } from "@/lib/utils";

interface DoctorOption {
  id: string;
  display_name: string;
}

interface DoctorSelectProps {
  doctors: DoctorOption[] | undefined | null;
  selectedDoctor: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const DoctorSelect = ({ 
  doctors, 
  selectedDoctor, 
  isLoading, 
  onChange, 
  disabled = false,
  onNext,
  onPrevious 
}: DoctorSelectProps) => {
  // Defensive checks using utility functions
  const safeDoctors = safeArrayAccess(doctors);
  const doctorsLength = safeArrayLength(doctors);
  const isDoctorsEmpty = isEmptyOrUndefined(doctors);
  
  const selectedDoctorData = safeDoctors.find(doctor => doctor.id === selectedDoctor);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
          <div className="p-2 bg-green-100 rounded-lg">
            <Stethoscope className="h-5 w-5 text-green-600" />
          </div>
          Selecione o Médico
        </CardTitle>
        <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Doctor Selection Section */}
        <div className="space-y-4">
          <div className="relative">
            <Select
              value={selectedDoctor}
              onValueChange={onChange}
              disabled={disabled || isLoading || isDoctorsEmpty}
            >
              <SelectTrigger 
                className={cn(
                  "w-full h-14 border-2 transition-all duration-200",
                  "hover:border-green-300 hover:bg-green-50/50 focus:border-green-500 focus:ring-2 focus:ring-green-200",
                  selectedDoctor 
                    ? "border-green-300 bg-green-50/50" 
                    : "border-gray-200",
                  disabled || isLoading || isDoctorsEmpty ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  {isLoading ? (
                    <>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Carregando médicos...</p>
                        <p className="text-xs text-gray-500">Aguarde um momento</p>
                      </div>
                    </>
                  ) : selectedDoctorData ? (
                    <>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{selectedDoctorData.display_name}</p>
                        <p className="text-xs text-gray-500">Médico selecionado</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Selecione o médico</p>
                        <p className="text-xs text-gray-500">Escolha um profissional</p>
                      </div>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {doctorsLength > 0 ? (
                  safeDoctors
                    .filter((doctor) => doctor && doctor.id && doctor.id.trim() !== '' && doctor.display_name)
                    .map((doctor) => (
                      <SelectItem 
                        key={doctor.id} 
                        value={doctor.id}
                        className="py-3 hover:bg-green-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <User className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="font-medium">{doctor.display_name}</span>
                        </div>
                      </SelectItem>
                    ))
                ) : (
                  <div className="p-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Nenhum médico encontrado</p>
                    <p className="text-xs text-gray-500">Verifique os filtros selecionados</p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status Information */}
          {!isLoading && isDoctorsEmpty && !disabled && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <User className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                Nenhum médico encontrado para os filtros selecionados
              </p>
            </div>
          )}

          {!isLoading && doctorsLength > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">
                {doctorsLength} médico{doctorsLength !== 1 ? 's' : ''} disponível{doctorsLength !== 1 ? 'eis' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {onNext && onPrevious && (
          <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center gap-2 h-12 px-6 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Anterior</span>
            </Button>
            <Button
              onClick={onNext}
              disabled={!selectedDoctor}
              className={cn(
                "flex items-center gap-2 h-12 px-8 font-medium transition-all duration-200",
                selectedDoctor 
                  ? "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl" 
                  : "bg-gray-300 cursor-not-allowed"
              )}
            >
              <span>Próximo</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
