
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateMedicationData } from "@/types/medication";
import { useToast } from "@/hooks/use-toast";

interface AddMedicationDialogProps {
  onAdd: (data: CreateMedicationData) => Promise<boolean>;
  isLoading: boolean;
  onClose?: () => void;
}

export const AddMedicationDialog = ({ onAdd, isLoading, onClose }: AddMedicationDialogProps) => {
  const [open, setOpen] = useState(!!onClose); // Se onClose existe, inicia aberto
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    instructions: "",
    times: [""],
    start_date: new Date().toISOString().split('T')[0],
    end_date: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name || !formData.dosage || !formData.frequency) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, dosagem e frequência do medicamento",
        variant: "destructive"
      });
      return;
    }

    // Filtrar horários vazios
    const filteredTimes = formData.times.filter(time => time.trim() !== "");
    
    const success = await onAdd({
      ...formData,
      times: filteredTimes,
      end_date: formData.end_date || undefined
    });

    if (success) {
      setFormData({
        medication_name: "",
        dosage: "",
        frequency: "",
        instructions: "",
        times: [""],
        start_date: new Date().toISOString().split('T')[0],
        end_date: ""
      });
      setOpen(false);
      if (onClose) onClose();
    }
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, ""]
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.map((time, i) => i === index ? value : time)
    }));
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!onClose && (
        <DialogTrigger asChild>
          <Button className="bg-green-500 hover:bg-green-600">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Medicamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Medicamento</DialogTitle>
          <DialogDescription>
            Configure um novo lembrete de medicamento
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="medication_name">Nome do Medicamento *</Label>
            <Input
              id="medication_name"
              value={formData.medication_name}
              onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
              placeholder="Ex: Paracetamol"
              required
            />
          </div>

          <div>
            <Label htmlFor="dosage">Dosagem *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder="Ex: 500mg"
              required
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequência *</Label>
            <Input
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
              placeholder="Ex: A cada 8 horas"
              required
            />
          </div>

          <div>
            <Label>Horários</Label>
            {formData.times.map((time, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateTimeSlot(index, e.target.value)}
                  className="flex-1"
                />
                {formData.times.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTimeSlot(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTimeSlot}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Horário
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Fim (opcional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instruções (opcional)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Instruções especiais para o medicamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
