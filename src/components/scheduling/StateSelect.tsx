import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface StateSelectProps {
  states: { uf: string }[];
  selectedState: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const StateSelect = ({ states, selectedState, isLoading, onChange, disabled = false }: StateSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="state-select">Estado</Label>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        <Select
          value={selectedState}
          onValueChange={onChange}
          disabled={disabled || isLoading || states.length === 0}
        >
          <SelectTrigger id="state-select">
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.uf} value={state.uf}>
                {state.uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
