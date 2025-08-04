// Location Popularity Indicator Component
// replaced by kiro @2025-02-08T19:30:00Z

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users, Star } from 'lucide-react';
import { LocationPopularityIndicator as PopularityData } from '@/types/locationAnalytics';

interface LocationPopularityIndicatorProps {
  popularity: PopularityData;
  showDetails?: boolean;
  compact?: boolean;
}

const LocationPopularityIndicator: React.FC<LocationPopularityIndicatorProps> = ({
  popularity,
  showDetails = false,
  compact = false
}) => {
  const getPopularityColor = (level: string) => {
    switch (level) {
      case 'muito_alta': return 'text-green-600 bg-green-100';
      case 'alta': return 'text-blue-600 bg-blue-100';
      case 'média': return 'text-yellow-600 bg-yellow-100';
      case 'baixa': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPopularityLabel = (level: string) => {
    switch (level) {
      case 'muito_alta': return 'Muito Popular';
      case 'alta': return 'Popular';
      case 'média': return 'Moderado';
      case 'baixa': return 'Pouco Popular';
      default: return 'Sem dados';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'crescendo': return <TrendingUp className="w-3 h-3" />;
      case 'decrescendo': return <TrendingDown className="w-3 h-3" />;
      case 'estável': return <Minus className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'crescendo': return 'text-green-600';
      case 'decrescendo': return 'text-red-600';
      case 'estável': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPopularityColor(popularity.popularityLevel)}`}>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {getPopularityLabel(popularity.popularityLevel)}
          </div>
        </div>
        <div className={`flex items-center ${getTrendColor(popularity.trendDirection)}`}>
          {getTrendIcon(popularity.trendDirection)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Popularidade</h4>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPopularityColor(popularity.popularityLevel)}`}>
          {getPopularityLabel(popularity.popularityLevel)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Score de Popularidade</span>
          <span className="font-medium">{popularity.popularityScore}/100</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              popularity.popularityScore >= 80 ? 'bg-green-500' :
              popularity.popularityScore >= 60 ? 'bg-blue-500' :
              popularity.popularityScore >= 40 ? 'bg-yellow-500' : 'bg-gray-400'
            }`}
            style={{ width: `${Math.min(popularity.popularityScore, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <span>Tendência</span>
            <div className={getTrendColor(popularity.trendDirection)}>
              {getTrendIcon(popularity.trendDirection)}
            </div>
          </div>
          <span className="font-medium">
            {popularity.trendDirection === 'crescendo' ? 'Crescendo' :
             popularity.trendDirection === 'decrescendo' ? 'Decrescendo' : 'Estável'}
          </span>
        </div>

        {showDetails && (
          <div className="pt-2 border-t space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seleções recentes (7 dias)</span>
              <span className="font-medium">{popularity.recentSelections}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Comparado à média</span>
              <span className={`font-medium ${
                popularity.comparisonToAverage > 0 ? 'text-green-600' : 
                popularity.comparisonToAverage < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {popularity.comparisonToAverage > 0 ? '+' : ''}
                {popularity.comparisonToAverage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPopularityIndicator;