
import { Calendar, Download, FileText, User, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicalCertificate } from "@/types/certificates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pdfService } from "@/services/pdfService";
import { useToast } from "@/hooks/use-toast";

interface CertificateCardProps {
  certificate: MedicalCertificate;
  showPatientInfo?: boolean;
}

const CertificateCard = ({ certificate, showPatientInfo = false }: CertificateCardProps) => {
  const { toast } = useToast();

  const typeLabels = {
    'medical_leave': { label: 'Atestado de Afastamento', color: 'bg-red-100 text-red-700' },
    'fitness_certificate': { label: 'Atestado de Aptidão', color: 'bg-green-100 text-green-700' },
    'vaccination_certificate': { label: 'Atestado de Vacinação', color: 'bg-blue-100 text-blue-700' },
    'medical_report': { label: 'Relatório Médico', color: 'bg-purple-100 text-purple-700' }
  };

  const typeInfo = typeLabels[certificate.certificate_type];

  const handleDownloadPDF = async () => {
    try {
      const blob = await pdfService.generateCertificatePDF(certificate);
      pdfService.downloadPDF(blob, `atestado-${certificate.certificate_number}.pdf`);
      toast({
        title: "PDF gerado",
        description: "O PDF do atestado foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF do atestado",
        variant: "destructive",
      });
    }
  };

  const handleCopyValidationCode = () => {
    navigator.clipboard.writeText(certificate.validation_hash);
    toast({
      title: "Código copiado",
      description: "Código de validação copiado para a área de transferência",
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-blue-900 mb-2">
              {certificate.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <User className="h-4 w-4" />
              <span>Dr. {certificate.doctor_name}</span>
            </div>
            {showPatientInfo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Paciente: {certificate.patient_name}</span>
              </div>
            )}
          </div>
          <Badge className={`${typeInfo.color} border-0`}>
            {typeInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="font-medium">Certificado Nº: {certificate.certificate_number}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <span className="text-gray-600">Data de emissão:</span>
              <p className="font-medium">
                {format(new Date(certificate.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>

          {certificate.start_date && certificate.end_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <span className="text-gray-600">Período:</span>
                <p className="font-medium">
                  {format(new Date(certificate.start_date), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(certificate.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Conteúdo:</span>
          <p className="text-sm text-blue-800 mt-1">{certificate.content}</p>
        </div>

        {certificate.diagnosis && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-yellow-900">Diagnóstico:</span>
            <p className="text-sm text-yellow-800 mt-1">{certificate.diagnosis}</p>
          </div>
        )}

        {certificate.recommendations && (
          <div className="bg-green-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-green-900">Recomendações:</span>
            <p className="text-sm text-green-800 mt-1">{certificate.recommendations}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleDownloadPDF} className="flex-1">
            <Download className="h-4 w-4 mr-1" />
            Baixar PDF
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleCopyValidationCode} className="flex-1">
            <QrCode className="h-4 w-4 mr-1" />
            Código de Validação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
