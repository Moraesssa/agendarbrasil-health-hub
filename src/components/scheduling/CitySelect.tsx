import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { safeArrayAccess, safeArrayLength, isEmptyOrUndefined } from "@/utils/arrayUtils";
import { cn } from "@/lib/utils";

interface CitySelectProps {
  cities: { cidade: string }[] | undefined | null;
  selectedCity: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  onNext?: () => void;
}

export const CitySelect = ({ 
  cities, 
  selectedCity, 
  isLoading, 
  onChange, 
  disabled = false,
  onNext 
}: CitySelectProps) => {
  // Defensive programming: safely access cities array
  const safeCities = safeArrayAccess(cities);
  const isCitiesEmpty = isEmptyOrUndefined(cities);
  const citiesCount = safeArrayLength(cities);
  
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
          <div className="p-2 bg-green-100 rounded-lg">
            <Building2 className="h-5 w-5 text-green-600" />
          </div>
          Selecione a Cidade
        </CardTitle>
        <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* City Selection Section */}
        <div className="space-y-4">
          <div className="relative">
            <Select
              value={selectedCity}
              onValueChange={onChange}
              disabled={disabled || isLoading || isCitiesEmpty}
            >
              <SelectTrigger 
                className={cn(
                  "w-full h-14 border-2 transition-all duration-200",
                  "hover:border-green-300 hover:bg-green-50/50 focus:border-green-500 focus:ring-2 focus:ring-green-200",
                  selectedCity 
                    ? "border-green-300 bg-green-50/50" 
                    : "border-gray-200",
                  disabled || isLoading || isCitiesEmpty ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  {isLoading ? (
                    <>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Carregando cidades...</p>
                        <p className="text-xs text-gray-500">Aguarde um momento</p>
                      </div>
                    </>
                  ) : selectedCity ? (
                    <>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{selectedCity}</p>
                        <p className="text-xs text-gray-500">Cidade selecionada</p>
                      </div>
                    </>
                  ) : isCitiesEmpty ? (
                    <>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Nenhuma cidade disponível</p>
                        <p className="text-xs text-gray-400">Selecione um estado primeiro</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building2 className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Selecione uma cidade</p>
                        <p className="text-xs text-gray-500">Escolha sua cidade</p>
                      </div>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {!isCitiesEmpty ? (
                  safeCities.map((city) => (
                    <SelectItem 
                      key={city.cidade} 
                      value={city.cidade}
                      className="py-3 hover:bg-green-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <Building2 className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="font-medium">{city.cidade}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {isLoading ? "Carregando cidades..." : "Nenhuma cidade disponível"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {!isLoading && "Selecione um estado primeiro"}
                    </p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status Information */}
          {!isLoading && !isCitiesEmpty && citiesCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">
                {citiesCount} cidade{citiesCount !== 1 ? 's' : ''} disponível{citiesCount !== 1 ? 'eis' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        {onNext && (
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              onClick={onNext}
              disabled={!selectedCity}
              className={cn(
                "flex items-center gap-2 h-12 px-8 font-medium transition-all duration-200",
                selectedCity 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl" 
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
