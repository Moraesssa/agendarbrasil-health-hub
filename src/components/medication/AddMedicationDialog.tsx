import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pill } from "lucide-react";
import { CreateMedicationData } from "@/types/medication";

interface AddMedicationDialogProps {
  onAdd: (medication: CreateMedicationData) => Promise<boolean>;
  isLoading: boolean;
}

const frequencyOptions = [
  { value: "daily", label: "Diário" },
  { value: "twice_daily", label: "2x ao dia" },
  { value: "three_times_daily", label: "3x ao dia" },
  { value: "weekly", label: "Semanal" },
  { value: "as_needed", label: "Conforme necessário" }
];

export const AddMedicationDialog = ({ onAdd, isLoading }: AddMedicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateMedicationData>({
    medication_name: "",
    dosage: "",
    frequency: "",
    instructions: "",
    times: [],
    start_date: new Date().toISOString().split('T')[0]
  });
  const [newTime, setNewTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name || !formData.dosage || !formData.frequency || formData.times.length === 0) {
      return;
    }

    const success = await onAdd(formData);
    if (success) {
      setFormData({
        medication_name: "",
        dosage: "",
        frequency: "",
        instructions: "",
        times: [],
        start_date: new Date().toISOString().split('T')[0]
      });
      setNewTime("");
      setOpen(false);
    }
  };

  const addTime = () => {
    if (newTime && !formData.times.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, newTime].sort()
      }));
      setNewTime("");
    }
  };

  const removeTime = (timeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter(time => time !== timeToRemove)
    }));
  };

  const addPredefinedTimes = (frequency: string) => {
    let times: string[] = [];
    
    switch (frequency) {
      case "daily":
        times = ["08:00"];
        break;
      case "twice_daily":
        times = ["08:00", "20:00"];
        break;
      case "three_times_daily":
        times = ["08:00", "14:00", "20:00"];
        break;
      default:
        times = [];
    }
    
    setFormData(prev => ({
      ...prev,
      frequency,
      times
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 h-10 sm:h-11 text-sm"
        >
          <Pill className="h-4 w-4 mr-2" />
          Adicionar Medicamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Adicionar Medicamento
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medication_name">Nome do Medicamento *</Label>
            <Input
              id="medication_name"
              value={formData.medication_name}
              onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
              placeholder="Ex: Losartana 50mg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosagem *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder="Ex: 1 comprimido"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência *</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => addPredefinedTimes(value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Horários *</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={addTime} size="sm" disabled={!newTime}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.times.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.times.map(time => (
                  <Badge key={time} variant="secondary" className="flex items-center gap-1">
                    {time}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTime(time)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Data de Início</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Data de Fim (opcional)</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value || undefined }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções (opcional)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Ex: Tomar com o estômago vazio"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};