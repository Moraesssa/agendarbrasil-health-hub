
import { Loader2 } from "lucide-react";
import { Medico } from "@/services/appointmentService";

interface DoctorSelectProps {
  doctors: Medico[] | undefined;
  selectedDoctor: string;
  selectedSpecialty: string;
  isLoading: boolean;
  onChange: (doctorId: string) => void;
}

export const DoctorSelect = ({ 
  doctors, 
  selectedDoctor, 
  selectedSpecialty, 
  isLoading, 
  onChange 
}: DoctorSelectProps) => {
  if (!selectedSpecialty) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Médico</label>
      <div className="relative">
        <select 
          className="w-full p-3 border rounded-lg appearance-none" 
          value={selectedDoctor} 
          onChange={(e) => onChange(e.target.value)} 
          disabled={isLoading || !doctors || doctors.length === 0}
        >
          <option value="">
            {isLoading 
              ? "Carregando médicos..." 
              : doctors?.length === 0 
                ? "Nenhum médico encontrado" 
                : "Selecione um médico"
            }
          </option>
          {doctors?.map(d => (
            <option key={d.id} value={d.id}>{d.display_name}</option>
          ))}
        </select>
        {isLoading && (
          <Loader2 className="animate-spin absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>
  );
};
