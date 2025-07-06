import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CreateHealthMetricData } from '@/types/health';
import { useAuth } from '@/contexts/AuthContext';

interface AddHealthMetricModalProps {
  onAddMetric: (data: CreateHealthMetricData) => Promise<boolean>;
  isSubmitting: boolean;
}

export const AddHealthMetricModal = ({ onAddMetric, isSubmitting }: AddHealthMetricModalProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [metricType, setMetricType] = useState<string>('');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [unit, setUnit] = useState('');

  const resetForm = () => {
    setMetricType('');
    setValue1('');
    setValue2('');
    setUnit('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !metricType || !value1) return;

    let metricValue: CreateHealthMetricData['value'];
    let metricUnit: string;

    switch (metricType) {
      case 'blood_pressure':
        if (!value2) return;
        metricValue = { systolic: Number(value1), diastolic: Number(value2) };
        metricUnit = 'mmHg';
        break;
      case 'heart_rate':
        metricValue = { numeric: Number(value1) };
        metricUnit = 'bpm';
        break;
      case 'temperature':
        metricValue = { numeric: Number(value1) };
        metricUnit = '°C';
        break;
      case 'weight':
        metricValue = { numeric: Number(value1) };
        metricUnit = unit || 'kg';
        break;
      case 'height':
        metricValue = { numeric: Number(value1) };
        metricUnit = unit || 'cm';
        break;
      case 'glucose':
        metricValue = { numeric: Number(value1) };
        metricUnit = 'mg/dL';
        break;
      case 'oxygen_saturation':
        metricValue = { numeric: Number(value1) };
        metricUnit = '%';
        break;
      default:
        return;
    }

    const success = await onAddMetric({
      patient_id: user.id,
      metric_type: metricType as CreateHealthMetricData['metric_type'],
      value: metricValue,
      unit: metricUnit
    });

    if (success) {
      resetForm();
      setOpen(false);
    }
  };

  const getMetricLabel = (type: string) => {
    const labels = {
      blood_pressure: 'Pressão Arterial',
      heart_rate: 'Frequência Cardíaca',
      temperature: 'Temperatura',
      weight: 'Peso',
      height: 'Altura',
      glucose: 'Glicose',
      oxygen_saturation: 'Saturação de Oxigênio'
    };
    return labels[type as keyof typeof labels];
  };

  const renderValueInputs = () => {
    switch (metricType) {
      case 'blood_pressure':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="systolic">Sistólica</Label>
              <Input
                id="systolic"
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder="120"
                min="0"
                max="300"
              />
            </div>
            <div>
              <Label htmlFor="diastolic">Diastólica</Label>
              <Input
                id="diastolic"
                type="number"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                placeholder="80"
                min="0"
                max="200"
              />
            </div>
          </div>
        );
      case 'heart_rate':
        return (
          <div>
            <Label htmlFor="heart_rate">Batimentos por minuto</Label>
            <Input
              id="heart_rate"
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="72"
              min="30"
              max="220"
            />
          </div>
        );
      case 'temperature':
        return (
          <div>
            <Label htmlFor="temperature">Temperatura (°C)</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="36.5"
              min="30"
              max="45"
            />
          </div>
        );
      case 'weight':
        return (
          <div>
            <Label htmlFor="weight">Peso</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder="70.5"
                min="0"
                max="500"
                className="flex-1"
              />
              <Select value={unit || 'kg'} onValueChange={setUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      // CORREÇÃO APLICADA AQUI
      case 'height':
        return (
          <div>
            <Label htmlFor="height">Altura</Label>
            <div className="flex gap-2">
              <Input
                id="height"
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder="175"
                min="0"
                max="300"
                className="flex-1"
              />
              <Select value={unit || 'cm'} onValueChange={setUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'glucose':
        return (
          <div>
            <Label htmlFor="glucose">Glicose (mg/dL)</Label>
            <Input
              id="glucose"
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="90"
              min="0"
              max="500"
            />
          </div>
        );
      case 'oxygen_saturation':
        return (
          <div>
            <Label htmlFor="oxygen">Saturação de Oxigênio (%)</Label>
            <Input
              id="oxygen"
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="98"
              min="0"
              max="100"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Métrica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Métrica de Saúde</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="metric_type">Tipo de Métrica</Label>
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood_pressure">Pressão Arterial</SelectItem>
                <SelectItem value="heart_rate">Frequência Cardíaca</SelectItem>
                <SelectItem value="temperature">Temperatura</SelectItem>
                <SelectItem value="weight">Peso</SelectItem>
                <SelectItem value="height">Altura</SelectItem>
                <SelectItem value="glucose">Glicose</SelectItem>
                <SelectItem value="oxygen_saturation">Saturação de Oxigênio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {metricType && renderValueInputs()}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !metricType || !value1 || (metricType === 'blood_pressure' && !value2)}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};