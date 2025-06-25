import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CitySelectProps {
  cities: { cidade: string }[];
  selectedCity: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CitySelect = ({ cities, selectedCity, isLoading, onChange, disabled = false }: CitySelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="city-select">Cidade</Label>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        <Select
          value={selectedCity}
          onValueChange={onChange}
          disabled={disabled || isLoading || cities.length === 0}
        >
          <SelectTrigger id="city-select">
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.cidade} value={city.cidade}>
                {city.cidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
