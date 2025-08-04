// Location Analytics Demo Component
// replaced by kiro @2025-02-08T19:30:00Z

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Star, 
  MessageCircle, 
  TrendingUp, 
  Users, 
  Eye,
  MousePointer,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LocationPopularityIndicator from './LocationPopularityIndicator';
import LocationRatingDisplay from './LocationRatingDisplay';
import LocationFeedbackForm from './LocationFeedbackForm';
import LocationAnalyticsDashboard from './LocationAnalyticsDashboard';
import { useLocationAnalytics, useLocationFeedback } from '@/hooks/useLocationAnalytics';
import { LocationWithTimeSlots } from '@/types/medical';

// Mock data for demonstration
const mockLocations: LocationWithTimeSlots[] = [
  {
    id: 'loc-1',
    nome_local: 'Hospital São Lucas',
    endereco_completo: 'Rua das Flores, 123 - Centro, São Paulo - SP',
    telefone: '(11) 3456-7890',
    email: 'contato@saolucas.com.br',
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '18:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '18:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '18:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '18:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '18:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'pago' },
      { type: 'acessibilidade', available: true },
      { type: 'farmacia', available: true },
      { type: 'wifi', available: true }
    ],
    coordenadas: { lat: -23.5505, lng: -46.6333 },
    horarios_disponiveis: [],
    ultima_atualizacao: new Date().toISOString(),
    status: 'ativo'
  },
  {
    id: 'loc-2',
    nome_local: 'Clínica Vida Nova',
    endereco_completo: 'Av. Paulista, 456 - Bela Vista, São Paulo - SP',
    telefone: '(11) 2345-6789',
    email: 'info@vidanova.com.br',
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '17:00', fechado: false },
      terca: { abertura: '08:00', fechamento: '17:00', fechado: false },
      quarta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      quinta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'gratuito' },
      { type: 'acessibilidade', available: true },
      { type: 'laboratorio', available: true },
      { type: 'ar_condicionado', available: true }
    ],
    coordenadas: { lat: -23.5616, lng: -46.6565 },
    horarios_disponiveis: [],
    ultima_atualizacao: new Date().toISOString(),
    status: 'ativo'
  },
  {
    id: 'loc-3',
    nome_local: 'Centro Médico Esperança',
    endereco_completo: 'Rua da Consolação, 789 - Consolação, São Paulo - SP',
    telefone: '(11) 4567-8901',
    email: 'atendimento@esperanca.med.br',
    horario_funcionamento: {
      segunda: { abertura: '06:00', fechamento: '20:00', fechado: false },
      terca: { abertura: '06:00', fechamento: '20:00', fechado: false },
      quarta: { abertura: '06:00', fechamento: '20:00', fechado: false },
      quinta: { abertura: '06:00', fechamento: '20:00', fechado: false },
      sexta: { abertura: '06:00', fechamento: '20:00', fechado: false },
      sabado: { abertura: '07:00', fechamento: '15:00', fechado: false },
      domingo: { abertura: '07:00', fechamento: '15:00', fechado: false }
    },
    facilidades: [
      { type: 'estacionamento', available: true, cost: 'pago' },
      { type: 'acessibilidade', available: true },
      { type: 'farmacia', available: true },
      { type: 'laboratorio', available: true },
      { type: 'wifi', available: true },
      { type: 'ar_condicionado', available: true }
    ],
    coordenadas: { lat: -23.5489, lng: -46.6388 },
    horarios_disponiveis: [],
    ultima_atualizacao: new Date().toISOString(),
    status: 'ativo'
  }
];

// Mock popularity data
const mockPopularityData = {
  'loc-1': {
    locationId: 'loc-1',
    popularityLevel: 'alta' as const,
    popularityScore: 75,
    trendDirection: 'crescendo' as const,
    recentSelections: 45,
    comparisonToAverage: 15.5
  },
  'loc-2': {
    locationId: 'loc-2',
    popularityLevel: 'média' as const,
    popularityScore: 55,
    trendDirection: 'estável' as const,
    recentSelections: 28,
    comparisonToAverage: -5.2
  },
  'loc-3': {
    locationId: 'loc-3',
    popularityLevel: 'muito_alta' as const,
    popularityScore: 92,
    trendDirection: 'crescendo' as const,
    recentSelections: 67,
    comparisonToAverage: 28.7
  }
};

const LocationAnalyticsDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('loc-1');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'correction' | 'suggestion'>('rating');
  const [demoStats, setDemoStats] = useState({
    views: 0,
    selections: 0,
    interactions: 0
  });

  const analytics = useLocationAnalytics();
  const feedback = useLocationFeedback();

  // Simulate analytics tracking for demo
  useEffect(() => {
    // Track view when component mounts
    analytics.trackView(selectedLocation, {
      source: 'demo',
      component: 'LocationAnalyticsDemo'
    });
  }, [selectedLocation, analytics]);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    analytics.trackSelection(locationId, {
      source: 'demo_selection',
      previousLocation: selectedLocation
    });
    
    setDemoStats(prev => ({
      ...prev,
      selections: prev.selections + 1
    }));
  };

  const handleLocationView = (locationId: string) => {
    analytics.trackView(locationId, {
      source: 'demo_view'
    });
    
    setDemoStats(prev => ({
      ...prev,
      views: prev.views + 1
    }));
  };

  const handleInteraction = (type: string, locationId?: string) => {
    const targetLocation = locationId || selectedLocation;
    
    switch (type) {
      case 'call':
        analytics.trackCall(targetLocation);
        break;
      case 'map':
        analytics.trackMap(targetLocation);
        break;
      case 'share':
        analytics.trackShare(targetLocation, 'demo');
        break;
      case 'compare':
        analytics.trackComparison(mockLocations.map(l => l.id));
        break;
    }
    
    setDemoStats(prev => ({
      ...prev,
      interactions: prev.interactions + 1
    }));
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackForm(false);
    // Refresh analytics data in a real implementation
  };

  const locationNames = mockLocations.reduce((acc, loc) => {
    acc[loc.id] = loc.nome_local;
    return acc;
  }, {} as { [key: string]: string });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Demo: Analytics e Feedback de Locais
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Esta demonstração mostra como o sistema de analytics e feedback funciona para 
          rastrear interações dos usuários e coletar avaliações sobre os estabelecimentos de saúde.
        </p>
        
        {/* Demo Stats */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span>{demoStats.views} visualizações</span>
          </div>
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-green-500" />
            <span>{demoStats.selections} seleções</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>{demoStats.interactions} interações</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="individual">Análise Individual</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        {/* Individual Location Analysis */}
        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Location Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Local</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockLocations.map(location => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationSelect(location.id)}
                    onMouseEnter={() => handleLocationView(location.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedLocation === location.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{location.nome_local}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {location.endereco_completo}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Popularity Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicador de Popularidade</CardTitle>
              </CardHeader>
              <CardContent>
                {mockPopularityData[selectedLocation] && (
                  <LocationPopularityIndicator
                    popularity={mockPopularityData[selectedLocation]}
                    showDetails
                  />
                )}
              </CardContent>
            </Card>

            {/* Rating Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avaliações</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationRatingDisplay
                  locationId={selectedLocation}
                  showReviews
                  maxReviews={2}
                />
              </CardContent>
            </Card>
          </div>

          {/* Interaction Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Testar Interações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleInteraction('call')}
                  className="flex items-center gap-2"
                >
                  📞 Ligar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleInteraction('map')}
                  className="flex items-center gap-2"
                >
                  🗺️ Ver no Mapa
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleInteraction('share')}
                  className="flex items-center gap-2"
                >
                  📤 Compartilhar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleInteraction('compare')}
                  className="flex items-center gap-2"
                >
                  📊 Comparar
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Clique nos botões acima para simular interações e ver como elas são rastreadas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockLocations.map(location => (
              <Card key={location.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{location.nome_local}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LocationPopularityIndicator
                    popularity={mockPopularityData[location.id]}
                    compact
                  />
                  <LocationRatingDisplay
                    locationId={location.id}
                    compact
                  />
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      {location.facilidades.length} facilidades disponíveis
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feedback Form */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipo de Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={feedbackType === 'rating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('rating')}
                    className="flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Avaliar
                  </Button>
                  <Button
                    variant={feedbackType === 'correction' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('correction')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Corrigir
                  </Button>
                  <Button
                    variant={feedbackType === 'suggestion' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFeedbackType('suggestion')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Sugerir
                  </Button>
                </div>

                <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      Abrir Formulário de Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Feedback do Local</DialogTitle>
                    </DialogHeader>
                    <LocationFeedbackForm
                      locationId={selectedLocation}
                      locationName={mockLocations.find(l => l.id === selectedLocation)?.nome_local || ''}
                      initialType={feedbackType}
                      onSubmitSuccess={handleFeedbackSubmit}
                      onCancel={() => setShowFeedbackForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avaliações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationRatingDisplay
                  locationId={selectedLocation}
                  showReviews
                  maxReviews={3}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <LocationAnalyticsDashboard
            locationIds={mockLocations.map(l => l.id)}
            locationNames={locationNames}
            showComparison
          />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium text-blue-900">
              🎯 Funcionalidades Implementadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-800">
              <div>✅ Rastreamento de visualizações</div>
              <div>✅ Rastreamento de seleções</div>
              <div>✅ Indicadores de popularidade</div>
              <div>✅ Sistema de avaliações</div>
              <div>✅ Formulário de feedback</div>
              <div>✅ Correção de informações</div>
              <div>✅ Dashboard de analytics</div>
              <div>✅ Comparação de locais</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalyticsDemo;