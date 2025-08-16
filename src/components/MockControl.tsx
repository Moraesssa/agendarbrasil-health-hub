import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { mockDataService, MockUtils, MockData } from '@/services/mockDataService';
import { useAuth } from '@/contexts/AuthContext';

export const MockControl = () => {
  const [isEnabled, setIsEnabled] = useState(mockDataService.isEnabled());
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [stats, setStats] = useState(mockDataService.getStatistics());
  const { user } = useAuth();

  // Atualizar estado quando mocks mudam
  useEffect(() => {
    const checkMockStatus = () => {
      setIsEnabled(mockDataService.isEnabled());
      setStats(mockDataService.getStatistics());
    };

    const interval = setInterval(checkMockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMocks = (enabled: boolean) => {
    if (enabled) {
      MockUtils.enable();
      setCurrentPatientIndex(0);
      // Recarregar página para aplicar mudanças
      window.location.reload();
    } else {
      MockUtils.disable();
      window.location.reload();
    }
  };

  const changePatient = (index: string) => {
    const newIndex = parseInt(index);
    setCurrentPatientIndex(newIndex);
    mockDataService.setCurrentPatient(newIndex);
    // Recarregar página para aplicar mudanças
    window.location.reload();
  };

  const currentPatient = mockDataService.getCurrentPatient();
  const allCities = MockUtils.getAllCities();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🎭 Controle de Dados Mock
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "ATIVO" : "INATIVO"}
            </Badge>
          </CardTitle>
          <Switch
            checked={isEnabled}
            onCheckedChange={toggleMocks}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isEnabled ? (
          <>
            {/* Usuário Atual */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Usuário Atual</h3>
              {currentPatient && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Nome:</strong> {currentPatient.display_name}</p>
                    <p><strong>Email:</strong> {currentPatient.email}</p>
                    <p><strong>CPF:</strong> {currentPatient.cpf}</p>
                    <p><strong>Telefone:</strong> {currentPatient.telefone}</p>
                  </div>
                  <div>
                    <p><strong>Cidade:</strong> {currentPatient.cidade}</p>
                    <p><strong>Estado:</strong> {currentPatient.estado}</p>
                    <p><strong>Sexo:</strong> {currentPatient.sexo}</p>
                    <p><strong>Nascimento:</strong> {new Date(currentPatient.data_nascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Seletor de Paciente */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Trocar Paciente</h3>
              <Select value={currentPatientIndex.toString()} onValueChange={changePatient}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {MockData.patients.map((patient, index) => (
                    <SelectItem key={patient.id} value={index.toString()}>
                      {patient.display_name} - {patient.cidade}/{patient.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Estatísticas */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Estatísticas dos Dados</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Total</h4>
                  <p className="text-2xl font-bold text-primary">{stats.totalPatients}</p>
                  <p className="text-sm text-muted-foreground">pacientes</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Por Gênero</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Masculino:</span>
                      <span>{stats.byGender.masculino}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feminino:</span>
                      <span>{stats.byGender.feminino}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Por Estado</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(stats.byState).map(([state, count]) => (
                      <div key={state} className="flex justify-between">
                        <span>{state}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Distribuição por Cidade */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Distribuição por Cidade</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {allCities.map(({ city, state, count }) => (
                  <div key={`${city}-${state}`} className="flex justify-between p-2 border rounded">
                    <span className="text-sm">{city}/{state}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Ações Rápidas */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const randomPatient = MockUtils.getRandomPatient();
                    const index = MockData.patients.findIndex(p => p.id === randomPatient.id);
                    changePatient(index.toString());
                  }}
                >
                  Paciente Aleatório
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('📊 Estatísticas Mock:', stats);
                    console.log('👥 Todos os pacientes:', MockData.patients);
                    console.log('🏙️ Cidades:', allCities);
                  }}
                >
                  Log Dados no Console
                </Button>
              </div>
            </div>
            
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Os dados mock estão desativados. Ative para usar dados de teste.
            </p>
            <p className="text-sm text-muted-foreground">
              Dados mock incluem {MockData.totalPatients} pacientes distribuídos em 9 estados brasileiros.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};