import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { safeArrayAccess, safeArrayLength, isEmptyOrUndefined } from "@/utils/arrayUtils";
import { cn } from "@/lib/utils";

interface StateSelectProps {
  states: { uf: string }[] | undefined | null;
  selectedState: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const StateSelect = ({ 
  states, 
  selectedState, 
  isLoading, 
  onChange, 
  disabled = false
}: StateSelectProps) => {
  // Use defensive programming to safely access states array
  const safeStates = safeArrayAccess(states);
  const hasStates = !isEmptyOrUndefined(states);
  const statesCount = safeArrayLength(states);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          Selecione o Estado
        </CardTitle>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* State Selection Section */}
        <div className="space-y-4">
          <div className="relative">
            <Select
              value={selectedState}
              onValueChange={onChange}
              disabled={disabled || isLoading}
            >
              <SelectTrigger 
                className={cn(
                  "w-full h-14 border-2 transition-all duration-200",
                  "hover:border-blue-300 hover:bg-blue-50/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                  selectedState 
                    ? "border-blue-300 bg-blue-50/50" 
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
                        <p className="font-medium">Carregando estados...</p>
                        <p className="text-xs text-gray-500">Aguarde um momento</p>
                      </div>
                    </>
                  ) : selectedState ? (
                    <>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{selectedState}</p>
                        <p className="text-xs text-gray-500">Estado selecionado</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">Selecione um estado</p>
                        <p className="text-xs text-gray-500">Escolha sua localização</p>
                      </div>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {hasStates ? (
                  safeStates
                    .filter((state) => state && state.uf)
                    .map((state) => (
                      <SelectItem 
                        key={state.uf} 
                        value={state.uf}
                        className="py-3 hover:bg-blue-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <MapPin className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="font-medium">{state.uf}</span>
                        </div>
                      </SelectItem>
                    ))
                ) : (
                  <div className="p-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {isLoading ? "Carregando estados..." : "Nenhum estado disponível"}
                    </p>
                    <p className="text-xs text-gray-500">Tente novamente mais tarde</p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status Information */}
          {!isLoading && hasStates && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700 font-medium">
                {statesCount} estado{statesCount !== 1 ? 's' : ''} disponível{statesCount !== 1 ? 'eis' : ''}
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
};
