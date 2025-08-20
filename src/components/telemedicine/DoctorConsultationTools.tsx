import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Pill, 
  Save, 
  Send, 
  Clock,
  Plus,
  X,
  Download,
  Printer,
  Stethoscope
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DoctorConsultationToolsProps {
  appointmentId: string;
  patientId: string;
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const DoctorConsultationTools: React.FC<DoctorConsultationToolsProps> = ({
  appointmentId,
  patientId
}) => {
  const [consultationNotes, setConsultationNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const addPrescription = () => {
    if (newPrescription.medication && newPrescription.dosage) {
      setPrescriptions([...prescriptions, newPrescription]);
      setNewPrescription({
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      });
      toast({
        title: "Prescrição adicionada",
        description: "Medicamento adicionado à receita",
      });
    } else {
      toast({
        title: "Erro",
        description: "Medicamento e dosagem são obrigatórios",
        variant: "destructive"
      });
    }
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const saveConsultation = async () => {
    setIsSaving(true);
    try {
      // Update consultation notes
      const { error: consultError } = await supabase
        .from('consultas')
        .update({
          notes: consultationNotes,
          diagnosis: diagnosis,
          status: 'concluida'
        })
        .eq('id', appointmentId);

      if (consultError) throw consultError;

      // Save prescriptions (mock - in real app, save to prescriptions table)
      if (prescriptions.length > 0) {
        console.log('Prescriptions to save:', prescriptions);
        // TODO: Implement prescription saving to database
      }

      toast({
        title: "Consulta salva",
        description: "Todas as informações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a consulta",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generatePrescription = () => {
    if (prescriptions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um medicamento à receita",
        variant: "destructive"
      });
      return;
    }

    // Mock prescription generation - in real app, generate PDF
    const prescriptionText = prescriptions.map(p => 
      `${p.medication} ${p.dosage} - ${p.frequency} por ${p.duration}\n${p.instructions ? 'Obs: ' + p.instructions : ''}`
    ).join('\n\n');

    console.log('Generated prescription:', prescriptionText);
    
    toast({
      title: "Receita gerada",
      description: "A receita foi gerada e está pronta para impressão",
    });
  };

  return (
    <div className="space-y-6">
      {/* Consultation Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Anotações da Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Digite o diagnóstico principal..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Observações e Exame Físico</Label>
            <Textarea
              id="notes"
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="Digite suas observações, exame físico, orientações..."
              className="mt-1 min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prescription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescrição Médica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Medicamentos Prescritos:</h4>
              {prescriptions.map((prescription, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{prescription.medication}</p>
                      <p className="text-sm text-gray-600">
                        {prescription.dosage} - {prescription.frequency}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duração: {prescription.duration}
                      </p>
                      {prescription.instructions && (
                        <p className="text-sm text-gray-600 mt-1">
                          Obs: {prescription.instructions}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePrescription(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator />
            </div>
          )}

          {/* Add New Prescription */}
          <div className="space-y-3">
            <h4 className="font-medium">Adicionar Medicamento:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="medication">Medicamento</Label>
                <Input
                  id="medication"
                  value={newPrescription.medication}
                  onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                  placeholder="Nome do medicamento"
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosagem</Label>
                <Input
                  id="dosage"
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                  placeholder="Ex: 50mg"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Input
                  id="frequency"
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                  placeholder="Ex: 2x ao dia"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duração</Label>
                <Input
                  id="duration"
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                  placeholder="Ex: 30 dias"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="instructions">Instruções Especiais</Label>
              <Textarea
                id="instructions"
                value={newPrescription.instructions}
                onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                placeholder="Instruções especiais de uso..."
                className="h-20"
              />
            </div>
            <Button onClick={addPrescription} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" onClick={generatePrescription}>
              <Printer className="h-4 w-4 mr-2" />
              Gerar Receita
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Solicitar Exames
            </Button>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Agendar Retorno
            </Button>
            <Button 
              onClick={saveConsultation}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Consulta
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};