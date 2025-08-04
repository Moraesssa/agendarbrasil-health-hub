import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useLocationAccessibility, useKeyboardNavigation, useLiveRegion } from '@/hooks/useAccessibility';
import { 
  announceLocationFilter,
  announceLoadingStart,
  announceLoadingComplete,
  KEYBOARD_KEYS
} from '@/utils/accessibilityUtils';
import { 
  Building, 
  Filter, 
  Search, 
  X, 
  ArrowUpDown,
  MapPin, // replaced by kiro @2025-01-31T15:30:00Z
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationWithTimeSlots, LocationFilters } from '@/types/location';
import { LocationCard } from './LocationCard';
import { LocationComparison } from './LocationComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface LocationDetailsPanelProps {
  locations: LocationWithTimeSlots[];
  selectedLocation?: string;
  onLocationSelect: (locationId: string) => void;
  onLocationFilter: (locationId: string | null) => void;
  showComparison?: boolean;
  isLoading?: boolean;
  className?: string;
}

type SortOption = 'name' | 'distance' | 'availability' | 'status';
type SortOrder = 'asc' | 'desc';

// Loading skeleton component
const LocationCardSkeleton: React.FC = () => (
  <Card className="w-full">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-12" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 mt-0.5" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyState: React.FC<{ 
  hasFilters: boolean; 
  onClearFilters: () => void;
}> = ({ hasFilters, onClearFilters }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="p-4 bg-gray-100 rounded-full mb-6">
      <Building className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {hasFilters ? 'Nenhum estabelecimento encontrado' : 'Nenhum estabelecimento disponível'}
    </h3>
    <p className="text-gray-600 mb-6 max-w-md">
      {hasFilters 
        ? 'Não encontramos estabelecimentos que atendam aos filtros selecionados. Tente ajustar os critérios de busca.'
        : 'Não há estabelecimentos disponíveis para esta data e especialidade. Tente selecionar outra data.'
      }
    </p>
    {hasFilters && (
      <Button variant="outline" onClick={onClearFilters}>
        <X className="h-4 w-4 mr-2" />
        Limpar Filtros
      </Button>
    )}
  </div>
);

// Filter controls component with mobile optimization
const FilterControls: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void;
  showOpenOnly: boolean;
  onShowOpenOnlyChange: (show: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isMobile?: boolean;
}> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  showOpenOnly,
  onShowOpenOnlyChange,
  onClearFilters,
  hasActiveFilters,
  isMobile = false
}) => (
  <div className="space-y-4">
    {/* Search and Sort Row - Mobile Optimized */}
    <div className={cn(
      "flex gap-3",
      // Stack on mobile, side-by-side on larger screens
      "flex-col sm:flex-row"
    )}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={isMobile ? "Buscar estabelecimento..." : "Buscar por nome ou endereço..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "pl-10",
            // Mobile-optimized input
            isMobile && "h-12 text-base"
          )}
        />
      </div>

      {/* Sort Controls - Mobile Responsive */}
      <div className="flex gap-2">
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('-') as [SortOption, SortOrder];
            onSortChange(newSortBy, newSortOrder);
          }}
        >
          <SelectTrigger className={cn(
            // Responsive width
            "w-full sm:w-48",
            // Mobile-optimized height
            isMobile && "h-12"
          )}>
            <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="availability-desc">Mais horários</SelectItem>
            <SelectItem value="availability-asc">Menos horários</SelectItem>
            <SelectItem value="distance-asc">Mais próximo</SelectItem>
            <SelectItem value="distance-desc">Mais distante</SelectItem>
            <SelectItem value="status-asc">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Filter Options Row - Mobile Optimized */}
    <div className={cn(
      "flex items-center gap-3",
      // Wrap on mobile for better touch targets
      "flex-wrap"
    )}>
      {/* Open Only Toggle */}
      <Button
        variant={showOpenOnly ? "default" : "outline"}
        size={isMobile ? "default" : "sm"}
        onClick={() => onShowOpenOnlyChange(!showOpenOnly)}
        className={cn(
          "flex items-center gap-2",
          // Mobile-optimized touch target
          isMobile && "min-h-[44px] px-4"
        )}
      >
        {showOpenOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        <span className={cn(isMobile && "text-sm")}>
          {isMobile ? "Abertos" : "Apenas Abertos"}
        </span>
      </Button>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={onClearFilters}
          className={cn(
            "text-gray-600 hover:text-gray-900",
            // Mobile-optimized touch target
            isMobile && "min-h-[44px] px-4"
          )}
        >
          <X className="h-4 w-4 mr-1" />
          <span className={cn(isMobile && "text-sm")}>
            Limpar Filtros
          </span>
        </Button>
      )}
    </div>
  </div>
);

// Results summary component
const ResultsSummary: React.FC<{
  totalCount: number;
  filteredCount: number;
  selectedLocation?: string;
}> = ({ totalCount, filteredCount, selectedLocation }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-200">
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Building className="h-5 w-5 text-orange-600" />
        Estabelecimentos Disponíveis
      </h3>
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        {filteredCount} de {totalCount}
      </Badge>
    </div>
    
    {selectedLocation && (
      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Selecionado
      </Badge>
    )}
  </div>
);

export const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  onLocationFilter,
  showComparison = false,
  isLoading = false,
  className
}) => {
  // Local state for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('availability');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [comparisonLocations, setComparisonLocations] = useState<string[]>([]);
  
  // Accessibility hooks
  const { 
    announce, 
    announceError, 
    announceLoading,
    isHighContrast,
    reducedMotion,
    isTouchDevice,
    getAccessibleStyles 
  } = useLocationAccessibility();
  
  const { announce: announceLive } = useLiveRegion('location-panel-announcements', 'polite');
  
  // Responsive layout hook
  const { 
    isMobile, 
    isTablet, 
    getGridColumns, 
    getCompactMode, 
    getTouchOptimized,
    responsiveClasses 
  } = useResponsiveLayout();
  
  // Mobile-specific state
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeCurrentX, setSwipeCurrentX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  // Filter and sort locations
  const filteredAndSortedLocations = useMemo(() => {
    let filtered = [...locations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(location => 
        location.nome_local.toLowerCase().includes(query) ||
        location.endereco_completo.toLowerCase().includes(query) ||
        location.bairro.toLowerCase().includes(query) ||
        location.cidade.toLowerCase().includes(query)
      );
    }

    // Apply open only filter
    if (showOpenOnly) {
      filtered = filtered.filter(location => 
        location.status === 'ativo' && location.is_open_now
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.nome_local.localeCompare(b.nome_local, 'pt-BR');
          break;
        case 'availability':
          comparison = a.available_slots_count - b.available_slots_count;
          break;
        case 'distance':
          comparison = (a.distance_km || 0) - (b.distance_km || 0);
          break;
        case 'status': {
          const statusOrder = { 'ativo': 0, 'temporariamente_fechado': 1, 'manutencao': 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [locations, searchQuery, sortBy, sortOrder, showOpenOnly]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || showOpenOnly;
  }, [searchQuery, showOpenOnly]);

  // Handle location selection with accessibility announcements
  const handleLocationSelect = useCallback((locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      onLocationSelect(locationId);
      onLocationFilter(locationId);
      
      // Announce filter change
      announceLocationFilter(location.nome_local);
      announceLive(`Estabelecimento ${location.nome_local} selecionado. Horários filtrados.`);
    }
  }, [onLocationSelect, onLocationFilter, locations, announceLive]);

  // Handle comparison toggle
  const handleComparisonToggle = useCallback((locationId: string) => {
    setComparisonLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else if (prev.length < 3) { // Limit to 3 locations for comparison
        return [...prev, locationId];
      }
      return prev;
    });
  }, []);

  // Clear all filters with accessibility announcements
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setShowOpenOnly(false);
    onLocationFilter(null);
    
    // Announce filter clearing
    announceLocationFilter(null);
    announceLive('Todos os filtros foram removidos. Mostrando todos os estabelecimentos.');
  }, [onLocationFilter, announceLive]);

  // Handle sort change with accessibility announcements
  const handleSortChange = useCallback((newSortBy: SortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    
    // Announce sort change
    const sortLabels = {
      name: 'nome',
      availability: 'disponibilidade',
      distance: 'distância',
      status: 'status'
    };
    const orderLabel = newSortOrder === 'asc' ? 'crescente' : 'decrescente';
    announceLive(`Estabelecimentos ordenados por ${sortLabels[newSortBy]} em ordem ${orderLabel}.`);
  }, [announceLive]);

  // Swipe gesture handlers for mobile comparison
  const handleTouchStart = useCallback((e: React.TouchEvent, locationId: string) => {
    if (!isMobile || !showComparison) return;
    
    setSwipeStartX(e.touches[0].clientX);
    setSwipeCurrentX(e.touches[0].clientX);
    setIsSwipeActive(true);
  }, [isMobile, showComparison]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwipeActive) return;
    
    setSwipeCurrentX(e.touches[0].clientX);
  }, [isSwipeActive]);

  const handleTouchEnd = useCallback((locationId: string) => {
    if (!isSwipeActive) return;
    
    const swipeDistance = swipeCurrentX - swipeStartX;
    const swipeThreshold = 100; // Minimum swipe distance
    
    // Right swipe - add to comparison
    if (swipeDistance > swipeThreshold && !comparisonLocations.includes(locationId)) {
      handleComparisonToggle(locationId);
    }
    // Left swipe - remove from comparison
    else if (swipeDistance < -swipeThreshold && comparisonLocations.includes(locationId)) {
      handleComparisonToggle(locationId);
    }
    
    setIsSwipeActive(false);
    setSwipeStartX(0);
    setSwipeCurrentX(0);
  }, [isSwipeActive, swipeCurrentX, swipeStartX, comparisonLocations, handleComparisonToggle]);

  // Keyboard navigation for location grid
  const { containerRef: gridContainerRef } = useKeyboardNavigation(
    (index: number) => {
      const location = filteredAndSortedLocations[index];
      if (location) {
        handleLocationSelect(location.id);
      }
    },
    {
      orientation: 'grid',
      wrap: true,
      homeEndKeys: true,
      typeahead: true
    }
  );

  // Announce loading state changes
  React.useEffect(() => {
    if (isLoading) {
      announceLoadingStart('estabelecimentos');
    } else if (locations.length > 0) {
      announceLoadingComplete('estabelecimentos', filteredAndSortedLocations.length);
    }
  }, [isLoading, locations.length, filteredAndSortedLocations.length]);

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "w-full",
          // Mobile-optimized card styling
          "border-0 sm:border shadow-none sm:shadow-lg",
          // Mobile-specific background
          "bg-transparent sm:bg-white",
          // High contrast support
          isHighContrast && "border-2 border-solid",
          className
        )}
        style={getAccessibleStyles}
        role="region"
        aria-label="Painel de estabelecimentos disponíveis"
        aria-busy={isLoading}
      >
        <CardHeader className={cn(
          // Mobile-optimized header padding
          "pb-3 px-4 pt-4 sm:pb-4 sm:px-6 sm:pt-6"
        )}>
          <CardTitle 
            className={cn(
              "flex items-center gap-3 font-semibold text-gray-800",
              // Responsive title sizing
              "text-lg sm:text-xl"
            )}
            id="location-panel-title"
          >
            <div className={cn(
              "p-2 bg-orange-100 rounded-lg",
              // Mobile-optimized icon container
              "p-1.5 sm:p-2"
            )}>
              <Building 
                className={cn(
                  "text-orange-600",
                  // Responsive icon sizing
                  "h-4 w-4 sm:h-5 sm:w-5"
                )} 
                aria-hidden="true"
              />
            </div>
            <span className="truncate">
              {isMobile ? "Estabelecimentos" : "Estabelecimentos Disponíveis"}
            </span>
          </CardTitle>
          <div 
            className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
            aria-hidden="true"
          ></div>
        </CardHeader>

        <CardContent className={cn(
          // Mobile-optimized content spacing
          "space-y-4 px-4 pb-4 sm:space-y-6 sm:px-6 sm:pb-6"
        )}>
          {/* Filter Controls */}
          <FilterControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            showOpenOnly={showOpenOnly}
            onShowOpenOnlyChange={setShowOpenOnly}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            isMobile={isMobile}
          />

          {/* Results Summary */}
          {!isLoading && locations.length > 0 && (
            <ResultsSummary
              totalCount={locations.length}
              filteredCount={filteredAndSortedLocations.length}
              selectedLocation={selectedLocation}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <LocationCardSkeleton key={index} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredAndSortedLocations.length === 0 && (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          )}

          {/* Location Cards Grid */}
          {!isLoading && filteredAndSortedLocations.length > 0 && (
            <div className="space-y-6">
              {/* Comparison View */}
              {showComparison && comparisonLocations.length > 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Comparação de Estabelecimentos
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setComparisonLocations([])}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Comparação
                    </Button>
                  </div>
                  <LocationComparison
                    locations={locations.filter(loc => comparisonLocations.includes(loc.id))}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                  />
                </div>
              )}

              {/* Location Cards - Responsive Grid */}
              <div className={cn(
                // Responsive grid using helper
                "grid",
                responsiveClasses.grid,
                // Override for comparison mode
                showComparison && comparisonLocations.length > 0 && isMobile && "grid-cols-1",
                showComparison && comparisonLocations.length > 0 && !isMobile && "md:grid-cols-1 lg:grid-cols-2"
              )}>
                {filteredAndSortedLocations.map((location, index) => (
                  <div 
                    key={location.id} 
                    className={cn(
                      "relative",
                      // Swipe feedback visual
                      isSwipeActive && "transition-transform duration-100"
                    )}
                    // Touch handlers for swipe gestures
                    onTouchStart={(e) => handleTouchStart(e, location.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleTouchEnd(location.id)}
                  >
                    <LocationCard
                      location={location}
                      isSelected={selectedLocation === location.id}
                      onSelect={() => handleLocationSelect(location.id)}
                      // Responsive compact mode
                      compact={getCompactMode()}
                      className={cn(
                        "transition-all duration-200",
                        // Comparison visual feedback
                        comparisonLocations.includes(location.id) && "ring-2 ring-blue-300",
                        // Touch-optimized styling
                        getTouchOptimized() && "shadow-sm hover:shadow-md active:shadow-lg",
                        // Staggered animation on load
                        "animate-in fade-in slide-in-from-bottom-4",
                        `animation-delay-${Math.min(index * 100, 500)}ms`
                      )}
                    />
                    
                    {/* Comparison Toggle - Mobile Optimized */}
                    {showComparison && (
                      <div className={cn(
                        "absolute z-10",
                        // Mobile positioning
                        isMobile ? "top-2 right-2" : "top-3 right-3"
                      )}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={comparisonLocations.includes(location.id) ? "default" : "outline"}
                              size={isMobile ? "sm" : "sm"}
                              onClick={() => handleComparisonToggle(location.id)}
                              disabled={!comparisonLocations.includes(location.id) && comparisonLocations.length >= 3}
                              className={cn(
                                // Mobile-optimized touch target
                                isMobile ? "h-10 w-10 p-0" : "h-8 w-8 p-0",
                                "shadow-lg border-2 bg-white/90 backdrop-blur-sm",
                                // Enhanced mobile feedback
                                "active:scale-95 transition-all duration-150"
                              )}
                            >
                              {comparisonLocations.includes(location.id) ? (
                                <CheckCircle2 className={cn(
                                  isMobile ? "h-5 w-5" : "h-4 w-4"
                                )} />
                              ) : (
                                <Eye className={cn(
                                  isMobile ? "h-5 w-5" : "h-4 w-4"
                                )} />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {comparisonLocations.includes(location.id)
                              ? "Remover da comparação"
                              : comparisonLocations.length >= 3
                              ? "Máximo 3 estabelecimentos para comparação"
                              : isMobile 
                              ? "Toque para comparar ou deslize →"
                              : "Adicionar à comparação"
                            }
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {/* Swipe Indicator for Mobile */}
                    {isMobile && showComparison && !comparisonLocations.includes(location.id) && (
                      <div className="absolute bottom-2 right-2 opacity-60">
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                          <ArrowRight className="h-3 w-3" />
                          <span>Deslize</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Comparison Instructions - Mobile Optimized */}
              {showComparison && comparisonLocations.length === 0 && (
                <div className={cn(
                  "p-4 bg-blue-50 border border-blue-200 rounded-lg",
                  // Mobile-optimized padding
                  "p-3 sm:p-4"
                )}>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-medium text-blue-900 mb-1">
                        Comparar Estabelecimentos
                      </h4>
                      <p className="text-sm text-blue-700">
                        {isMobile ? (
                          <>
                            Toque no ícone <Eye className="inline h-4 w-4 mx-1" /> ou 
                            <span className="font-medium"> deslize para a direita</span> nos 
                            estabelecimentos que deseja comparar. Você pode selecionar até 3 
                            estabelecimentos para comparação.
                          </>
                        ) : (
                          <>
                            Clique no ícone de olho nos estabelecimentos que deseja comparar. 
                            Você pode selecionar até 3 estabelecimentos para comparação lado a lado.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

// Specialized variants
export const LocationDetailsPanelCompact: React.FC<Omit<LocationDetailsPanelProps, 'showComparison'>> = (props) => (
  <LocationDetailsPanel {...props} showComparison={false} />
);

export const LocationDetailsPanelWithComparison: React.FC<LocationDetailsPanelProps> = (props) => (
  <LocationDetailsPanel {...props} showComparison={true} />
);

export default LocationDetailsPanel;