
import { Loader2 } from "lucide-react";

interface SpecialtySelectProps {
  specialties: string[] | undefined;
  selectedSpecialty: string;
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  onChange: (specialty: string) => void;
}

export const SpecialtySelect = ({ 
  specialties, 
  selectedSpecialty, 
  isLoading, 
  isError = false,
  error = null,
  onChange 
}: SpecialtySelectProps) => {
  if (isError && error) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Especialidade</label>
        <div className="w-full p-3 border border-red-300 rounded-lg bg-red-50">
          <p className="text-sm text-red-600">
            Erro ao carregar especialidades: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Especialidade
        {isLoading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
      </label>
      <select 
        className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed" 
        value={selectedSpecialty} 
        onChange={(e) => onChange(e.target.value)} 
        disabled={isLoading || isError}
      >
        <option value="">
          {isLoading ? "Carregando especialidades..." : "Selecione uma especialidade"}
        </option>
        {specialties?.map(specialty => (
          <option key={specialty} value={specialty}>
            {specialty}
          </option>
        ))}
      </select>
      
      {!isLoading && !isError && specialties && specialties.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          Nenhuma especialidade disponível no momento.
        </p>
      )}
    </div>
  );
};
