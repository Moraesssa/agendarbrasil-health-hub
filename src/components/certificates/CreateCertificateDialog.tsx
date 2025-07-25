
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, User, FileText, Stethoscope } from "lucide-react";
import { CreateCertificateData } from "@/types/certificates";

interface CreateCertificateDialogProps {
  patientId: string;
  patientName: string;
  onCreateCertificate: (data: CreateCertificateData) => Promise<boolean>;
  isLoading?: boolean;
}

const CreateCertificateDialog = ({ 
  patientId, 
  patientName, 
  onCreateCertificate, 
  isLoading = false 
}: CreateCertificateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCertificateData>({
    patient_id: patientId,
    certificate_type: 'medical_leave',
    title: '',
    content: '',
    start_date: '',
    end_date: '',
    diagnosis: '',
    recommendations: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      return;
    }

    const success = await onCreateCertificate(formData);
    if (success) {
      setOpen(false);
      setFormData({
        patient_id: patientId,
        certificate_type: 'medical_leave',
        title: '',
        content: '',
        start_date: '',
        end_date: '',
        diagnosis: '',
        recommendations: ''
      });
    }
  };

  const certificateTypes = [
    { value: 'medical_leave', label: 'Atestado de Afastamento', icon: Calendar },
    { value: 'fitness_certificate', label: 'Atestado de Aptidão', icon: Stethoscope },
    { value: 'vaccination_certificate', label: 'Atestado de Vacinação', icon: User },
    { value: 'medical_report', label: 'Relatório Médico', icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Atestado
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            Criar Atestado Médico
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Paciente: <strong>{patientName}</strong>
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificate_type">Tipo de Atestado</Label>
            <Select
              value={formData.certificate_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, certificate_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {certificateTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Atestado de Afastamento do Trabalho"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Descreva o conteúdo do atestado..."
              rows={4}
              required
            />
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
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico (opcional)</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Diagnóstico médico..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recomendações (opcional)</Label>
            <Textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="Recomendações médicas..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title || !formData.content}>
              {isLoading ? "Criando..." : "Criar Atestado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCertificateDialog;
