/**
 * AdvancedLocationComparison Component
 * Funcionalidade avançada de comparação de estabelecimentos com recursos aprimorados
 * // replaced by kiro @2025-02-08T19:30:00.000Z
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Building, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Navigation,
  Share2,
  Calendar,
  Info,
  Save,
  Download,
  Copy,
  Star,
  TrendingUp,
  Award,
  Filter,
  MoreHorizontal,
  Zap,
  Target,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationWithTimeSlots } from '@/types/location';
import { 
  formatPhoneNumber,
  formatAddress,
  getLocationStatusLabel,
  isLocationOpen,
  generateMapsUrl
} from '@/utils/locationUtils';
import { LocationFacilities } from './LocationFacilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

interface AdvancedLocationComparisonProps {
  locations: LocationWithTimeSlots[];
  selectedLocation?: string;
  onLocationSelect: (locationId: string) => void;
  onSaveComparison?: (comparisonData: ComparisonData) => void;
  className?: string;
}

interface ComparisonData {
  id: string;
  name: string;
  locations: LocationWithTimeSlots[];
  criteria: ComparisonCriteria;
  createdAt: string;
  notes?: string;
}

interface ComparisonCriteria {
  showDistance: boolean;
  showFacilities: boolean;
  showHours: boolean;
  showAvailability: boolean;
  showContact: boolean;
  showRating: boolean;
  priorityFacilities: string[];
  weightings: {
    availability: number;
    distance: number;
    facilities: number;
    hours: number;
    contact: number;
  };
}

interface LocationScore {
  locationId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    availability: number;
    distance: number;
    facilities: number;
    hours: number;
    contact: number;
  };
  rank: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

// Componente de pontuação avançada
const AdvancedLocationScore: React.FC<{ 
  location: LocationWithTimeSlots; 
  criteria: ComparisonCriteria;
  score: LocationScore;
}> = ({ location, criteria, score }) => {
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent': return 'text-green-700 bg-green-100 border-green-200';
      case 'good': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'fair': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'poor': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent': return <Award className="h-4 w-4" />;
      case 'good': return <TrendingUp className="h-4 w-4" />;
      case 'fair': return <Target className="h-4 w-4" />;
      case 'poor': return <BarChart3 className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      case 'poor': return 'Limitado';
      default: return 'N/A';
    }
  };

  return (
    <div className="space-y-4">
      {/* Pontuação Principal */}
      <div className="text-center space-y-2">
        <div className="relative">
          <div className="text-3xl font-bold text-gray-900">
            {score.percentage}%
          </div>
          <div className="text-sm text-gray-500">
            {score.totalScore}/{score.maxScore} pontos
          </div>
        </div>
        
        {/* Barra de Progresso Circular */}
        <div className="relative w-20 h-20 mx-auto">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - score.percentage / 100)}`}
              className={cn(
                "transition-all duration-1000 ease-out",
                score.percentage >= 80 ? "text-green-500" :
                score.percentage >= 60 ? "text-blue-500" :
                score.percentage >= 40 ? "text-yellow-500" : "text-red-500"
              )}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">#{score.rank}</span>
          </div>
        </div>
      </div>

      {/* Recomendação */}
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border",
        getRecommendationColor(score.recommendation)
      )}>
        {getRecommendationIcon(score.recommendation)}
        <span>{getRecommendationLabel(score.recommendation)}</span>
      </div>

      {/* Breakdown Detalhado */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento:</h4>
        
        {criteria.showAvailability && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Disponibilidade</span>
            <div className="flex items-center gap-2">
              <Progress 
                value={(score.breakdown.availability / (criteria.weightings.availability * 30)) * 100} 
                className="w-16 h-2" 
              />
              <span className="font-medium w-8 text-right">
                {score.breakdown.availability}
              </span>
            </div>
          </div>
        )}

        {criteria.showDistance && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Distância</span>
            <div className="flex items-center gap-2">
              <Progress 
                value={(score.breakdown.distance / (criteria.weightings.distance * 15)) * 100} 
                className="w-16 h-2" 
              />
              <span className="font-medium w-8 text-right">
                {score.breakdown.distance}
              </span>
            </div>
          </div>
        )}

        {criteria.showFacilities && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Facilidades</span>
            <div className="flex items-center gap-2">
              <Progress 
                value={(score.breakdown.facilities / (criteria.weightings.facilities * 25)) * 100} 
                className="w-16 h-2" 
              />
              <span className="font-medium w-8 text-right">
                {score.breakdown.facilities}
              </span>
            </div>
          </div>
        )}

        {criteria.showHours && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Horários</span>
            <div className="flex items-center gap-2">
              <Progress 
                value={(score.breakdown.hours / (criteria.weightings.hours * 20)) * 100} 
                className="w-16 h-2" 
              />
              <span className="font-medium w-8 text-right">
                {score.breakdown.hours}
              </span>
            </div>
          </div>
        )}

        {criteria.showContact && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Contato</span>
            <div className="flex items-center gap-2">
              <Progress 
                value={(score.breakdown.contact / (criteria.weightings.contact * 10)) * 100} 
                className="w-16 h-2" 
              />
              <span className="font-medium w-8 text-right">
                {score.breakdown.contact}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de insights de comparação
const ComparisonInsights: React.FC<{
  locations: LocationWithTimeSlots[];
  scores: LocationScore[];
}> = ({ locations, scores }) => {
  const insights = useMemo(() => {
    const bestLocation = scores[0];
    const worstLocation = scores[scores.length - 1];
    const avgScore = scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length;
    
    const bestFacilities = locations.reduce((best, location) => {
      return location.facilidades.filter(f => f.available).length > 
             best.facilidades.filter(f => f.available).length ? location : best;
    });

    const closestLocation = locations.reduce((closest, location) => {
      return (location.distance_km || Infinity) < (closest.distance_km || Infinity) ? location : closest;
    });

    const mostAvailable = locations.reduce((most, location) => {
      return location.available_slots_count > most.available_slots_count ? location : most;
    });

    return {
      bestLocation: locations.find(l => l.id === bestLocation.locationId),
      worstLocation: locations.find(l => l.id === worstLocation.locationId),
      avgScore: Math.round(avgScore),
      bestFacilities,
      closestLocation,
      mostAvailable,
      scoreDifference: bestLocation.percentage - worstLocation.percentage
    };
  }, [locations, scores]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="h-5 w-5" />
          Insights da Comparação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Melhor Opção Geral */}
          <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-800">Melhor Opção Geral</span>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{insights.bestLocation?.nome_local}</span> 
              {' '}com {scores[0].percentage}% de pontuação
            </p>
          </div>

          {/* Mais Próximo */}
          <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Mais Próximo</span>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{insights.closestLocation.nome_local}</span>
              {' '}a {insights.closestLocation.distance_km?.toFixed(1)}km
            </p>
          </div>

          {/* Mais Horários */}
          <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-purple-800">Mais Horários</span>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{insights.mostAvailable.nome_local}</span>
              {' '}com {insights.mostAvailable.available_slots_count} horários
            </p>
          </div>

          {/* Melhores Facilidades */}
          <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-orange-600" />
              <span className="font-semibold text-orange-800">Melhores Facilidades</span>
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{insights.bestFacilities.nome_local}</span>
              {' '}com {insights.bestFacilities.facilidades.filter(f => f.available).length} facilidades
            </p>
          </div>
        </div>

        {/* Resumo Estatístico */}
        <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-indigo-800">Resumo Estatístico</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{insights.avgScore}%</div>
              <div className="text-xs text-gray-600">Média Geral</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{insights.scoreDifference}%</div>
              <div className="text-xs text-gray-600">Diferença</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{locations.length}</div>
              <div className="text-xs text-gray-600">Comparados</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdvancedLocationComparison: React.FC<AdvancedLocationComparisonProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  onSaveComparison,
  className
}) => {
  const [criteria, setCriteria] = useState<ComparisonCriteria>({
    showDistance: true,
    showFacilities: true,
    showHours: true,
    showAvailability: true,
    showContact: true,
    showRating: true,
    priorityFacilities: ['estacionamento', 'acessibilidade'],
    weightings: {
      availability: 1.0,
      distance: 0.8,
      facilities: 0.9,
      hours: 0.7,
      contact: 0.5
    }
  });

  // Calcular pontuações avançadas
  const locationScores = useMemo(() => {
    const scores: LocationScore[] = locations.map(location => {
      let totalScore = 0;
      let maxScore = 0;
      const breakdown = {
        availability: 0,
        distance: 0,
        facilities: 0,
        hours: 0,
        contact: 0
      };

      // Pontuação de disponibilidade (0-30 pontos)
      if (criteria.showAvailability) {
        const availabilityPoints = Math.min(location.available_slots_count * 2, 30) * criteria.weightings.availability;
        breakdown.availability = Math.round(availabilityPoints);
        totalScore += availabilityPoints;
        maxScore += 30 * criteria.weightings.availability;
      }

      // Pontuação de distância (0-15 pontos)
      if (criteria.showDistance && location.distance_km !== undefined) {
        let distancePoints = 0;
        if (location.distance_km <= 1) distancePoints = 15;
        else if (location.distance_km <= 3) distancePoints = 12;
        else if (location.distance_km <= 5) distancePoints = 8;
        else if (location.distance_km <= 10) distancePoints = 4;
        
        distancePoints *= criteria.weightings.distance;
        breakdown.distance = Math.round(distancePoints);
        totalScore += distancePoints;
        maxScore += 15 * criteria.weightings.distance;
      }

      // Pontuação de facilidades (0-25 pontos)
      if (criteria.showFacilities) {
        const availableFacilities = location.facilidades.filter(f => f.available);
        const priorityFacilitiesCount = availableFacilities.filter(f => 
          criteria.priorityFacilities.includes(f.type)
        ).length;
        
        const facilitiesPoints = (
          availableFacilities.length * 2 + 
          priorityFacilitiesCount * 3
        ) * criteria.weightings.facilities;
        
        breakdown.facilities = Math.round(Math.min(facilitiesPoints, 25 * criteria.weightings.facilities));
        totalScore += breakdown.facilities;
        maxScore += 25 * criteria.weightings.facilities;
      }

      // Pontuação de horários (0-20 pontos)
      if (criteria.showHours) {
        let hoursPoints = 0;
        if (location.status === 'ativo' && location.is_open_now) hoursPoints = 20;
        else if (location.status === 'ativo') hoursPoints = 15;
        else if (location.status === 'temporariamente_fechado') hoursPoints = 5;
        
        hoursPoints *= criteria.weightings.hours;
        breakdown.hours = Math.round(hoursPoints);
        totalScore += hoursPoints;
        maxScore += 20 * criteria.weightings.hours;
      }

      // Pontuação de contato (0-10 pontos)
      if (criteria.showContact) {
        let contactPoints = 0;
        if (location.telefone) contactPoints += 4;
        if (location.email) contactPoints += 3;
        if (location.website) contactPoints += 3;
        
        contactPoints *= criteria.weightings.contact;
        breakdown.contact = Math.round(contactPoints);
        totalScore += contactPoints;
        maxScore += 10 * criteria.weightings.contact;
      }

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      
      let recommendation: LocationScore['recommendation'] = 'poor';
      if (percentage >= 85) recommendation = 'excellent';
      else if (percentage >= 70) recommendation = 'good';
      else if (percentage >= 50) recommendation = 'fair';

      return {
        locationId: location.id,
        totalScore: Math.round(totalScore),
        maxScore: Math.round(maxScore),
        percentage,
        breakdown,
        rank: 0, // Will be set after sorting
        recommendation
      };
    });

    // Ordenar por pontuação e definir ranks
    scores.sort((a, b) => b.percentage - a.percentage);
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });

    return scores;
  }, [locations, criteria]);

  if (locations.length === 0) {
    return null;
  }

  if (locations.length === 1) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <Info className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p>Selecione pelo menos 2 estabelecimentos para comparar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Insights da Comparação */}
      <ComparisonInsights locations={locations} scores={locationScores} />

      {/* Comparação Detalhada */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Zap className="h-5 w-5 text-orange-600" />
              Comparação Avançada
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Estabelecimento</TableHead>
                  {locations.map((location) => (
                    <TableHead key={location.id} className="min-w-64">
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-900 text-base">
                          {location.nome_local}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatAddress(location)}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {/* Pontuação Avançada */}
                <TableRow className="bg-gradient-to-r from-orange-50 to-red-50">
                  <TableHead className="font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Pontuação</span>
                    </div>
                  </TableHead>
                  {locations.map((location) => {
                    const score = locationScores.find(s => s.locationId === location.id)!;
                    return (
                      <TableCell key={location.id} className="align-top py-6">
                        <AdvancedLocationScore 
                          location={location} 
                          criteria={criteria} 
                          score={score}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Ações */}
                <TableRow className="border-t-2 border-gray-200">
                  <TableHead className="font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Ações</span>
                    </div>
                  </TableHead>
                  {locations.map((location) => (
                    <TableCell key={location.id} className="align-top py-4">
                      <div className="space-y-2">
                        <Button
                          variant={selectedLocation === location.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => onLocationSelect(location.id)}
                          className="w-full"
                        >
                          {selectedLocation === location.id ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Selecionado
                            </>
                          ) : (
                            'Selecionar'
                          )}
                        </Button>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generateMapsUrl(location), '_blank')}
                            className="flex-1"
                          >
                            <Navigation className="h-3 w-3" />
                          </Button>
                          
                          {location.telefone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`tel:${location.telefone?.replace(/\D/g, '')}`, '_self')}
                              className="flex-1"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: location.nome_local,
                                  text: `${location.nome_local}\n${formatAddress(location)}`,
                                  url: generateMapsUrl(location)
                                });
                              }
                            }}
                            className="flex-1"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedLocationComparison;