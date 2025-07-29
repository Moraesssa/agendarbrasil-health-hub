
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, CheckCircle2, ArrowRight, Heart } from "lucide-react";
import { safeArrayAccess, safeArrayLength, safeArrayMap } from "@/utils/arrayUtils";
import { cn } from "@/lib/utils";

interface SpecialtySelectProps {
  specialties: string[] | undefined | null;
  selectedSpecialty: string;
  isLoading: boolean;
  onChange: (specialty: string) => void;
  disabled?: boolean;
  onNext?: () => void;
}

export const SpecialtySelect = ({ 
  specialties, 
  selectedSpecialty, 
  isLoading, 
  onChange,
  disabled = false,
  onNext
}: SpecialtySelectProps) => {
  // Use defensive programming to safely access specialties array
  const safeSpecialties = safeArrayAccess(specialties);
  const specialtiesLength = safeArrayLength(specialties);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Heart className="h-5 w-5 text-purple-600" />
          </div>
          Selecione a Especialidade
        </CardTitle>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Specialty Selection Section */}
        <div className="space-y-4">
          <div className="relative">
            <Select
              value={selectedSpecialty}
              onValueChange={onChange}
              disabled={disabled || isLoading}
            >
              <SelectTrigger 
                className={cn(
                  "w-full h-14 border-2 transition-all duration-200",
                  "hover:border-purple-300 hover:bg-purple-50/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200",
                  selectedSpecialty 
                    ? "border-purple-300 bg-purple-50/50" 
                    : "border-gray-200",
                  disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  {isLoading ? (
                    <>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Carregando especialidades...</p>
                        <p className="text-xs text-gray-500">Aguarde um momento</p>
                      </div>
                    </>
                  ) : selectedSpecialty ? (
                    <>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-800">{selectedSpecialty}</p>
                        <p className="text-xs text-gray-500">Especialidade selecionada</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Stethoscope className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Selecione uma especialidade</p>
                        <p className="text-xs text-gray-500">Escolha a área médica</p>
                      </div>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {specialtiesLength > 0 ? (
                  safeArrayMap(safeSpecialties, (specialty) => (
                    <SelectItem 
                      key={specialty} 
                      value={specialty} 
                      className="py-3 hover:bg-purple-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Stethoscope className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="font-medium">{specialty}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {isLoading ? "Carregando especialidades..." : "Nenhuma especialidade disponível"}
                    </p>
                    <p className="text-xs text-gray-500">Tente novamente mais tarde</p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status Information */}
          {!isLoading && specialtiesLength > 0 && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <p className="text-sm text-purple-700 font-medium">
                {specialtiesLength} especialidade{specialtiesLength !== 1 ? 's' : ''} disponível{specialtiesLength !== 1 ? 'eis' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        {onNext && (
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              onClick={onNext}
              disabled={!selectedSpecialty}
              className={cn(
                "flex items-center gap-2 h-12 px-8 font-medium transition-all duration-200",
                selectedSpecialty 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl" 
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
