
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Settings } from "lucide-react";
import { MedicationWithDoses, CreateMedicationData } from "@/types/medication";

interface EditMedicationDialogProps {
  medication: MedicationWithDoses;
  onEdit: (id: string, data: CreateMedicationData) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

export const EditMedicationDialog = ({ 
  medication, 
  onEdit, 
  onDelete, 
  isLoading 
}: EditMedicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [medicationName, setMedicationName] = useState(medication.medication_name);
  const [dosage, setDosage] = useState(medication.dosage);
  const [frequency, setFrequency] = useState(medication.frequency);
  const [instructions, setInstructions] = useState(medication.instructions || "");
  const [times, setTimes] = useState<string[]>(medication.times || []);
  const [newTime, setNewTime] = useState("");

  const handleAddTime = () => {
    if (newTime && !times.includes(newTime)) {
      setTimes([...times, newTime]);
      setNewTime("");
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setTimes(times.filter(time => time !== timeToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicationName.trim() || !dosage.trim() || !frequency.trim() || times.length === 0) {
      return;
    }

    const medicationData: CreateMedicationData = {
      medication_name: medicationName.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      instructions: instructions.trim() || undefined,
      times: times.sort(),
      start_date: medication.start_date,
      end_date: medication.end_date || undefined,
    };

    const success = await onEdit(medication.id, medicationData);
    if (success) {
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir este medicamento?")) {
      const success = await onDelete(medication.id);
      if (success) {
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-600 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
          <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Gerenciar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Medicamento</DialogTitle>
          <DialogDescription>
            Edite as informações do medicamento ou exclua se necessário.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medication-name">Nome do Medicamento *</Label>
            <Input
              id="medication-name"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="Ex: Paracetamol"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosagem *</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Ex: 500mg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência *</Label>
            <Input
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Ex: 2 vezes ao dia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Horários *</Label>
            <div className="flex gap-2 mb-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTime} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {times.map((time) => (
                <Badge key={time} variant="secondary" className="flex items-center gap-1">
                  {time}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-600"
                    onClick={() => handleRemoveTime(time)}
                  />
                </Badge>
              ))}
            </div>
            {times.length === 0 && (
              <p className="text-sm text-red-600">Adicione pelo menos um horário</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instruções adicionais (opcional)"
              rows={3}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Excluir
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !medicationName.trim() || !dosage.trim() || !frequency.trim() || times.length === 0}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
