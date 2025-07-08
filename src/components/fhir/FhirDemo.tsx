
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFhirHealthMetrics } from '@/hooks/useFhirHealthMetrics';
import { fhirService } from '@/services/fhirService';
import { Activity, Database, Zap } from 'lucide-react';

const FhirDemo = () => {
  const { user } = useAuth();
  const { metrics, loading, refetch } = useFhirHealthMetrics();
  const [converting, setConverting] = useState(false);
  const [fhirPatient, setFhirPatient] = useState<any>(null);

  const handleConvertToFhir = async () => {
    if (!user) return;
    
    setConverting(true);
    try {
      const patient = await fhirService.convertProfileToFhir(user.id);
      setFhirPatient(patient);
    } catch (error) {
      console.error('Error converting to FHIR:', error);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Database className="h-5 w-5" />
            FHIR Integration Demo
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              HL7 FHIR R4
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="font-medium">FHIR Observations</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{metrics.length}</p>
                <p className="text-sm text-muted-foreground">Métricas convertidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">FHIR Patient</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {fhirPatient ? '1' : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Perfil convertido</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Interoperabilidade</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">100%</p>
                <p className="text-sm text-muted-foreground">Compatível HL7</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleConvertToFhir}
              disabled={converting || !user}
              variant="outline"
            >
              {converting ? 'Convertendo...' : 'Converter Perfil para FHIR'}
            </Button>
            
            <Button 
              onClick={refetch}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Carregando...' : 'Recarregar Métricas FHIR'}
            </Button>
          </div>

          {fhirPatient && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">FHIR Patient Resource</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(fhirPatient, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Recursos FHIR Implementados:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Patient - Dados demográficos do paciente</li>
              <li>Observation - Métricas de saúde (sinais vitais)</li>
              <li>Bundle - Coleções de recursos para pesquisas</li>
              <li>OperationOutcome - Resultados de operações</li>
            </ul>
            
            <p><strong>APIs FHIR Disponíveis:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>GET /fhir/Patient/[id] - Buscar paciente</li>
              <li>GET /fhir/Observation?patient=[id] - Buscar observações</li>
              <li>POST /fhir/Observation - Criar nova observação</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FhirDemo;
