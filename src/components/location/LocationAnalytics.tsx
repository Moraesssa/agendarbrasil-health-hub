/**
 * Location Analytics Component
 * Displays analytics data and popularity indicators for locations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { locationAnalyticsService } from '@/services/locationAnalyticsService';
import { LocationAnalytics, LocationPopularityMetrics } from '@/types/analytics';
import { EnhancedLocation } from '@/types/location';
import { 
  Eye, 
  MousePointer, 
  Calendar, 
  Star, 
  TrendingUp, 
  Users, 
  Clock,
  BarChart3,
  Activity,
  Award,
  Zap
} from 'lucide-react';

interface LocationAnalyticsProps {
  location: EnhancedLocation;
  showDetailedView?: boolean;
  className?: string;
}

interface AnalyticsData {
  analytics: LocationAnalytics | null;
  popularityMetrics: LocationPopularityMetrics | null;
  loading: boolean;
  error: string | null;
}

export const LocationAnalytics: React.FC<LocationAnalyticsProps> = ({
  location,
  showDetailedView = false,
  className = ''
}) => {
  const [data, setData] = useState<AnalyticsData>({
    analytics: null,
    popularityMetrics: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [location.id]);

  const loadAnalyticsData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [analytics, popularityMetrics] = await Promise.all([
        locationAnalyticsService.getLocationAnalytics({ location_id: location.id }),
        locationAnalyticsService.getLocationPopularityMetrics(location.id)
      ]);

      setData({
        analytics,
        popularityMetrics,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar dados de analytics'
      }));
    }
  };

  const getPopularityLevel = (score: number): { level: string; color: string; icon: React.ReactNode } => {
    if (score >= 80) return { 
      level: 'Muito Popular', 
      color: 'bg-green-500', 
      icon: <Award className="w-4 h-4" /> 
    };
    if (score >= 60) return { 
      level: 'Popular', 
      color: 'bg-blue-500', 
      icon: <TrendingUp className="w-4 h-4" /> 
    };
    if (score >= 40) return { 
      level: 'Moderado', 
      color: 'bg-yellow-500', 
      icon: <Activity className="w-4 h-4" /> 
    };
    if (score >= 20) return { 
      level: 'Baixo', 
      color: 'bg-orange-500', 
      icon: <BarChart3 className="w-4 h-4" /> 
    };
    return { 
      level: 'Novo', 
      color: 'bg-gray-500', 
      icon: <Zap className="w-4 h-4" /> 
    };
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderPopularityBadge = () => {
    if (!data.analytics) return null;

    const popularity = getPopularityLevel(data.analytics.popularity_score);
    
    return (
      <Badge variant="secondary" className={`${popularity.color} text-white`}>
        {popularity.icon}
        <span className="ml-1">{popularity.level}</span>
      </Badge>
    );
  };

  const renderQuickStats = () => {
    if (!data.analytics) return null;

    const stats = [
      {
        icon: <Eye className="w-4 h-4" />,
        label: 'Visualizações',
        value: formatNumber(data.analytics.total_views),
        subValue: `${data.analytics.views_last_7_days} esta semana`
      },
      {
        icon: <MousePointer className="w-4 h-4" />,
        label: 'Seleções',
        value: formatNumber(data.analytics.total_selections),
        subValue: `${data.analytics.selections_last_7_days} esta semana`
      },
      {
        icon: <Calendar className="w-4 h-4" />,
        label: 'Agendamentos',
        value: formatNumber(data.analytics.appointments_booked),
        subValue: `${((data.analytics.selection_to_booking_rate || 0) * 100).toFixed(1)}% conversão`
      },
      {
        icon: <Star className="w-4 h-4" />,
        label: 'Avaliação',
        value: data.analytics.average_rating > 0 ? data.analytics.average_rating.toFixed(1) : 'N/A',
        subValue: `${data.analytics.total_ratings} avaliações`
      }
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-blue-600">{stat.icon}</div>
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.subValue}</div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTrendingIndicator = () => {
    if (!data.analytics) return null;

    const trendingScore = data.analytics.trending_score;
    const isTrending = trendingScore > 70;

    if (!isTrending) return null;

    return (
      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">Em Alta</span>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          +{trendingScore.toFixed(0)}%
        </Badge>
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!data.analytics || !data.analytics.rating_distribution) return null;

    const distribution = data.analytics.rating_distribution;
    const totalRatings = data.analytics.total_ratings;

    if (totalRatings === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          Nenhuma avaliação ainda
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-12">
                <span className="text-sm">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-1" />
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPopularityMetrics = () => {
    if (!data.popularityMetrics) return null;

    const metrics = data.popularityMetrics;
    const topCities = Object.entries(metrics.user_cities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const deviceData = metrics.device_types;
    const totalDevices = deviceData.mobile + deviceData.desktop + deviceData.tablet;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Principais Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCities.map(([city, count], index) => (
                <div key={city} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">
                      #{index + 1}
                    </span>
                    <span>{city}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(deviceData).map(([device, count]) => {
                const percentage = totalDevices > 0 ? (count / totalDevices) * 100 : 0;
                const deviceLabels = {
                  mobile: 'Mobile',
                  desktop: 'Desktop',
                  tablet: 'Tablet'
                };
                
                return (
                  <div key={device} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{deviceLabels[device as keyof typeof deviceLabels]}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (data.loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p>{data.error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAnalyticsData}
              className="mt-2"
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showDetailedView) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {renderPopularityBadge()}
        {renderTrendingIndicator()}
        {data.analytics && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(data.analytics.total_views)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>
                {data.analytics.average_rating > 0 
                  ? data.analytics.average_rating.toFixed(1) 
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Analytics do Local</h3>
          {renderPopularityBadge()}
        </div>
        {renderTrendingIndicator()}
      </div>

      {/* Quick Stats */}
      {renderQuickStats()}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="ratings">Avaliações</TabsTrigger>
          <TabsTrigger value="demographics">Demografia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Visualização → Seleção</span>
                      <span>{((data.analytics?.view_to_selection_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(data.analytics?.view_to_selection_rate || 0) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Seleção → Agendamento</span>
                      <span>{((data.analytics?.selection_to_booking_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(data.analytics?.selection_to_booking_rate || 0) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Últimos 7 dias</span>
                    <div className="text-right">
                      <div className="font-semibold">
                        {data.analytics?.views_last_7_days || 0} visualizações
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.analytics?.selections_last_7_days || 0} seleções
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Últimos 30 dias</span>
                    <div className="text-right">
                      <div className="font-semibold">
                        {data.analytics?.views_last_30_days || 0} visualizações
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.analytics?.selections_last_30_days || 0} seleções
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Avaliações</CardTitle>
              <CardDescription>
                {data.analytics?.total_ratings || 0} avaliações • 
                Média: {data.analytics?.average_rating ? data.analytics.average_rating.toFixed(1) : 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRatingDistribution()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          {renderPopularityMetrics()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationAnalytics;