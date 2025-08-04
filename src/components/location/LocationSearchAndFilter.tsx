/**
 * LocationSearchAndFilter Component
 * Componente unificado para busca e filtragem avançada de estabelecimentos
 * Integra todas as funcionalidades de busca, filtros, ordenação e preferências salvas
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Building, 
  Navigation,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Calendar,
  Phone,
  Wifi,
  Car,
  Accessibility,
  TestTube,
  Pill,
  Wind,
  Coffee,
  Users,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  SlidersHorizontal,
  Target,
  Save,
  Settings,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationWithTimeSlots, LocationFilters, FacilityType } from '@/types/location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { AdvancedLocationSearch } from './AdvancedLocationSearch';
import { SavedLocationPreferences } from './SavedLocationPreferences';

interface LocationSearchAndFilterProps {
  locations: LocationWithTimeSlots[];
  onFilteredLocationsChange: (filteredLocations: LocationWithTimeSlots[]) => void;
  onFiltersChange?: (filters: LocationFilters) => void;
  onSavePreferences?: (preferences: LocationSearchPreferences) => void;
  savedPreferences?: LocationSearchPreferences[];
  className?: string;
  showAdvancedSearch?: boolean;
  showSavedPreferences?: boolean;
  compactMode?: boolean;
}

interface LocationSearchPreferences {
  id: string;
  name: string;
  searchQuery: string;
  filters: LocationFilters;
  sortBy: string;
  sortOrder: string;
  createdAt: string;
  lastUsed?: string;
  useCount?: number;
}

type SortOption = 'name' | 'distance' | 'availability' | 'status' | 'facilities' | 'rating';
type SortOrder = 'asc' | 'desc';

interface OperatingHoursFilter {
  day: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo' | 'any';
  startTime: string;
  endTime: string;
  includeClosedDays: boolean;
}

interface QuickFilter {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  filters: LocationFilters;
  sortBy: SortOption;
  sortOrder: SortOrder;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'nearby',
    name: 'Próximos',
    description: 'Estabelecimentos mais próximos',
    icon: Navigation,
    filters: { max_distance_km: 5, open_now: true },
    sortBy: 'distance',
    sortOrder: 'asc'
  },
  {
    id: 'available',
    name: 'Disponíveis',
    description: 'Com mais horários livres',
    icon: Calendar,
    filters: { open_now: true },
    sortBy: 'availability',
    sortOrder: 'desc'
  },
  {
    id: 'accessible',
    name: 'Acessíveis',
    description: 'Com recursos de acessibilidade',
    icon: Accessibility,
    filters: { facilidades: ['acessibilidade'], is_accessible: true },
    sortBy: 'facilities',
    sortOrder: 'desc'
  },
  {
    id: 'parking',
    name: 'Com Estacionamento',
    description: 'Estabelecimentos com estacionamento',
    icon: Car,
    filters: { has_parking: true },
    sortBy: 'facilities',
    sortOrder: 'desc'
  },
  {
    id: 'complete',
    name: 'Completos',
    description: 'Com farmácia e laboratório',
    icon: Building,
    filters: { facilidades: ['farmacia', 'laboratorio'] },
    sortBy: 'facilities',
    sortOrder: 'desc'
  }
];

const FACILITY_OPTIONS = [
  { id: 'estacionamento' as FacilityType, label: 'Estacionamento', icon: Car, description: 'Vagas para veículos' },
  { id: 'acessibilidade' as FacilityType, label: 'Acessibilidade', icon: Accessibility, description: 'Recursos para PcD' },
  { id: 'farmacia' as FacilityType, label: 'Farmácia', icon: Pill, description: 'Medicamentos no local' },
  { id: 'laboratorio' as FacilityType, label: 'Laboratório', icon: TestTube, description: 'Exames laboratoriais' },
  { id: 'wifi' as FacilityType, label: 'Wi-Fi', icon: Wifi, description: 'Internet gratuita' },
  { id: 'ar_condicionado' as FacilityType, label: 'Ar Condicionado', icon: Wind, description: 'Ambiente climatizado' }
];

const OPERATING_HOURS_PRESETS = [
  { id: 'morning', name: 'Manhã', startTime: '06:00', endTime: '12:00' },
  { id: 'afternoon', name: 'Tarde', startTime: '12:00', endTime: '18:00' },
  { id: 'evening', name: 'Noite', startTime: '18:00', endTime: '22:00' },
  { id: 'business', name: 'Comercial', startTime: '08:00', endTime: '18:00' },
  { id: 'extended', name: 'Estendido', startTime: '07:00', endTime: '21:00' }
];

export const LocationSearchAndFilter: React.FC<LocationSearchAndFilterProps> = ({
  locations,
  onFilteredLocationsChange,
  onFiltersChange,
  onSavePreferences,
  savedPreferences = [],
  className,
  showAdvancedSearch = true,
  showSavedPreferences = true,
  compactMode = false
}) => {
  // Estado principal
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LocationFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('availability');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Estado da interface
  const [isExpanded, setIsExpanded] = useState(!compactMode);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savePreferenceName, setSavePreferenceName] = useState('');
  const [operatingHoursFilter, setOperatingHoursFilter] = useState<OperatingHoursFilter>({
    day: 'any',
    startTime: '08:00',
    endTime: '18:00',
    includeClosedDays: false
  });
  
  // Estado de carregamento e estatísticas
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    popularFilters: [] as string[],
    averageResults: 0
  });

  // Aplicar filtros e ordenação
  const filteredAndSortedLocations = useMemo(() => {
    let filtered = [...locations];

    // Busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(location => 
        location.nome_local.toLowerCase().includes(query) ||
        location.endereco_completo.toLowerCase().includes(query) ||
        location.bairro.toLowerCase().includes(query) ||
        location.cidade.toLowerCase().includes(query) ||
        location.estado.toLowerCase().includes(query) ||
        location.cep.includes(query.replace(/\D/g, ''))
      );
    }

    // Filtro por status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(location => 
        filters.status!.includes(location.status)
      );
    }

    // Filtro por estabelecimento aberto
    if (filters.open_now) {
      filtered = filtered.filter(location => 
        location.status === 'ativo' && location.is_open_now
      );
    }

    // Filtro por cidade
    if (filters.cidade) {
      filtered = filtered.filter(location => 
        location.cidade.toLowerCase().includes(filters.cidade!.toLowerCase())
      );
    }

    // Filtro por bairro
    if (filters.bairro) {
      filtered = filtered.filter(location => 
        location.bairro.toLowerCase().includes(filters.bairro!.toLowerCase())
      );
    }

    // Filtro por distância máxima
    if (filters.max_distance_km && filters.max_distance_km > 0) {
      filtered = filtered.filter(location => 
        location.distance_km !== undefined && 
        location.distance_km <= filters.max_distance_km!
      );
    }

    // Filtro por facilidades
    if (filters.facilidades && filters.facilidades.length > 0) {
      filtered = filtered.filter(location => {
        const locationFacilities = location.facilidades
          .filter(f => f.available)
          .map(f => f.type);
        return filters.facilidades!.some(facility => 
          locationFacilities.includes(facility)
        );
      });
    }

    // Filtro por estacionamento
    if (filters.has_parking) {
      filtered = filtered.filter(location => 
        location.facilidades.some(f => 
          f.type === 'estacionamento' && f.available
        )
      );
    }

    // Filtro por acessibilidade
    if (filters.is_accessible) {
      filtered = filtered.filter(location => 
        location.facilidades.some(f => 
          f.type === 'acessibilidade' && f.available
        )
      );
    }

    // Filtro por horário de funcionamento
    if (operatingHoursFilter.day !== 'any' || operatingHoursFilter.startTime !== '08:00' || operatingHoursFilter.endTime !== '18:00') {
      filtered = filtered.filter(location => {
        if (operatingHoursFilter.day === 'any') {
          // Verificar se está aberto em qualquer dia no horário especificado
          return Object.values(location.horario_funcionamento).some(schedule => {
            if (schedule.fechado && !operatingHoursFilter.includeClosedDays) return false;
            if (schedule.fechado) return true;
            
            const openTime = schedule.abertura;
            const closeTime = schedule.fechamento;
            const filterStart = operatingHoursFilter.startTime;
            const filterEnd = operatingHoursFilter.endTime;
            
            return openTime <= filterStart && closeTime >= filterEnd;
          });
        } else {
          // Verificar dia específico
          const daySchedule = location.horario_funcionamento[operatingHoursFilter.day];
          if (daySchedule.fechado && !operatingHoursFilter.includeClosedDays) return false;
          if (daySchedule.fechado) return true;
          
          const openTime = daySchedule.abertura;
          const closeTime = daySchedule.fechamento;
          const filterStart = operatingHoursFilter.startTime;
          const filterEnd = operatingHoursFilter.endTime;
          
          return openTime <= filterStart && closeTime >= filterEnd;
        }
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.nome_local.localeCompare(b.nome_local, 'pt-BR');
          break;
        case 'distance':
          comparison = (a.distance_km || Infinity) - (b.distance_km || Infinity);
          break;
        case 'availability':
          comparison = a.available_slots_count - b.available_slots_count;
          break;
        case 'status': {
          const statusOrder = { 'ativo': 0, 'temporariamente_fechado': 1, 'manutencao': 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
        case 'facilities': {
          const aFacilities = a.facilidades.filter(f => f.available).length;
          const bFacilities = b.facilidades.filter(f => f.available).length;
          comparison = aFacilities - bFacilities;
          break;
        }
        case 'rating': {
          // Implementar quando houver sistema de avaliação
          comparison = 0;
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [locations, searchQuery, filters, sortBy, sortOrder, operatingHoursFilter]);

  // Atualizar localizações filtradas quando mudarem
  useEffect(() => {
    setIsLoading(true);
    
    // Simular delay de busca para melhor UX
    const timer = setTimeout(() => {
      onFilteredLocationsChange(filteredAndSortedLocations);
      if (onFiltersChange) {
        onFiltersChange(filters);
      }
      setIsLoading(false);
      
      // Atualizar estatísticas
      setSearchStats(prev => ({
        ...prev,
        totalSearches: prev.totalSearches + 1,
        averageResults: Math.round((prev.averageResults + filteredAndSortedLocations.length) / 2)
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [filteredAndSortedLocations, filters, onFilteredLocationsChange, onFiltersChange]);

  // Aplicar filtro rápido
  const applyQuickFilter = useCallback((filterId: string) => {
    const quickFilter = QUICK_FILTERS.find(f => f.id === filterId);
    if (quickFilter) {
      setFilters(quickFilter.filters);
      setSortBy(quickFilter.sortBy);
      setSortOrder(quickFilter.sortOrder);
      setActiveQuickFilter(filterId);
      
      toast({
        title: "Filtro aplicado!",
        description: `Filtro "${quickFilter.name}" foi aplicado.`,
      });
    }
  }, []);

  // Limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    setSortBy('availability');
    setSortOrder('desc');
    setActiveQuickFilter('');
    setOperatingHoursFilter({
      day: 'any',
      startTime: '08:00',
      endTime: '18:00',
      includeClosedDays: false
    });
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
    });
  }, []);

  // Salvar preferências
  const handleSavePreferences = useCallback(() => {
    if (!savePreferenceName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para salvar suas preferências.",
        variant: "destructive"
      });
      return;
    }

    const preferences: LocationSearchPreferences = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: savePreferenceName.trim(),
      searchQuery,
      filters,
      sortBy,
      sortOrder,
      createdAt: new Date().toISOString()
    };

    if (onSavePreferences) {
      onSavePreferences(preferences);
    }

    setSavePreferenceName('');
    setShowSaveDialog(false);
    
    toast({
      title: "Preferências salvas!",
      description: `Suas preferências foram salvas como "${preferences.name}".`,
    });
  }, [savePreferenceName, searchQuery, filters, sortBy, sortOrder, onSavePreferences]);

  // Carregar preferências salvas
  const handleLoadPreferences = useCallback((preferences: LocationSearchPreferences) => {
    setSearchQuery(preferences.searchQuery);
    setFilters(preferences.filters);
    setSortBy(preferences.sortBy as SortOption);
    setSortOrder(preferences.sortOrder as SortOrder);
    setActiveQuickFilter('');
    
    toast({
      title: "Preferências carregadas",
      description: `Filtros "${preferences.name}" foram aplicados.`,
    });
  }, []);

  // Toggle facilidade no filtro
  const toggleFacilityFilter = useCallback((facilityId: FacilityType) => {
    setFilters(prev => {
      const currentFacilities = prev.facilidades || [];
      const newFacilities = currentFacilities.includes(facilityId)
        ? currentFacilities.filter(id => id !== facilityId)
        : [...currentFacilities, facilityId];
      
      return {
        ...prev,
        facilidades: newFacilities.length > 0 ? newFacilities : undefined
      };
    });
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || 
           Object.keys(filters).some(key => {
             const value = filters[key as keyof LocationFilters];
             return value !== undefined && value !== null && 
                    (Array.isArray(value) ? value.length > 0 : true);
           }) ||
           operatingHoursFilter.day !== 'any' ||
           operatingHoursFilter.startTime !== '08:00' ||
           operatingHoursFilter.endTime !== '18:00';
  }, [searchQuery, filters, operatingHoursFilter]);

  // Contar resultados
  const resultsCount = filteredAndSortedLocations.length;
  const totalCount = locations.length;

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <CardHeader className={cn("pb-4", compactMode && "pb-2")}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Search className="h-5 w-5 text-orange-600" />
              {compactMode ? "Busca" : "Busca e Filtros"}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Contador de Resultados */}
              <Badge 
                variant="outline" 
                className={cn(
                  "bg-orange-50 text-orange-700 border-orange-200",
                  isLoading && "animate-pulse"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                {resultsCount} de {totalCount}
              </Badge>
              
              {/* Salvar Preferências */}
              {hasActiveFilters && (
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar Preferências de Busca</DialogTitle>
                      <DialogDescription>
                        Salve seus filtros atuais para uso futuro.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="preference-name">Nome da Preferência</Label>
                        <Input
                          id="preference-name"
                          value={savePreferenceName}
                          onChange={(e) => setSavePreferenceName(e.target.value)}
                          placeholder="Ex: Próximos com estacionamento"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePreferences}>
                        Salvar Preferências
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Toggle Expandir */}
              {!compactMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Busca Principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, endereço, cidade, bairro ou CEP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((quickFilter) => (
              <Tooltip key={quickFilter.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeQuickFilter === quickFilter.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyQuickFilter(quickFilter.id)}
                    className="flex items-center gap-2"
                  >
                    <quickFilter.icon className="h-3 w-3" />
                    {quickFilter.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{quickFilter.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Abas de Funcionalidades */}
          {!compactMode && (
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="filters" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </TabsTrigger>
                {showAdvancedSearch && (
                  <TabsTrigger value="advanced" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Avançado
                  </TabsTrigger>
                )}
                {showSavedPreferences && (
                  <TabsTrigger value="saved" className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Salvos
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="filters" className="space-y-4">
                {/* Filtros Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Filtro por Cidade */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cidade</Label>
                    <Input
                      placeholder="Ex: São Paulo"
                      value={filters.cidade || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        cidade: e.target.value || undefined 
                      }))}
                    />
                  </div>

                  {/* Filtro por Bairro */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bairro</Label>
                    <Input
                      placeholder="Ex: Centro"
                      value={filters.bairro || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        bairro: e.target.value || undefined 
                      }))}
                    />
                  </div>

                  {/* Ordenação */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ordenar por</Label>
                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [newSortBy, newSortOrder] = value.split('-') as [SortOption, SortOrder];
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                        <SelectItem value="availability-desc">Mais horários</SelectItem>
                        <SelectItem value="availability-asc">Menos horários</SelectItem>
                        <SelectItem value="distance-asc">Mais próximo</SelectItem>
                        <SelectItem value="distance-desc">Mais distante</SelectItem>
                        <SelectItem value="facilities-desc">Mais facilidades</SelectItem>
                        <SelectItem value="status-asc">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filtros de Distância */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Distância Máxima</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[filters.max_distance_km || 50]}
                      onValueChange={([value]) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          max_distance_km: value === 50 ? undefined : value 
                        }))
                      }
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1km</span>
                      <span className="font-medium">
                        {filters.max_distance_km ? `${filters.max_distance_km}km` : 'Sem limite'}
                      </span>
                      <span>50km</span>
                    </div>
                  </div>
                </div>

                {/* Switches de Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="open-now"
                      checked={filters.open_now || false}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, open_now: checked || undefined }))
                      }
                    />
                    <Label htmlFor="open-now" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Aberto agora
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-parking"
                      checked={filters.has_parking || false}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, has_parking: checked || undefined }))
                      }
                    />
                    <Label htmlFor="has-parking" className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Com estacionamento
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-accessible"
                      checked={filters.is_accessible || false}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, is_accessible: checked || undefined }))
                      }
                    />
                    <Label htmlFor="is-accessible" className="flex items-center gap-2">
                      <Accessibility className="h-4 w-4" />
                      Acessível
                    </Label>
                  </div>
                </div>

                {/* Filtros de Facilidades */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Facilidades Desejadas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {FACILITY_OPTIONS.map((facility) => (
                      <Tooltip key={facility.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={
                              filters.facilidades?.includes(facility.id) 
                                ? "default" 
                                : "outline"
                            }
                            size="sm"
                            onClick={() => toggleFacilityFilter(facility.id)}
                            className="justify-start h-auto p-3"
                          >
                            <facility.icon className="h-4 w-4 mr-2" />
                            <span className="text-xs">{facility.label}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{facility.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Filtros de Horário de Funcionamento */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Horário de Funcionamento</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Dia da Semana</Label>
                      <Select
                        value={operatingHoursFilter.day}
                        onValueChange={(value) => 
                          setOperatingHoursFilter(prev => ({ 
                            ...prev, 
                            day: value as typeof prev.day 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Qualquer dia</SelectItem>
                          <SelectItem value="segunda">Segunda-feira</SelectItem>
                          <SelectItem value="terca">Terça-feira</SelectItem>
                          <SelectItem value="quarta">Quarta-feira</SelectItem>
                          <SelectItem value="quinta">Quinta-feira</SelectItem>
                          <SelectItem value="sexta">Sexta-feira</SelectItem>
                          <SelectItem value="sabado">Sábado</SelectItem>
                          <SelectItem value="domingo">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Horário Inicial</Label>
                      <Input
                        type="time"
                        value={operatingHoursFilter.startTime}
                        onChange={(e) => 
                          setOperatingHoursFilter(prev => ({ 
                            ...prev, 
                            startTime: e.target.value 
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Horário Final</Label>
                      <Input
                        type="time"
                        value={operatingHoursFilter.endTime}
                        onChange={(e) => 
                          setOperatingHoursFilter(prev => ({ 
                            ...prev, 
                            endTime: e.target.value 
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-closed"
                          checked={operatingHoursFilter.includeClosedDays}
                          onCheckedChange={(checked) => 
                            setOperatingHoursFilter(prev => ({ 
                              ...prev, 
                              includeClosedDays: checked 
                            }))
                          }
                        />
                        <Label htmlFor="include-closed" className="text-xs">
                          Incluir fechados
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Presets de Horário */}
                  <div className="flex flex-wrap gap-2">
                    {OPERATING_HOURS_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => 
                          setOperatingHoursFilter(prev => ({
                            ...prev,
                            startTime: preset.startTime,
                            endTime: preset.endTime
                          }))
                        }
                        className="text-xs"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      disabled={!hasActiveFilters}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                    
                    {hasActiveFilters && (
                      <Badge variant="secondary">
                        {Object.keys(filters).filter(key => {
                          const value = filters[key as keyof LocationFilters];
                          return value !== undefined && value !== null && 
                                 (Array.isArray(value) ? value.length > 0 : true);
                        }).length} filtro{Object.keys(filters).length !== 1 ? 's' : ''} ativo{Object.keys(filters).length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Estatísticas de Busca */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>{searchStats.totalSearches} buscas</span>
                  </div>
                </div>
              </TabsContent>

              {showAdvancedSearch && (
                <TabsContent value="advanced">
                  <AdvancedLocationSearch
                    locations={locations}
                    onFilteredLocationsChange={onFilteredLocationsChange}
                    onFiltersChange={onFiltersChange}
                  />
                </TabsContent>
              )}

              {showSavedPreferences && (
                <TabsContent value="saved">
                  <SavedLocationPreferences
                    preferences={savedPreferences}
                    onLoadPreferences={handleLoadPreferences}
                    onSavePreferences={onSavePreferences}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default LocationSearchAndFilter;