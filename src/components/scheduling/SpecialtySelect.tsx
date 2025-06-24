
import { Loader2 } from "lucide-react";

interface SpecialtySelectProps {
  specialties: string[] | undefined;
  selectedSpecialty: string;
  isLoading: boolean;
  onChange: (specialty: string) => void;
}

export const SpecialtySelect = ({ 
  specialties, 
  selectedSpecialty, 
  isLoading, 
  onChange 
}: SpecialtySelectProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Especialidade</label>
      <select 
        className="w-full p-3 border rounded-lg" 
        value={selectedSpecialty} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? "Carregando..." : "Selecione uma especialidade"}
        </option>
        {specialties?.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
};
