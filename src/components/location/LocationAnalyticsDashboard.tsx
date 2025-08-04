// Location Analytics Dashboard Component
// replaced by kiro @2025-02-08T19:30:00Z

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Star,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LocationPopularityIndicator from './LocationPopularityIndicator';
import LocationRatingDisplay from './LocationRatingDisplay';
import { 
  LocationAnalytics, 
  LocationInteraction, 
  LocationPopularityIndicator as PopularityData,
  AnalyticsFilters 
} from '@/types/locationAnalytics';
import locationAnalyticsService from '@/services/locationAnalyticsService';

interface LocationAnalyticsDashboardProps {
  locationIds: string[];
  locationNames: { [key: string]: string };
  showComparison?: boolean;
  compact?: boolean;
}

const LocationAnalyticsDashboard: React.FC<LocationAnalyticsDashboardProps> = ({
  locationIds,
  locationNames,
  showComparison = false,
  compact = false
}) => {
  const [analytics, setAnalytics] = useState<{ [key: string]: LocationAnalytics }>({});
  const [popularity, setPopularity] = useState<{ [key: string]: PopularityData }>({});
  const [interactions, setInteractions] = useState<{ [key: string]: LocationInteraction[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  useEffect(() => {
    loadAnalyticsData();
  }, [locationIds, selectedPeriod, filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const dateFilters: AnalyticsFilters = {
        ...filters,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      };

      // Load data for all locations
      const [analyticsData, popularityData] = await Promise.all([
        Promise.all(locationIds.map(id => 
          locationAnalyticsService.getLocationAnalytics(id)
        )),
        locationAnalyticsService.getPopularityIndicators(locationIds)
      ]);

      // Load interactions for each location
      const interactionsData = await Promise.all(
        locationIds.map(id => 
          locationAnalyticsService.getLocationInteractions(id, dateFilters)
        )
      );

      // Organize data by location ID
      const analyticsMap: { [key: string]: LocationAnalytics } = {};
      const popularityMap: { [key: string]: PopularityData } = {};
      const interactionsMap: { [key: string]: LocationInteraction[] } = {};

      analyticsData.forEach((data, index) => {
        analyticsMap[locationIds[index]] = data;
      });

      popularityData.forEach(data => {
        popularityMap[data.locationId] = data;
      });

      interactionsData.forEach((data, index) => {
        interactionsMap[locationIds[index]] = data;
      });

      setAnalytics(analyticsMap);
      setPopularity(popularityMap);
      setInteractions(interactionsMap);

    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (locationId: string, metric: string): number => {
    const data = analytics[locationId];
    if (!data) return 0;

    switch (metric) {
      case 'views': return data.totalViews;
      case 'selections': return data.totalSelections;
      case 'rating': return data.averageRating;
      case 'popularity': return data.popularityScore;
      default: return 0;
    }
  };

  const getInteractionsByType = (locationId: string) => {
    const locationInteractions = interactions[locationId] || [];
    const counts: { [key: string]: number } = {};
    
    locationInteractions.forEach(interaction => {
      counts[interaction.interactionType] = (counts[interaction.interactionType] || 0) + 1;
    });

    return counts;
  };

  const exportData = () => {
    const exportData = locationIds.map(id => ({
      location: locationNames[id] || id,
      analytics: analytics[id],
      popularity: popularity[id],
      interactions: interactions[id]?.length || 0
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `location-analytics-${selectedPeriod}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {locationIds.map(locationId => (
          <div key={locationId} className="bg-white rounded-lg border p-4">
            <h4 className="font-medium mb-3">{locationNames[locationId] || locationId}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics[locationId]?.totalViews || 0}
                </div>
                <div className="text-xs text-gray-600">Visualizações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics[locationId]?.totalSelections || 0}
                </div>
                <div className="text-xs text-gray-600">Seleções</div>
              </div>
            </div>
            {popularity[locationId] && (
              <div className="mt-3">
                <LocationPopularityIndicator 
                  popularity={popularity[locationId]} 
                  compact 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Analytics dos Locais
          </h2>
          <p className="text-gray-600">
            Dados de {locationIds.length} {locationIds.length === 1 ? 'local' : 'locais'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="views">Visualizações</SelectItem>
              <SelectItem value="selections">Seleções</SelectItem>
              <SelectItem value="rating">Avaliação</SelectItem>
              <SelectItem value="popularity">Popularidade</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Total de Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(analytics).reduce((sum, data) => sum + data.totalViews, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-green-500" />
              Total de Seleções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(analytics).reduce((sum, data) => sum + data.totalSelections, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(Object.values(analytics).reduce((sum, data) => sum + data.averageRating, 0) / locationIds.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(Object.values(analytics).reduce((sum, data) => sum + data.selectionRate, 0) / locationIds.length).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {locationIds.map(locationId => (
          <Card key={locationId}>
            <CardHeader>
              <CardTitle className="text-lg">
                {locationNames[locationId] || locationId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {analytics[locationId]?.totalViews || 0}
                  </div>
                  <div className="text-sm text-gray-600">Visualizações</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {analytics[locationId]?.totalSelections || 0}
                  </div>
                  <div className="text-sm text-gray-600">Seleções</div>
                </div>
              </div>

              {/* Popularity Indicator */}
              {popularity[locationId] && (
                <LocationPopularityIndicator 
                  popularity={popularity[locationId]} 
                  showDetails 
                />
              )}

              {/* Rating Display */}
              <LocationRatingDisplay 
                locationId={locationId} 
                compact 
              />

              {/* Interaction Breakdown */}
              <div>
                <h5 className="font-medium mb-2">Interações ({selectedPeriod})</h5>
                <div className="space-y-1">
                  {Object.entries(getInteractionsByType(locationId)).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Chart (if enabled) */}
      {showComparison && locationIds.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação de {selectedMetric}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationIds.map(locationId => {
                const value = getMetricValue(locationId, selectedMetric);
                const maxValue = Math.max(...locationIds.map(id => getMetricValue(id, selectedMetric)));
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                return (
                  <div key={locationId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{locationNames[locationId] || locationId}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationAnalyticsDashboard;