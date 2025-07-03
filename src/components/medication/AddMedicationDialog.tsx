import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, X, Clock, AlertCircle, Info } from "lucide-react";
import { useMedicationReminders } from "@/hooks/useMedicationReminders";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMedicationAdded: () => void;
}

export const AddMedicationDialog = ({ open, onOpenChange, onMedicationAdded }: AddMedicationDialogProps) => {
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
  const [showTimeError, setShowTimeError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name || !formData.dosage) {
      return;
    }

    if (formData.times.length === 0) {
      setShowTimeError(true);
      return;
    }

    try {
      // Sanitize form data before sending
      const sanitizedData = {
        ...formData,
        // Convert empty end_date string to null
        end_date: formData.end_date.trim() === '' ? null : formData.end_date,
        // Ensure instructions is null if empty
        instructions: formData.instructions.trim() === '' ? null : formData.instructions
      };

      // Criar o medicamento e aguardar a conclusão
      const newMedication = await createMedication(sanitizedData);
      console.log("Medicamento adicionado com sucesso:", newMedication);
      
      // Fechar o diálogo antes de atualizar a lista para evitar problemas de UI
      onOpenChange(false);
      resetForm();
      
      // Após fechar o diálogo e limpar o formulário, atualizar a lista
      // Usando setTimeout para garantir que a UI seja atualizada após o fechamento do diálogo
      setTimeout(() => {
        onMedicationAdded();
      }, 100);
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
    setShowTimeError(false);
  };

  const addTime = () => {
    if (newTime && !formData.times.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, newTime].sort()
      }));
      setNewTime('');
      setShowTimeError(false);
    }
  };

  const removeTime = (timeToRemove: string) => {
    const newTimes = formData.times.filter(time => time !== timeToRemove);
    setFormData(prev => ({
      ...prev,
      times: newTimes
    }));
    
    if (newTimes.length === 0) {
      setShowTimeError(true);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'twice_daily', label: '2x ao dia' },
    { value: 'three_times_daily', label: '3x ao dia' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const isFormValid = formData.medication_name && formData.dosage && formData.times.length > 0;

  const getTimeBadgeColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ];
    return colors[index % colors.length];
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Adicionar Medicamento
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="medication_name" className="text-sm font-medium">
                Nome do Medicamento *
              </Label>
              <Input
                id="medication_name"
                value={formData.medication_name}
                onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                placeholder="Ex: Losartana, Vitamina D..."
                className="focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage" className="text-sm font-medium">
                Dosagem *
              </Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="Ex: 50mg, 1 comprimido, 2 cápsulas..."
                className="focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-sm font-medium">
                Frequência
              </Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Horários *</Label>
                {showTimeError && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">Adicione pelo menos um horário</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="Selecionar horário"
                  className="flex-1 focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  type="button" 
                  onClick={addTime} 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 px-4"
                  disabled={!newTime || formData.times.includes(newTime)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Adicionar Horário
                </Button>
              </div>

              {formData.times.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.times.map((time, index) => (
                      <Badge 
                        key={time} 
                        className={`${getTimeBadgeColor(index)} flex items-center gap-2 px-3 py-1 text-sm font-medium border`}
                      >
                        <Clock className="h-3 w-3" />
                        {time}
                        <button
                          type="button"
                          onClick={() => removeTime(time)}
                          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Dica sobre horários:</p>
                      <p>• Configure os horários de acordo com sua rotina</p>
                      <p>• Mantenha intervalos regulares entre as doses</p>
                      <p>• Considere horários das refeições se necessário</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium">
                  Data de Início
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium">
                  Data de Fim (opcional)
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                  min={formData.start_date}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-sm font-medium">
                Instruções (opcional)
              </Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Ex: Tomar com alimentos, não tomar com leite..."
                rows={3}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="px-6"
              >
                Cancelar
              </Button>
              
              {!isFormValid ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        type="button"
                        disabled={true}
                        className="px-6 bg-gray-400 cursor-not-allowed"
                      >
                        {isSubmitting ? 'Adicionando...' : 'Adicionar Medicamento'}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium mb-1">Campos obrigatórios:</p>
                      {!formData.medication_name && <p>• Nome do medicamento</p>}
                      {!formData.dosage && <p>• Dosagem</p>}
                      {formData.times.length === 0 && <p>• Pelo menos um horário</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Adicionando...' : 'Adicionar Medicamento'}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
