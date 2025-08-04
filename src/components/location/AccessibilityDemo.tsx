/**
 * Accessibility Demo Component
 * Demonstrates and tests all accessibility features implemented in location components
 */

import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  MousePointer,
  Contrast,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { LocationCard } from './LocationCard';
import { LocationDetailsPanel } from './LocationDetailsPanel';
import { LocationFacilities } from './LocationFacilities';
import { LocationActions } from './LocationActions';
import { TimeSlotButton } from '../scheduling/TimeSlotButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLocationAccessibility } from '@/hooks/useAccessibility';
import { 
  announceToScreenReader,
  detectHighContrastMode,
  prefersReducedMotion,
  isTouchDevice
} from '@/utils/accessibilityUtils';
import { LocationWithTimeSlots, LocationFacility } from '@/types/location';

// Mock data for testing
const mockLocation: LocationWithTimeSlots = {
  id: 'location-1',
  nome_local: 'Clínica São Paulo',
  endereco_completo: 'Rua das Flores, 123, Centro, São Paulo, SP, 01234-567',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  email: 'contato@clinicasp.com.br',
  website: 'https://clinicasp.com.br',
  coordenadas: { lat: -23.5505, lng: -46.6333 },
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
    { type: 'estacionamento', available: true, cost: 'gratuito', details: '50 vagas disponíveis' },
    { type: 'acessibilidade', available: true, details: 'Rampa de acesso e elevador' },
    { type: 'wifi', available: true, cost: 'gratuito' },
    { type: 'ar_condicionado', available: true },
    { type: 'farmacia', available: false }
  ] as LocationFacility[],
  status: 'ativo',
  available_slots_count: 8,
  horarios_disponiveis: [
    { time: '09:00', available: true, location_id: 'location-1' },
    { time: '10:00', available: true, location_id: 'location-1' },
    { time: '14:00', available: true, location_id: 'location-1' },
    { time: '15:00', available: false, location_id: 'location-1' }
  ],
  ultima_atualizacao: new Date().toISOString(),
  is_open_now: true,
  distance_km: 2.5
};

const mockLocations = [mockLocation];

interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  implemented: boolean;
  testable: boolean;
}

const accessibilityFeatures: AccessibilityFeature[] = [
  {
    id: 'aria-labels',
    name: 'ARIA Labels',
    description: 'Comprehensive ARIA labels for all interactive elements',
    implemented: true,
    testable: true
  },
  {
    id: 'keyboard-navigation',
    name: 'Keyboard Navigation',
    description: 'Full keyboard navigation support with arrow keys, Tab, Enter, and Space',
    implemented: true,
    testable: true
  },
  {
    id: 'screen-reader',
    name: 'Screen Reader Announcements',
    description: 'Live announcements for location changes and interactions',
    implemented: true,
    testable: true
  },
  {
    id: 'high-contrast',
    name: 'High Contrast Mode',
    description: 'Enhanced visibility for high contrast mode users',
    implemented: true,
    testable: true
  },
  {
    id: 'focus-management',
    name: 'Focus Management',
    description: 'Proper focus indicators and focus trapping where needed',
    implemented: true,
    testable: true
  },
  {
    id: 'reduced-motion',
    name: 'Reduced Motion Support',
    description: 'Respects user preference for reduced motion',
    implemented: true,
    testable: true
  },
  {
    id: 'touch-optimization',
    name: 'Touch Optimization',
    description: 'Enhanced touch targets and mobile-friendly interactions',
    implemented: true,
    testable: true
  },
  {
    id: 'semantic-html',
    name: 'Semantic HTML',
    description: 'Proper use of semantic HTML elements and roles',
    implemented: true,
    testable: false
  }
];

