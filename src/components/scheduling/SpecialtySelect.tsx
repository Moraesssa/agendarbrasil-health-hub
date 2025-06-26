
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Stethoscope } from "lucide-react";

interface SpecialtySelectProps {
  specialties: string[];
  selectedSpecialty: string;
  isLoading: boolean;
  onChange: (specialty: string) => void;
  disabled?: boolean;
}

export const SpecialtySelect = ({ 
  specialties, 
  selectedSpecialty, 
  isLoading, 
  onChange,
  disabled = false
}: SpecialtySelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="specialty-select" className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Stethoscope className="h-4 w-4 text-blue-600" />
        Especialidade
      </Label>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        <Select
          value={selectedSpecialty}
          onValueChange={onChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger id="specialty-select" className="h-12">
            <SelectValue placeholder="Selecione uma especialidade" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {specialties.length > 0 ? (
              specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty} className="py-3">
                  {specialty}
                </SelectItem>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500">
                {isLoading ? "Carregando especialidades..." : "Nenhuma especialidade disponível"}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
