
import { Calendar, Clock, User, FileText, RotateCcw, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrescriptionWithRenewals } from "@/types/prescription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pdfService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionCardProps {
  prescription: PrescriptionWithRenewals;
  onRequestRenewal: (prescriptionId: string) => void;
  onViewHistory: (medicationName: string) => void;
  isSubmitting?: boolean;
}

const PrescriptionCard = ({ 
  prescription, 
  onRequestRenewal, 
  onViewHistory,
  isSubmitting = false 
}: PrescriptionCardProps) => {
  const { toast } = useToast();
  
  const isExpired = prescription.valid_until && new Date(prescription.valid_until) < new Date();
  const isExpiringSoon = prescription.valid_until && 
    new Date(prescription.valid_until) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const hasActivePendingRenewal = prescription.renewals?.some(
    renewal => renewal.status === 'pending'
  );

  const getStatusColor = () => {
    if (isExpired) return 'bg-red-100 text-red-700 border-red-200';
    if (isExpiringSoon) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (!prescription.is_active) return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getStatusText = () => {
    if (isExpired) return 'Expirada';
    if (isExpiringSoon) return 'Expira em breve';
    if (!prescription.is_active) return 'Inativa';
    return 'Ativa';
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await pdfService.generatePrescriptionPDF(prescription);
      pdfService.downloadPDF(blob, `receita-${prescription.prescription_number || prescription.id}.pdf`);
      toast({
        title: "PDF gerado",
        description: "O PDF da receita foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF da receita",
        variant: "destructive",
      });
    }
  };

  const handleCopyValidationCode = () => {
    if (prescription.validation_hash) {
      navigator.clipboard.writeText(prescription.validation_hash);
      toast({
        title: "Código copiado",
        description: "Código de validação copiado para a área de transferência",
      });
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-blue-900 mb-2">
              {prescription.medication_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Dr. {prescription.doctor_name}</span>
            </div>
            {prescription.prescription_number && (
              <div className="text-xs text-gray-500 mt-1">
                Receita Nº: {prescription.prescription_number}
              </div>
            )}
          </div>
          <Badge className={`${getStatusColor()} border-0`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <span className="text-gray-600">Dosagem:</span>
              <p className="font-medium">{prescription.dosage}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <span className="text-gray-600">Frequência:</span>
              <p className="font-medium">{prescription.frequency}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <span className="text-gray-600">Prescrita em:</span>
              <p className="font-medium">
                {format(new Date(prescription.prescribed_date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
          
          {prescription.valid_until && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <span className="text-gray-600">Válida até:</span>
                <p className="font-medium">
                  {format(new Date(prescription.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>

        {prescription.instructions && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-blue-900">Instruções:</span>
            <p className="text-sm text-blue-800 mt-1">{prescription.instructions}</p>
          </div>
        )}

        {prescription.latest_renewal && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-gray-900">Última renovação:</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">
                {format(new Date(prescription.latest_renewal.request_date), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              <Badge 
                variant={prescription.latest_renewal.status === 'approved' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {prescription.latest_renewal.status === 'pending' && 'Pendente'}
                {prescription.latest_renewal.status === 'approved' && 'Aprovada'}
                {prescription.latest_renewal.status === 'denied' && 'Negada'}
                {prescription.latest_renewal.status === 'expired' && 'Expirada'}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewHistory(prescription.medication_name)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            Histórico
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDownloadPDF}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>

        <div className="flex gap-2">
          {prescription.validation_hash && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCopyValidationCode}
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Código de Validação
            </Button>
          )}
          
          {prescription.is_active && !hasActivePendingRenewal && (
            <Button 
              size="sm"
              onClick={() => onRequestRenewal(prescription.id)}
              disabled={isSubmitting}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Renovar
            </Button>
          )}
          
          {hasActivePendingRenewal && (
            <Button 
              size="sm"
              variant="secondary"
              disabled
              className="flex-1"
            >
              Renovação Pendente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionCard;
