
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, FileText, User, Calendar } from "lucide-react";
import { ValidationResult } from "@/types/certificates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentValidatorProps {
  onValidate: (hash: string) => Promise<ValidationResult>;
  isLoading?: boolean;
}

const DocumentValidator = ({ onValidate, isLoading = false }: DocumentValidatorProps) => {
  const [validationHash, setValidationHash] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationHash.trim()) {
      return;
    }

    const result = await onValidate(validationHash.trim());
    setValidationResult(result);
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-900">Validar Documento</CardTitle>
          <p className="text-sm text-gray-600">
            Digite o código de validação para verificar a autenticidade do documento
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleValidate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="validation_hash">Código de Validação</Label>
              <Input
                id="validation_hash"
                value={validationHash}
                onChange={(e) => setValidationHash(e.target.value)}
                placeholder="Digite o código de validação..."
                required
              />
            </div>
            
            <Button type="submit" disabled={isLoading || !validationHash.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Validando..." : "Validar Documento"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {validationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className={validationResult.valid ? "text-green-900" : "text-red-900"}>
                {validationResult.valid ? "Documento Válido" : "Documento Inválido"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {validationResult.valid && validationResult.document ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getDocumentTypeLabel(validationResult.document.type)}
                  </Badge>
                  {validationResult.document.certificate_type && (
                    <Badge variant="outline">
                      {getCertificateTypeLabel(validationResult.document.certificate_type)}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-gray-600">Médico:</span>
                      <p className="font-medium">{validationResult.document.doctor_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="text-gray-600">Paciente:</span>
                      <p className="font-medium">{validationResult.document.patient_name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="text-gray-600">Data:</span>
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
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Prescrição:</h4>
                    <p className="text-sm text-blue-800">
                      <strong>Medicamento:</strong> {validationResult.document.medication_name}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Dosagem:</strong> {validationResult.document.dosage}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Frequência:</strong> {validationResult.document.frequency}
                    </p>
                  </div>
                )}

                {validationResult.document.type === 'certificate' && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Atestado:</h4>
                    <p className="text-sm text-green-800">
                      <strong>Título:</strong> {validationResult.document.title}
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      {validationResult.document.content}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p>Documento validado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  <p>Número do documento: {validationResult.document.prescription_number || validationResult.document.certificate_number}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-600">{validationResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentValidator;
