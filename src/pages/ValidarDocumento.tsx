
import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import { useCertificateManagement } from "@/hooks/useCertificateManagement";
import DocumentValidator from "@/components/certificates/DocumentValidator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, Shield } from "lucide-react";

const ValidarDocumento = () => {
  const { hash } = useParams<{ hash: string }>();
  const { validateDocument } = useCertificateManagement();
  const [validationResult, setValidationResult] = useState<any>(null);

  // Se há um hash na URL, valida automaticamente
  React.useEffect(() => {
    if (hash) {
      handleValidation(hash);
    }
  }, [hash]);

  const handleValidation = async (validationHash: string) => {
    const result = await validateDocument(validationHash);
    setValidationResult(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Validação de Documentos Médicos
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verifique a autenticidade de receitas médicas e atestados usando o código de validação
            </p>
          </div>

          {/* Informações sobre segurança */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Sistema Seguro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-green-800">Criptografia</h4>
                    <p className="text-green-700">Códigos únicos e criptografados</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-green-800">Rastreabilidade</h4>
                    <p className="text-green-700">Todas as validações são registradas</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-green-800">Verificação</h4>
                    <p className="text-green-700">Instantânea e confiável</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Componente de validação */}
          <DocumentValidator 
            onValidate={handleValidation}
            isLoading={false}
          />

          {/* Resultado automático se há hash na URL */}
          {hash && validationResult && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-900">
                    Resultado da Validação Automática
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={validationResult.valid ? "default" : "destructive"}>
                      {validationResult.valid ? "Válido" : "Inválido"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Código: {hash.substring(0, 10)}...
                    </span>
                  </div>
                  
                  {validationResult.valid && validationResult.document && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {validationResult.document.type === 'prescription' ? 'Receita Médica' : 'Atestado Médico'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Médico: {validationResult.document.doctor_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Paciente: {validationResult.document.patient_name}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Como usar */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-gray-900">Como usar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">1. Localize o código</h4>
                  <p className="text-sm text-gray-600">
                    O código de validação está localizado no documento médico, 
                    geralmente no rodapé ou próximo à assinatura do médico.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2. Digite o código</h4>
                  <p className="text-sm text-gray-600">
                    Insira o código completo no campo acima e clique em "Validar Documento" 
                    para verificar a autenticidade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ValidarDocumento;
