import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { safeArrayAccess, isEmptyOrUndefined } from "@/utils/arrayUtils";

interface CitySelectProps {
  cities: { cidade: string }[] | undefined | null;
  selectedCity: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CitySelect = ({ cities, selectedCity, isLoading, onChange, disabled = false }: CitySelectProps) => {
  // Defensive programming: safely access cities array
  const safeCities = safeArrayAccess(cities);
  const isCitiesEmpty = isEmptyOrUndefined(cities);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="city-select">Cidade</Label>
      <div className="flex items-center gap-2">
        {isLoading && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-xs text-blue-600">Carregando...</span>
          </div>
        )}
        <Select
          value={selectedCity}
          onValueChange={onChange}
          disabled={disabled || isLoading || isCitiesEmpty}
        >
          <SelectTrigger id="city-select" className={`${isLoading ? 'opacity-60' : ''}`}>
            <SelectValue placeholder={
              isLoading 
                ? "Carregando cidades..."
                : isCitiesEmpty 
                  ? "Nenhuma cidade disponível" 
                  : "Selecione a cidade"
            } />
          </SelectTrigger>
          <SelectContent>
            {safeCities.map((city) => (
              <SelectItem key={city.cidade} value={city.cidade}>
                {city.cidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isCitiesEmpty && !isLoading && (
        <p className="text-sm text-gray-500">
          Nenhuma cidade disponível para o estado selecionado
        </p>
      )}
    </div>
  );
};
