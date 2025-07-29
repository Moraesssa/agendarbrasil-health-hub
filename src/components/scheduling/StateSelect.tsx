import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { safeArrayAccess, safeArrayLength, isEmptyOrUndefined } from "@/utils/arrayUtils";
import { cn } from "@/lib/utils";

interface StateSelectProps {
  states: { uf: string }[] | undefined | null;
  selectedState: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const StateSelect = ({ states, selectedState, isLoading, onChange, disabled = false }: StateSelectProps) => {
  // Use defensive programming to safely access states array
  const safeStates = safeArrayAccess(states);
  const hasStates = !isEmptyOrUndefined(states);
  const statesCount = safeArrayLength(states);

  return (
    <div className="space-y-2">
      <Label htmlFor="state-select">Estado</Label>
      <div className="flex items-center gap-2">
        {isLoading && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-xs text-blue-600">Carregando...</span>
          </div>
        )}
        <Select
          value={selectedState}
          onValueChange={onChange}
          disabled={disabled || isLoading || statesCount === 0}
        >
          <SelectTrigger id="state-select" className={`${isLoading ? 'opacity-60' : ''}`}>
            <SelectValue 
              placeholder={
                isLoading 
                  ? "Carregando estados..." 
                  : hasStates 
                    ? "Selecione o estado" 
                    : "Nenhum estado disponível"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {hasStates ? (
              safeStates
                .filter((state) => state && state.uf) // Filter out null/undefined items and items without uf
                .map((state) => (
                  <SelectItem key={state.uf} value={state.uf}>
                    {state.uf}
                  </SelectItem>
                ))
            ) : (
              !isLoading && (
                <SelectItem value="no-states-available" disabled>
                  Nenhum estado disponível
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      {!isLoading && !hasStates && (
        <p className="text-sm text-gray-500">
          Não foi possível carregar os estados. Tente recarregar a página.
        </p>
      )}
    </div>
  );
};
