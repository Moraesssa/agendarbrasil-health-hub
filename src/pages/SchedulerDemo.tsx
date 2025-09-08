/**
 * Demo Realístico do Sistema de Agendamento
 * Simulação de cenários reais da plataforma de telemedicina
 */

import React from 'react';
import { TelemedicineSchedulerDemo } from '@/components/scheduling/TelemedicineSchedulerDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Video, 
  Users, 
  Clock, 
  MapPin,
  Stethoscope,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const SchedulerDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Sistema de Agendamento Inteligente
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Demonstração prática do sistema de agendamento para telemedicina com cenários reais de médicos e pacientes
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="outline" className="px-3 py-1">
              <Video className="w-4 h-4 mr-1" />
              Teleconsultas
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <MapPin className="w-4 h-4 mr-1" />
              Consultas Presenciais
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Emergências
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Users className="w-4 h-4 mr-1" />
              Gestão Familiar
            </Badge>
          </div>
        </div>

        {/* Cenários de Uso */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="w-5 h-5 text-blue-500" />
                Dr. Silva - Cardiologista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Agenda mista: teleconsultas e presenciais. Especialista em casos complexos.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Consulta inicial:</span>
                  <span>45min</span>
                </div>
                <div className="flex justify-between">
                  <span>Retorno:</span>
                  <span>30min</span>
                </div>
                <div className="flex justify-between">
                  <span>Teleconsulta:</span>
                  <span>25min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-green-500" />
                Família Santos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Mãe agenda para 3 filhos. Prefere horários consecutivos quando possível.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Ana (mãe):</span>
                  <span>Diabetes</span>
                </div>
                <div className="flex justify-between">
                  <span>João (12 anos):</span>
                  <span>Pediatria</span>
                </div>
                <div className="flex justify-between">
                  <span>Maria (8 anos):</span>
                  <span>Alergia</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Cenários Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Emergências, no-shows e atrasos que testam a flexibilidade do sistema.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Emergência:</span>
                  <span>&lt; 15min</span>
                </div>
                <div className="flex justify-between">
                  <span>No-show:</span>
                  <span>~8% casos</span>
                </div>
                <div className="flex justify-between">
                  <span>Atraso médio:</span>
                  <span>12min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidades Demonstradas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Funcionalidades Demonstradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-600">Para Médicos</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Agenda otimizada considerando tipo de consulta</li>
                  <li>• Gestão de teleconsultas vs presenciais</li>
                  <li>• Inserção automática de emergências</li>
                  <li>• Buffers inteligentes entre consultas</li>
                  <li>• Notificações de atrasos e no-shows</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-green-600">Para Pacientes/Famílias</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Agendamento para múltiplos familiares</li>
                  <li>• Preferências de horário e modalidade</li>
                  <li>• Reagendamento automático em emergências</li>
                  <li>• Estimativas realistas de tempo de espera</li>
                  <li>• Lembretes e preparação para consulta</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Component */}
        <TelemedicineSchedulerDemo />

        {/* Métricas de Sucesso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-500" />
              Métricas de Qualidade do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">92%</div>
                <p className="text-sm text-gray-600">Consultas no horário<br/>(±5 minutos)</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">8min</div>
                <p className="text-sm text-gray-600">Tempo médio<br/>de espera</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
                <p className="text-sm text-gray-600">Satisfação<br/>dos pacientes</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">15%</div>
                <p className="text-sm text-gray-600">Redução de<br/>no-shows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            Sistema desenvolvido especificamente para as necessidades da telemedicina brasileira
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchedulerDemo;