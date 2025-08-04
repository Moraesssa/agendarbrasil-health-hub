/**
 * AdvancedLocationSearch Component
 * Funcionalidade avançada de busca e filtragem de estabelecimentos
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
  Target
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
import { toast } from '@/components/ui/use-toast';

interface AdvancedLocationSearchProps {
  locations: LocationWithTimeSlots[];
  onFilteredLocationsChange: (filteredLocations: LocationWithTimeSlots[]) => void;
  onFiltersChange?: (filters: LocationFilters) => void;
  className?: string;
}

type SortOption = 'name' | 'distance' | 'availability' | 'status' | 'facilities';
type SortOrder = 'asc' | 'desc';

interface FacilityOption {
  id: FacilityType;
  label: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  description: string;
}

const FACILITY_OPTIONS: FacilityOption[] = [
  { id: 'estacionamento', label: 'Estacionamento', icon: Car, description: 'Vagas para veículos' },
  { id: 'acessibilidade', label: 'Acessibilidade', icon: Accessibility, description: 'Recursos para PcD' },
  { id: 'farmacia', label: 'Farmácia', icon: Pill, description: 'Medicamentos no local' },
  { id: 'laboratorio', label: 'Laboratório', icon: TestTube, description: 'Exames laboratoriais' },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi, description: 'Internet gratuita' },
  { id: 'ar_condicionado', label: 'Ar Condicionado', icon: Wind, description: 'Ambiente climatizado' }
];

const SEARCH_PRESETS = [
  {
    id: 'nearby',
    name: 'Próximos',
    description: 'Estabelecimentos mais próximos',
    filters: { max_distance_km: 5, open_now: true },
    sortBy: 'distance' as SortOption,
    sortOrder: 'asc' as SortOrder
  },
  {
    id: 'available',
    name: 'Disponíveis',
    description: 'Com mais horários livres',
    filters: { open_now: true },
    sortBy: 'availability' as SortOption,
    sortOrder: 'desc' as SortOrder
  },
  {
    id: 'accessible',
    name: 'Acessíveis',
    description: 'Com recursos de acessibilidade',
    filters: { facilidades: ['acessibilidade'], is_accessible: true },
    sortBy: 'facilities' as SortOption,
    sortOrder: 'desc' as SortOrder
  }
];

export const AdvancedLocationSearch: React.FC<AdvancedLocationSearchProps> = ({
  locations,
  onFilteredLocationsChange,
  onFiltersChange,
  className
}) => {
  // Estado da busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LocationFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('availability');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Estado da interface
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('');

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
        location.estado.toLowerCase().includes(query)
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
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [locations, searchQuery, filters, sortBy, sortOrder]);

  // Atualizar localizações filtradas quando mudarem
  useEffect(() => {
    onFilteredLocationsChange(filteredAndSortedLocations);
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filteredAndSortedLocations, filters, onFilteredLocationsChange, onFiltersChange]);

  // Aplicar preset de busca
  const applyPreset = useCallback((presetId: string) => {
    const preset = SEARCH_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setSortBy(preset.sortBy);
      setSortOrder(preset.sortOrder);
      setActivePreset(presetId);
      
      toast({
        title: "Preset aplicado!",
        description: `Filtros "${preset.name}" foram aplicados.`,
      });
    }
  }, []);

  // Limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    setSortBy('availability');
    setSortOrder('desc');
    setActivePreset('');
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
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
           });
  }, [searchQuery, filters]);

  // Contar resultados
  const resultsCount = filteredAndSortedLocations.length;
  const totalCount = locations.length;

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Search className="h-5 w-5 text-orange-600" />
              Busca Avançada
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Contador de Resultados */}
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {resultsCount} de {totalCount}
              </Badge>
              
              {/* Toggle Expandir */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Busca Principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, endereço, cidade ou bairro..."
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

          {/* Presets Rápidos */}
          <div className="flex flex-wrap gap-2">
            {SEARCH_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant={activePreset === preset.id ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(preset.id)}
                className="flex items-center gap-2"
              >
                <Target className="h-3 w-3" />
                {preset.name}
              </Button>
            ))}
          </div>

          {/* Filtros Avançados */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="space-y-6">
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default AdvancedLocationSearch;