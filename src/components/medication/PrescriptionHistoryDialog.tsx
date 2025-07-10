import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, User } from "lucide-react";
import { MedicalPrescription } from "@/types/prescription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrescriptionHistoryDialogProps {
  medicationName: string;
  onGetHistory: (medicationName: string) => Promise<MedicalPrescription[]>;
}

const PrescriptionHistoryDialog = ({ 
  medicationName, 
  onGetHistory 
}: PrescriptionHistoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<MedicalPrescription[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      const historyData = await onGetHistory(medicationName);
      setHistory(historyData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4 mr-1" />
          Histórico
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            Histórico de Prescrições
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Histórico completo para: <strong>{medicationName}</strong>
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum histórico encontrado para este medicamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((prescription) => (
                <div 
                  key={prescription.id}
                  className="p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {prescription.medication_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <User className="h-3 w-3" />
                        <span>Dr. {prescription.doctor_name}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(prescription.prescribed_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {prescription.valid_until && (
                        <p className="text-xs text-gray-500 mt-1">
                          Válida até: {format(new Date(prescription.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Dosagem:</span>
                      <p className="font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Frequência:</span>
                      <p className="font-medium">{prescription.frequency}</p>
                    </div>
                  </div>
                  
                  {prescription.instructions && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium text-blue-900">Instruções:</span>
                      <p className="text-blue-800 mt-1">{prescription.instructions}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      prescription.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {prescription.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                    
                    {prescription.duration_days && (
                      <span className="text-xs text-gray-500">
                        Duração: {prescription.duration_days} dias
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionHistoryDialog;