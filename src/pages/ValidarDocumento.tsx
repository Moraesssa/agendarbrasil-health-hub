
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, User, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ValidationResult } from "@/types/certificates";
import { certificateService } from "@/services/certificateService";
import { pdfService } from "@/services/pdfService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const ValidarDocumento = () => {
  const { hash } = useParams<{ hash: string }>();
  const { toast } = useToast();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateDocument = async () => {
      if (!hash) {
        setValidationResult({
          valid: false,
          error: 'Código de validação não fornecido'
        });
        setLoading(false);
        return;
      }

      try {
        const result = await certificateService.validateDocument(hash);
        setValidationResult(result);
      } catch (error) {
        setValidationResult({
          valid: false,
          error: 'Erro ao validar documento'
        });
      } finally {
        setLoading(false);
      }
    };

    validateDocument();
  }, [hash]);

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      'prescription': 'Receita Médica',
      'certificate': 'Atestado Médico'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getCertificateTypeLabel = (type: string) => {
    const labels = {
      'medical_leave': 'Atestado de Afastamento',
      'fitness_certificate': 'Atestado de Aptidão',
      'vaccination_certificate': 'Atestado de Vacinação',
      'medical_report': 'Relatório Médico'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleDownloadPDF = async () => {
    if (!validationResult?.document) return;

    try {
      let blob: Blob;
      let filename: string;

      if (validationResult.document.type === 'prescription') {
        blob = await pdfService.generatePrescriptionPDF(validationResult.document);
        filename = `receita-${validationResult.document.prescription_number}.pdf`;
      } else {
        blob = await pdfService.generateCertificatePDF(validationResult.document);
        filename = `atestado-${validationResult.document.certificate_number}.pdf`;
      }

      pdfService.downloadPDF(blob, filename);
      toast({
        title: "PDF gerado",
        description: "O PDF do documento foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF do documento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validando documento...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Validação de Documento
          </h1>
          <p className="text-gray-600">
            Resultado da validação do documento médico
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {validationResult?.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className={validationResult?.valid ? "text-green-900" : "text-red-900"}>
                {validationResult?.valid ? "Documento Válido" : "Documento Inválido"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {validationResult?.valid && validationResult.document ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {getDocumentTypeLabel(validationResult.document.type)}
                  </Badge>
                  {validationResult.document.certificate_type && (
                    <Badge variant="outline" className="text-sm">
                      {getCertificateTypeLabel(validationResult.document.certificate_type)}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-sm text-gray-600">Médico:</span>
                      <p className="font-medium">{validationResult.document.doctor_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-sm text-gray-600">Paciente:</span>
                      <p className="font-medium">{validationResult.document.patient_name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="text-sm text-gray-600">Data de emissão:</span>
                    <p className="font-medium">
                      {format(
                        new Date(validationResult.document.created_at || validationResult.document.prescribed_date), 
                        'dd/MM/yyyy HH:mm', 
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                </div>

                {validationResult.document.type === 'prescription' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Informações da Receita
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Medicamento:</span>
                        <span className="ml-2">{validationResult.document.medication_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Dosagem:</span>
                        <span className="ml-2">{validationResult.document.dosage}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Frequência:</span>
                        <span className="ml-2">{validationResult.document.frequency}</span>
                      </div>
                      {validationResult.document.instructions && (
                        <div>
                          <span className="font-medium text-blue-800">Instruções:</span>
                          <p className="ml-2 mt-1">{validationResult.document.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {validationResult.document.type === 'certificate' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Informações do Atestado
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-green-800">Título:</span>
                        <span className="ml-2">{validationResult.document.title}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Conteúdo:</span>
                        <p className="ml-2 mt-1">{validationResult.document.content}</p>
                      </div>
                      {validationResult.document.start_date && validationResult.document.end_date && (
                        <div>
                          <span className="font-medium text-green-800">Período:</span>
                          <span className="ml-2">
                            {format(new Date(validationResult.document.start_date), 'dd/MM/yyyy', { locale: ptBR })} - 
                            {format(new Date(validationResult.document.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      <p>Validado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      <p>Número: {validationResult.document.prescription_number || validationResult.document.certificate_number}</p>
                    </div>
                    <Button onClick={handleDownloadPDF} size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Baixar PDF
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Documento não encontrado
                </h3>
                <p className="text-red-600">
                  {validationResult?.error || "O código de validação fornecido não corresponde a nenhum documento válido."}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Verifique se o código foi digitado corretamente ou entre em contato com o médico responsável.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ValidarDocumento;