export const AccessibilityDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [testMode, setTestMode] = useState<'visual' | 'keyboard' | 'screen-reader'>('visual');
  
  const { 
    announce,
    isHighContrast,
    reducedMotion,
    isTouchDevice: touchDevice
  } = useLocationAccessibility();

  // Test functions
  const testScreenReaderAnnouncement = (message: string) => {
    announceToScreenReader(message, 'polite');
    setAnnouncements(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testKeyboardNavigation = () => {
    testScreenReaderAnnouncement('Teste de navegação por teclado iniciado. Use Tab, setas, Enter e Espaço para navegar.');
  };

  const testLocationSelection = () => {
    setSelectedLocation(mockLocation.id);
    testScreenReaderAnnouncement(`Estabelecimento ${mockLocation.nome_local} selecionado para teste.`);
  };

  const clearAnnouncements = () => {
    setAnnouncements([]);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Demonstração de Acessibilidade
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Esta página demonstra todas as funcionalidades de acessibilidade implementadas 
          nos componentes de localização do sistema de agendamento.
        </p>
      </div>

      {/* System Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Detecção do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Alto Contraste</span>
              <Badge variant={isHighContrast ? "default" : "secondary"}>
                {isHighContrast ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Movimento Reduzido</span>
              <Badge variant={reducedMotion ? "default" : "secondary"}>
                {reducedMotion ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Dispositivo Touch</span>
              <Badge variant={touchDevice ? "default" : "secondary"}>
                {touchDevice ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Funcionalidades Implementadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessibilityFeatures.map((feature) => (
              <div 
                key={feature.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="mt-1">
                  {feature.implemented ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{feature.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  {feature.testable && (
                    <Badge variant="outline" className="mt-2">
                      Testável
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Controles de Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Test Mode Selection */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Modo de Teste:</span>
              <div className="flex gap-2">
                <Button
                  variant={testMode === 'visual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestMode('visual')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visual
                </Button>
                <Button
                  variant={testMode === 'keyboard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestMode('keyboard')}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Teclado
                </Button>
                <Button
                  variant={testMode === 'screen-reader' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestMode('screen-reader')}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Leitor de Tela
                </Button>
              </div>
            </div>

            {/* Test Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => testScreenReaderAnnouncement('Teste de anúncio para leitores de tela.')}
              >
                Testar Anúncio
              </Button>
              <Button
                variant="outline"
                onClick={testKeyboardNavigation}
              >
                Testar Navegação
              </Button>
              <Button
                variant="outline"
                onClick={testLocationSelection}
              >
                Testar Seleção
              </Button>
              <Button
                variant="outline"
                onClick={clearAnnouncements}
              >
                Limpar Log
              </Button>
            </div>

            {/* Instructions */}
            {testMode === 'keyboard' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instruções para Teste de Teclado</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 rounded">Tab</kbd> para navegar entre elementos</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 rounded">Setas</kbd> para navegar dentro de grupos</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 rounded">Enter</kbd> ou <kbd className="px-1 py-0.5 bg-blue-200 rounded">Espaço</kbd> para ativar</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 rounded">Esc</kbd> para fechar diálogos</li>
                </ul>
              </div>
            )}

            {testMode === 'screen-reader' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Instruções para Teste de Leitor de Tela</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Ative seu leitor de tela (NVDA, JAWS, VoiceOver, etc.)</li>
                  <li>• Navegue pelos elementos e ouça as descrições</li>
                  <li>• Teste as interações e ouça os anúncios</li>
                  <li>• Verifique se todas as informações são comunicadas</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcements Log */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Log de Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {announcements.map((announcement, index) => (
                <div 
                  key={index}
                  className="p-2 bg-gray-50 rounded text-sm font-mono"
                >
                  {announcement}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Component Demonstrations */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Demonstrações dos Componentes</h2>

        {/* LocationCard Demo */}
        <Card>
          <CardHeader>
            <CardTitle>LocationCard com Acessibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <LocationCard
                location={mockLocation}
                isSelected={selectedLocation === mockLocation.id}
                onSelect={() => setSelectedLocation(mockLocation.id)}
              />
            </div>
          </CardContent>
        </Card>

        {/* LocationFacilities Demo */}
        <Card>
          <CardHeader>
            <CardTitle>LocationFacilities com Acessibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationFacilities
              facilities={mockLocation.facilidades}
              showUnavailable={true}
            />
          </CardContent>
        </Card>

        {/* LocationActions Demo */}
        <Card>
          <CardHeader>
            <CardTitle>LocationActions com Acessibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationActions
              location={mockLocation}
              appointmentTime="14:00"
            />
          </CardContent>
        </Card>

        {/* TimeSlotButton Demo */}
        <Card>
          <CardHeader>
            <CardTitle>TimeSlotButton com Acessibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <TimeSlotButton
                time="09:00"
                available={true}
                selected={false}
                onClick={() => testScreenReaderAnnouncement('Horário 09:00 selecionado')}
                locationName={mockLocation.nome_local}
                showLocationBadge={true}
              />
              <TimeSlotButton
                time="10:00"
                available={true}
                selected={true}
                onClick={() => testScreenReaderAnnouncement('Horário 10:00 selecionado')}
                locationName={mockLocation.nome_local}
                showLocationBadge={true}
              />
              <TimeSlotButton
                time="15:00"
                available={false}
                selected={false}
                onClick={() => {}}
                locationName={mockLocation.nome_local}
                showLocationBadge={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* LocationDetailsPanel Demo */}
        <Card>
          <CardHeader>
            <CardTitle>LocationDetailsPanel com Acessibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationDetailsPanel
              locations={mockLocations}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              onLocationFilter={() => {}}
              showComparison={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Diretrizes de Acessibilidade Implementadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>WCAG 2.1 AA Compliance</h4>
            <ul>
              <li><strong>Perceptível:</strong> Alto contraste, texto alternativo, estrutura semântica</li>
              <li><strong>Operável:</strong> Navegação por teclado, tempo suficiente, sem convulsões</li>
              <li><strong>Compreensível:</strong> Texto legível, funcionalidade previsível</li>
              <li><strong>Robusto:</strong> Compatibilidade com tecnologias assistivas</li>
            </ul>

            <h4>Tecnologias Assistivas Suportadas</h4>
            <ul>
              <li>Leitores de tela (NVDA, JAWS, VoiceOver, TalkBack)</li>
              <li>Navegação por teclado</li>
              <li>Reconhecimento de voz</li>
              <li>Ampliadores de tela</li>
              <li>Dispositivos de entrada alternativos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessibilityDemo;