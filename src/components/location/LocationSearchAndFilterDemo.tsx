/**
 * LocationSearchAndFilterDemo Component
 * Demonstração completa do sistema unificado de busca e filtragem de estabelecimentos
 */

import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Building, 
  CheckCircle2,
  Clock,
  Star,
  Info,
  Eye,
  EyeOff,
  Filter,
  Target,
  Bookmark,
  ArrowUpDown
} from 'lucide-react';
import { LocationSearchAndFilter } from './LocationSearchAndFilter';
import { LocationDetailsPanel } from './LocationDetailsPanel';
import { LocationWithTimeSlots, LocationFilters, FacilityType } from '@/types/location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';

// Mock data para demonstração
const MOCK_LOCATIONS: LocationWithTimeSlots[] = [
  {
    id: 'loc_001',
    nome_local: 'Clínica São Paulo Centro',
    endereco_completo: 'Rua Augusta, 1234 - Centro, São Paulo - SP, 01305-100',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01305-100',
    telefone: '(11) 3456-7890',
    whatsapp: '(11) 99876-5432',
    email: 'contato@clinicasp.com.br',
    website: 'https://clinicasp.com.br',
    coordenadas: {
      lat: -23.5505,
      lng: -46.6333,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '07:00', fechamento: '19:00', fechado: false },
      terca: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quarta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      quinta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sexta: { abertura: '07:00', fechamento: '19:00', fechado: false },
      sabado: { abertura: '08:00', fechamento: '14:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '12:00', fechado: false }
    },
    facilidades: [
      { type: 'estacionamento' as FacilityType, available: true, cost: 'pago', details: '50 vagas' },
      { type: 'acessibilidade' as FacilityType, available: true, details: 'Rampa e elevador' },
      { type: 'farmacia' as FacilityType, available: true, details: 'Farmácia 24h' },
      { type: 'wifi' as FacilityType, available: true, cost: 'gratuito' },
      { type: 'ar_condicionado' as FacilityType, available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '08:00', available: true, location_id: 'loc_001', location_name: 'Clínica São Paulo Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med_001' },
      { time: '08:30', available: true, location_id: 'loc_001', location_name: 'Clínica São Paulo Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med_001' },
      { time: '09:00', available: true, location_id: 'loc_001', location_name: 'Clínica São Paulo Centro', duration_minutes: 30, tipo_consulta: 'presencial', medico_id: 'med_001' }
    ],
    ultima_atualizacao: '2025-01-31T10:00:00Z',
    verificado_em: '2025-01-31T10:00:00Z',
    fonte_dados: 'manual',
    available_slots_count: 3,
    is_open_now: true,
    distance_km: 2.5
  },
  {
    id: 'loc_002',
    nome_local: 'Hospital Vila Madalena',
    endereco_completo: 'Rua Harmonia, 567 - Vila Madalena, São Paulo - SP, 05435-000',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05435-000',
    telefone: '(11) 2345-6789',
    email: 'atendimento@hospitalvm.com.br',
    coordenadas: {
      lat: -23.5489,
      lng: -46.6888,
      precisao: 'exata'
    },
    horario_funcionamento: {
      segunda: { abertura: '06:00', fechamento: '22:00', fechado: false },
      terca: { abertura: '06:00', fechamento: '22:00', fechado: false },
      quarta: { abertura: '06:00', fechamento: '22:00', fechado: false },
      quinta: { abertura: '06:00', fechamento: '22:00', fechado: false },
      sexta: { abertura: '06:00', fechamento: '22:00', fechado: false },
      sabado: { abertura: '07:00', fechamento: '18:00', fechado: false },
      domingo: { abertura: '08:00', fechamento: '16:00', fechado: false }
    },
    facilidades: [
      { type: 'estacionamento' as FacilityType, available: true, cost: 'gratuito', details: '200 vagas' },
      { type: 'acessibilidade' as FacilityType, available: true, details: 'Totalmente acessível' },
      { type: 'farmacia' as FacilityType, available: true, details: 'Farmácia hospitalar' },
      { type: 'laboratorio' as FacilityType, available: true, details: 'Laboratório completo' },
      { type: 'wifi' as FacilityType, available: true, cost: 'gratuito' },
      { type: 'ar_condicionado' as FacilityType, available: true }
    ],
    status: 'ativo',
    horarios_disponiveis: [
      { time: '07:00', available: true, location_id: 'loc_002', location_name: 'Hospital Vila Madalena', duration_minutes: 45, tipo_consulta: 'presencial', medico_id: 'med_002' },
      { time: '08:00', available: true, location_id: 'loc_002', location_name: 'Hospital Vila Madalena', duration_minutes: 45, tipo_consulta: 'presencial', medico_id: 'med_002' }
    ],
    ultima_atualizacao: '2025-01-31T09:30:00Z',
    verificado_em: '2025-01-31T09:30:00Z',
    fonte_dados: 'api',
    available_slots_count: 2,
    is_open_now: true,
    distance_km: 5.2
  }
];

const MOCK_SAVED_PREFERENCES = [
  {
    id: 'pref_001',
    name: 'Próximos com Estacionamento',
    searchQuery: '',
    filters: { max_distance_km: 5, has_parking: true, open_now: true },
    sortBy: 'distance',
    sortOrder: 'asc',
    createdAt: '2025-01-25T10:00:00Z',
    lastUsed: '2025-01-30T14:30:00Z',
    useCount: 5
  }
];

interface LocationSearchAndFilterDemoProps {
  className?: string;
}

export const LocationSearchAndFilterDemo: React.FC<LocationSearchAndFilterDemoProps> = ({
  className
}) => {
  const [filteredLocations, setFilteredLocations] = useState<LocationWithTimeSlots[]>(MOCK_LOCATIONS);
  const [currentFilters, setCurrentFilters] = useState<LocationFilters>({});
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [savedPreferences, setSavedPreferences] = useState(MOCK_SAVED_PREFERENCES);
  const [showResults, setShowResults] = useState(true);

  // Handle filtered locations change
  const handleFilteredLocationsChange = useCallback((locations: LocationWithTimeSlots[]) => {
    setFilteredLocations(locations);
    setShowResults(true);
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((filters: LocationFilters) => {
    setCurrentFilters(filters);
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((locationId: string) => {
    setSelectedLocation(locationId);
    const location = MOCK_LOCATIONS.find(loc => loc.id === locationId);
    if (location) {
      toast({
        title: "Estabelecimento selecionado",
        description: `${location.nome_local} foi selecionado para filtragem de horários.`,
      });
    }
  }, []);

  // Handle location filter
  const handleLocationFilter = useCallback((locationId: string | null) => {
    console.log('Filtering by location:', locationId);
  }, []);

  // Handle save preferences
  const handleSavePreferences = useCallback((preferences: any) => {
    setSavedPreferences(prev => [...prev, preferences]);
    toast({
      title: "Preferências salvas!",
      description: `Suas preferências foram salvas como "${preferences.name}".`,
    });
  }, []);

  // Get filter summary
  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (currentFilters.cidade) activeFilters.push(`Cidade: ${currentFilters.cidade}`);
    if (currentFilters.bairro) activeFilters.push(`Bairro: ${currentFilters.bairro}`);
    if (currentFilters.max_distance_km) activeFilters.push(`Até ${currentFilters.max_distance_km}km`);
    if (currentFilters.open_now) activeFilters.push('Apenas abertos');
    if (currentFilters.has_parking) activeFilters.push('Com estacionamento');
    if (currentFilters.is_accessible) activeFilters.push('Acessível');
    if (currentFilters.facilidades && currentFilters.facilidades.length > 0) {
      activeFilters.push(`${currentFilters.facilidades.length} facilidade${currentFilters.facilidades.length !== 1 ? 's' : ''}`);
    }
    
    return activeFilters;
  };

  const filterSummary = getFilterSummary();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Search className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Busca e Filtros de Estabelecimentos
              </h1>
              <p className="text-gray-600 mt-1">
                Demonstração completa das funcionalidades de busca, filtros avançados e preferências salvas
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total</p>
                <p className="text-lg font-bold text-blue-700">{MOCK_LOCATIONS.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Filtrados</p>
                <p className="text-lg font-bold text-green-700">{filteredLocations.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Abertos</p>
                <p className="text-lg font-bold text-orange-700">
                  {filteredLocations.filter(loc => loc.is_open_now).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">Horários</p>
                <p className="text-lg font-bold text-purple-700">
                  {filteredLocations.reduce((sum, loc) => sum + loc.available_slots_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Component */}
      <LocationSearchAndFilter
        locations={MOCK_LOCATIONS}
        onFilteredLocationsChange={handleFilteredLocationsChange}
        onFiltersChange={handleFiltersChange}
        onSavePreferences={handleSavePreferences}
        savedPreferences={savedPreferences}
        showAdvancedSearch={true}
        showSavedPreferences={true}
      />

      {/* Active Filters Summary */}
      {filterSummary.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Filtros ativos:</span>
              {filterSummary.map((filter, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {filter}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Resultados da Busca
        </h2>
        <Button
          variant="outline"
          onClick={() => setShowResults(!showResults)}
          className="flex items-center gap-2"
        >
          {showResults ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showResults ? 'Ocultar' : 'Mostrar'} Resultados
        </Button>
      </div>

      {/* Results Panel */}
      {showResults && (
        <LocationDetailsPanel
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onLocationFilter={handleLocationFilter}
          showComparison={true}
          isLoading={false}
        />
      )}

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Funcionalidades Implementadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold">Busca Inteligente</h3>
              </div>
              <p className="text-sm text-gray-600">
                Busca por nome, endereço, cidade, bairro ou CEP com resultados em tempo real.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold">Filtros Avançados</h3>
              </div>
              <p className="text-sm text-gray-600">
                Filtros por distância, facilidades, horário de funcionamento e status.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold">Horário de Funcionamento</h3>
              </div>
              <p className="text-sm text-gray-600">
                Filtro por dias da semana e horários específicos de atendimento.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold">Filtros Rápidos</h3>
              </div>
              <p className="text-sm text-gray-600">
                Presets configurados para cenários comuns de busca.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold">Preferências Salvas</h3>
              </div>
              <p className="text-sm text-gray-600">
                Salve e reutilize suas configurações de busca favoritas.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpDown className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold">Ordenação Flexível</h3>
              </div>
              <p className="text-sm text-gray-600">
                Ordene por nome, distância, disponibilidade, facilidades ou status.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSearchAndFilterDemo;