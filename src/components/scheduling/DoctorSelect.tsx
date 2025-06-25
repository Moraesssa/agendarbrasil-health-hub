import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User } from "lucide-react";

interface DoctorOption {
  id: string;
  display_name: string;
}

interface DoctorSelectProps {
  doctors: DoctorOption[];
  selectedDoctor: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const DoctorSelect = ({ doctors, selectedDoctor, isLoading, onChange, disabled = false }: DoctorSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="doctor-select">Médico</Label>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        <Select
          value={selectedDoctor}
          onValueChange={onChange}
          disabled={disabled || isLoading || doctors.length === 0}
        >
          <SelectTrigger id="doctor-select">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Selecione o médico" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {doctors.length > 0 ? (
              doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.display_name}
                </SelectItem>
              ))
            ) : (
              <p className="p-2 text-sm text-gray-500">Nenhum médico encontrado.</p>
            )}
          </SelectContent>
        </Select>
      </div>
      {/* Mensagem de ajuda caso a lista esteja vazia após o carregamento */}
      {!isLoading && doctors.length === 0 && !disabled && (
        <p className="text-xs text-gray-500">Nenhum médico encontrado para os filtros selecionados.</p>
      )}
    </div>
  );
};
