
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Calendar } from "lucide-react";

interface Patient {
  id: string;
  display_name: string;
  email: string;
  last_consultation: string;
  consultation_count: number;
}

interface PatientHistorySelectProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  isLoading?: boolean;
  onChange: (patient: Patient | null) => void;
  disabled?: boolean;
}

export const PatientHistorySelect = ({
  patients,
  selectedPatient,
  isLoading = false,
  onChange,
  disabled = false
}: PatientHistorySelectProps) => {
  const formatLastConsultation = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleValueChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId) || null;
    onChange(patient);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Selecione o paciente para retorno
      </Label>
      <Select
        value={selectedPatient?.id || ""}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Buscar paciente com histórico..." />
        </SelectTrigger>
        <SelectContent>
          {patients.map((patient) => (
            <SelectItem key={patient.id} value={patient.id}>
              <div className="flex items-center gap-3 py-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{patient.display_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Última consulta: {formatLastConsultation(patient.last_consultation)}
                    <span className="ml-2">• {patient.consultation_count} consulta{patient.consultation_count > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {patients.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Nenhum paciente com histórico de consultas encontrado.
        </p>
      )}
    </div>
  );
};
