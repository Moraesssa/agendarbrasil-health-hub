
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useMedicationReminders } from "@/hooks/useMedicationReminders";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMedicationDialog = ({ open, onOpenChange }: AddMedicationDialogProps) => {
  const { createMedication, isSubmitting } = useMedicationReminders();
  
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    instructions: '',
    is_active: true
  });

  const [newTime, setNewTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name || !formData.dosage || formData.times.length === 0) {
      return;
    }

    try {
      await createMedication(formData);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao adicionar medicamento:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: 'daily',
      times: ['08:00'],
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      instructions: '',
      is_active: true
    });
    setNewTime('');
  };

  const addTime = () => {
    if (newTime && !formData.times.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, newTime].sort()
      }));
      setNewTime('');
    }
  };

  const removeTime = (timeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter(time => time !== timeToRemove)
    }));
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'twice_daily', label: '2x ao dia' },
    { value: 'three_times_daily', label: '3x ao dia' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'custom', label: 'Personalizado' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Medicamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medication_name">Nome do Medicamento *</Label>
            <Input
              id="medication_name"
              value={formData.medication_name}
              onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
              placeholder="Ex: Losartana, Vitamina D..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosagem *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder="Ex: 50mg, 1 comprimido, 2 cápsulas..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
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
                placeholder="Adicionar horário"
              />
              <Button type="button" onClick={addTime} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.times.map((time) => (
                <Badge key={time} variant="secondary" className="flex items-center gap-1">
                  {time}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTime(time)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções (opcional)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Ex: Tomar com alimentos, não tomar com leite..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.medication_name || !formData.dosage || formData.times.length === 0}
            >
              {isSubmitting ? 'Adicionando...' : 'Adicionar Medicamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
