import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationActions } from './LocationActions';
import { LocationMap } from './LocationMap';
import { LocationMapModal, useLocationMapModal } from './LocationMapModal';
import { useMapsIntegration } from '@/hooks/useMapsIntegration';
import { EnhancedLocation } from '@/types/location';

// Demo location data
const demoLocation: EnhancedLocation = {
  id: 'demo-location-1',
  nome_local: 'Hospital São Paulo',
  endereco_completo: 'Rua Napoleão de Barros, 715',
  bairro: 'Vila Clementino',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '04024-002',
  telefone: '(11) 5576-4000',
  email: 'contato@hospitalsaopaulo.com.br',
  website: 'https://www.hospitalsaopaulo.com.br',
  coordenadas: {
    lat: -23.5985,
    lng: -46.6448,
    precisao: 'exata'
  },
  horario_funcionamento: {
    segunda: { abertura: '06:00', fechamento: '22:00', fechado: false },
    terca: { abertura: '06:00', fechamento: '22:00', fechado: false },
    quarta: { abertura: '06:00', fechamento: '22:00', fechado: false },
    quinta: { abertura: '06:00', fechamento: '22:00', fechado: false },
    sexta: { abertura: '06:00', fechamento: '22:00', fechado: false },
    sabado: { abertura: '08:00', fechamento: '18:00', fechado: false },
    domingo: { abertura: '08:00', fechamento: '18:00', fechado: false }
  },
  facilidades: [
    { type: 'estacionamento', available: true, cost: 'pago', details: 'R$ 5,00/hora' },
    { type: 'acessibilidade', available: true },
    { type: 'farmacia', available: true },
    { type: 'wifi', available: true },
    { type: 'ar_condicionado', available: true }
  ],
  status: 'ativo',
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual',
  horarios_disponiveis: []
};

export const LocationMapsDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('actions');
  const { isOpen, location, openModal, closeModal } = useLocationMapModal();
  
  const {
    loading,
    error,
    availableProviders,
    selectedProvider,
    userLocation,
    isReady,
    hasUserLocation
  } = useMapsIntegration({
    defaultProvider: 'google',
    enableUserLocation: true
  });

  const handleActionComplete = (result: any) => {
    console.log('Maps action completed:', result);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demo - Integração de Mapas
        </h1>
        <p className="text-gray-600">
          Demonstração das funcionalidades de mapas implementadas
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Integração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant={loading ? 'secondary' : 'default'}>
                {loading ? 'Carregando...' : 'Pronto'}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Status</p>
            </div>
            
            <div className="text-center">
              <Badge variant={error ? 'destructive' : 'default'}>
                {error ? 'Erro' : 'OK'}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Serviço</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline">
                {availableProviders.length}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Provedores</p>
            </div>
            
            <div className="text-center">
              <Badge variant={hasUserLocation ? 'default' : 'secondary'}>
                {hasUserLocation ? 'Detectada' : 'Não disponível'}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Localização</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {availableProviders.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Provedores disponíveis:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableProviders.map((provider) => (
                  <Badge 
                    key={provider} 
                    variant={provider === selectedProvider ? 'default' : 'outline'}
                  >
                    {provider}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {userLocation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                📍 Sua localização: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Selector */}
      <div className="flex justify-center gap-2">
        <Button
          variant={selectedDemo === 'actions' ? 'default' : 'outline'}
          onClick={() => setSelectedDemo('actions')}
        >
          Ações de Localização
        </Button>
        <Button
          variant={selectedDemo === 'map' ? 'default' : 'outline'}
          onClick={() => setSelectedDemo('map')}
        >
          Mapa Incorporado
        </Button>
        <Button
          variant={selectedDemo === 'modal' ? 'default' : 'outline'}
          onClick={() => setSelectedDemo('modal')}
        >
          Modal de Mapa
        </Button>
      </div>

      {/* Demo Content */}
      {selectedDemo === 'actions' && (
        <Card>
          <CardHeader>
            <CardTitle>Ações de Localização</CardTitle>
            <p className="text-sm text-gray-600">
              Teste os botões de ação para mapas, chamadas e compartilhamento
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Versão Completa</h4>
                <LocationActions
                  location={demoLocation}
                  showDirections={true}
                  onActionComplete={handleActionComplete}
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Versão Compacta</h4>
                <LocationActions
                  location={demoLocation}
                  compact={true}
                  showDirections={true}
                  onActionComplete={handleActionComplete}
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Versão Vertical</h4>
                <LocationActions
                  location={demoLocation}
                  orientation="vertical"
                  showDirections={true}
                  onActionComplete={handleActionComplete}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDemo === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa Incorporado</CardTitle>
            <p className="text-sm text-gray-600">
              Visualização de mapa com controles integrados
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <LocationMap
                location={demoLocation}
                height="400px"
                showControls={true}
                showProviderSelector={true}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDemo === 'modal' && (
        <Card>
          <CardHeader>
            <CardTitle>Modal de Mapa</CardTitle>
            <p className="text-sm text-gray-600">
              Mapa em tela cheia com funcionalidades avançadas
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => openModal(demoLocation)}>
              Abrir Mapa em Modal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Localização de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Nome:</strong> {demoLocation.nome_local}</p>
              <p><strong>Endereço:</strong> {demoLocation.endereco_completo}</p>
              <p><strong>Cidade:</strong> {demoLocation.cidade}, {demoLocation.estado}</p>
              <p><strong>CEP:</strong> {demoLocation.cep}</p>
            </div>
            <div>
              <p><strong>Telefone:</strong> {demoLocation.telefone}</p>
              <p><strong>Email:</strong> {demoLocation.email}</p>
              <p><strong>Website:</strong> {demoLocation.website}</p>
              <p><strong>Coordenadas:</strong> {demoLocation.coordenadas?.lat}, {demoLocation.coordenadas?.lng}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <LocationMapModal
        location={location || demoLocation}
        isOpen={isOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default LocationMapsDemo;