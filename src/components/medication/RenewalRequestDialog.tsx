import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";
import { CreateRenewalRequest } from "@/types/prescription";

interface RenewalRequestDialogProps {
  prescriptionId: string;
  medicationName: string;
  onRequestRenewal: (data: CreateRenewalRequest) => Promise<boolean>;
  isLoading?: boolean;
}

const RenewalRequestDialog = ({ 
  prescriptionId, 
  medicationName, 
  onRequestRenewal, 
  isLoading = false 
}: RenewalRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [durationDays, setDurationDays] = useState<number | undefined>(30);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await onRequestRenewal({
      prescription_id: prescriptionId,
      requested_duration_days: durationDays,
      patient_notes: notes.trim() || undefined
    });

    if (success) {
      setOpen(false);
      setDurationDays(30);
      setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-500 hover:bg-green-600">
          <RotateCcw className="h-4 w-4 mr-1" />
          Renovar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            Solicitar Renovação
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Solicitar renovação para: <strong>{medicationName}</strong>
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duração solicitada (dias)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={durationDays || ""}
              onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ex: 30"
            />
            <p className="text-xs text-gray-500">
              Deixe vazio se não tiver preferência específica
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione qualquer informação relevante para o médico..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              {isLoading ? "Enviando..." : "Solicitar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenewalRequestDialog;