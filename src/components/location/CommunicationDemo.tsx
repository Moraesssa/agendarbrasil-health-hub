/**
 * Demo component for testing communication integrations
 * Provides UI to test phone calls, WhatsApp, email, SMS, and system sharing
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Share2, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Smartphone,
  Monitor,
  Clipboard
} from 'lucide-react';
import { CommunicationService, ShareLocationData } from '@/services/communicationService';
import { EnhancedLocation } from '@/types/location';
import { toast } from '@/hooks/use-toast';

// Mock location data for testing
const mockLocation: EnhancedLocation = {
  id: 'demo-001',
  nome_local: 'Clínica Demo São Paulo',
  endereco_completo: 'Rua das Flores, 123, Centro',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '11987654321',
  whatsapp: '11987654321',
  email: 'contato@clinicademo.com.br',
  website: 'https://clinicademo.com.br',
  coordenadas: {
    lat: -23.5505,
    lng: -46.6333,
    precisao: 'exata'
  },
  horario_funcionamento: {
    segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
    terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
    quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
    sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
    domingo: { abertura: '00:00', fechamento: '00:00', fechado: true }
  },
  facilidades: [
    { type: 'estacionamento', available: true, cost: 'gratuito' },
    { type: 'acessibilidade', available: true },
    { type: 'wifi', available: true },
    { type: 'ar_condicionado', available: true }
  ],
  status: 'ativo',
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual',
  instrucoes_acesso: 'Entrada principal pela Rua das Flores. Estacionamento nos fundos.',
  observacoes_especiais: 'Favor chegar 15 minutos antes da consulta.',
  horarios_disponiveis: []
};

const mockShareData: ShareLocationData = {
  location: mockLocation,
  appointmentDate: '15/01/2025',
  appointmentTime: '14:30',
  doctorName: 'Dr. João Silva',
  specialty: 'Cardiologia',
  patientName: 'Maria Santos',
  additionalNotes: 'Trazer exames anteriores'
};

interface TestResult {
  success: boolean;
  message: string;
  provider?: string;
  fallbackUsed?: boolean;
}

export const CommunicationDemo: React.FC = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    
    try {
      const result = await testFunction();
      setResults(prev => ({ ...prev, [testName]: result }));
      
      if (result.success) {
        toast({
          title: "Teste bem-sucedido",
          description: result.message,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: result.message || result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      setResults(prev => ({ ...prev, [testName]: errorResult }));
      
      toast({
        title: "Erro no teste",
        description: errorResult.message,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const getResultIcon = (result?: TestResult) => {
    if (!result) return null;
    
    if (result.success) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getResultBadge = (result?: TestResult) => {
    if (!result) return null;
    
    return (
      <Badge variant={result.success ? "default" : "destructive"} className="ml-2">
        {result.success ? "Sucesso" : "Falha"}
        {result.fallbackUsed && " (Fallback)"}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Demo de Integrações de Comunicação
          </CardTitle>
          <CardDescription>
            Teste as funcionalidades de comunicação com dados de exemplo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Informações do Local</h4>
              <div className="text-sm space-y-1">
                <p><strong>Nome:</strong> {mockLocation.nome_local}</p>
                <p><strong>Endereço:</strong> {mockLocation.endereco_completo}</p>
                <p><strong>Telefone:</strong> {CommunicationService.formatPhoneNumber(mockLocation.telefone!)}</p>
                <p><strong>Email:</strong> {mockLocation.email}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dados da Consulta</h4>
              <div className="text-sm space-y-1">
                <p><strong>Data:</strong> {mockShareData.appointmentDate}</p>
                <p><strong>Horário:</strong> {mockShareData.appointmentTime}</p>
                <p><strong>Médico:</strong> {mockShareData.doctorName}</p>
                <p><strong>Paciente:</strong> {mockShareData.patientName}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h4 className="font-semibold">Capacidades do Dispositivo</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={CommunicationService.canMakePhoneCalls() ? "default" : "secondary"}>
                <Phone className="h-3 w-3 mr-1" />
                Chamadas: {CommunicationService.canMakePhoneCalls() ? "Suportado" : "Não Suportado"}
              </Badge>
              <Badge variant={CommunicationService.canSendSMS() ? "default" : "secondary"}>
                <MessageCircle className="h-3 w-3 mr-1" />
                SMS: {CommunicationService.canSendSMS() ? "Suportado" : "Não Suportado"}
              </Badge>
              <Badge variant={CommunicationService.supportsNativeSharing() ? "default" : "secondary"}>
                <Share2 className="h-3 w-3 mr-1" />
                Compartilhamento: {CommunicationService.supportsNativeSharing() ? "Suportado" : "Não Suportado"}
              </Badge>
              <Badge variant={CommunicationService.supportsClipboard() ? "default" : "secondary"}>
                <Clipboard className="h-3 w-3 mr-1" />
                Clipboard: {CommunicationService.supportsClipboard() ? "Suportado" : "Não Suportado"}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h4 className="font-semibold">Testes de Comunicação</h4>
            
            {/* Phone Call Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Chamada Telefônica</p>
                  <p className="text-sm text-gray-600">Testa abertura do discador</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(results.phone)}
                {getResultBadge(results.phone)}
                <Button
                  onClick={() => handleTest('phone', () => 
                    CommunicationService.makePhoneCall(mockLocation.telefone!)
                  )}
                  disabled={loading.phone}
                  size="sm"
                >
                  {loading.phone ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>

            {/* WhatsApp Chat Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Chat WhatsApp</p>
                  <p className="text-sm text-gray-600">Abre WhatsApp com mensagem</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(results.whatsappChat)}
                {getResultBadge(results.whatsappChat)}
                <Button
                  onClick={() => handleTest('whatsappChat', () => 
                    CommunicationService.openWhatsAppChat(
                      mockLocation.whatsapp!, 
                      'Olá! Gostaria de confirmar minha consulta.'
                    )
                  )}
                  disabled={loading.whatsappChat}
                  size="sm"
                >
                  {loading.whatsappChat ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>

            {/* WhatsApp Share Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Compartilhar WhatsApp</p>
                  <p className="text-sm text-gray-600">Compartilha informações detalhadas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(results.whatsappShare)}
                {getResultBadge(results.whatsappShare)}
                <Button
                  onClick={() => handleTest('whatsappShare', () => 
                    CommunicationService.shareViaWhatsApp(mockShareData, {
                      format: 'detailed',
                      includeDirections: true,
                      includeOperatingHours: true,
                      includeFacilities: true
                    })
                  )}
                  disabled={loading.whatsappShare}
                  size="sm"
                >
                  {loading.whatsappShare ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>

            {/* Email Share Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Compartilhar Email</p>
                  <p className="text-sm text-gray-600">Abre cliente de email</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(results.email)}
                {getResultBadge(results.email)}
                <Button
                  onClick={() => handleTest('email', () => 
                    CommunicationService.shareViaEmail(mockShareData, {
                      includeDirections: true,
                      includeOperatingHours: true,
                      includeFacilities: true
                    })
                  )}
                  disabled={loading.email}
                  size="sm"
                >
                  {loading.email ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>

            {/* SMS Share Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Compartilhar SMS</p>
                  <p className="text-sm text-gray-600">Abre aplicativo de SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(results.sms)}
                {getResultBadge(results.sms)}
                <Button
                  onClick={() => handleTest('sms', () => 
                    CommunicationService.shareViaSMS(mockShareData, {
                      format: 'simple',
                      includeDirections: false
                    })
                  )}
                  disabled={loading.sms}
                  size="sm"
                >
                  {loading.sms ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>

            {/* System Share Test */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Compartilhamento do Sistema</p>
                  <p className="text-sm text-gray-600">Usa Web Share API nativa</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(results.system)}
                {getResultBadge(results.system)}
                <Button
                  onClick={() => handleTest('system', () => 
                    CommunicationService.shareViaSystem(mockShareData, {
                      includeDirections: true
                    })
                  )}
                  disabled={loading.system}
                  size="sm"
                >
                  {loading.system ? "Testando..." : "Testar"}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h4 className="font-semibold">Mensagens Personalizadas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['reminder', 'invitation', 'directions', 'emergency'] as const).map((context) => (
                <div key={context} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium capitalize">{context}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const message = CommunicationService.createCustomMessage(mockShareData, context);
                        navigator.clipboard.writeText(message).then(() => {
                          toast({
                            title: "Copiado!",
                            description: `Mensagem de ${context} copiada para área de transferência`,
                          });
                        });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {CommunicationService.createCustomMessage(mockShareData, context).substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Informações sobre os Testes</p>
                <ul className="mt-2 space-y-1 text-blue-800">
                  <li>• Os testes funcionam melhor em dispositivos móveis</li>
                  <li>• Alguns recursos podem não estar disponíveis em todos os navegadores</li>
                  <li>• Fallbacks automáticos são usados quando necessário</li>
                  <li>• As mensagens são formatadas automaticamente para cada plataforma</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationDemo;