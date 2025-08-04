// Enhanced Location Card with Analytics Integration
// replaced by kiro @2025-02-08T19:30:00Z

import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  TrendingUp, 
  Users,
  MessageCircle,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LocationFacilities from './LocationFacilities';
import LocationActions from './LocationActions';
import LocationPopularityIndicator from './LocationPopularityIndicator';
import LocationRatingDisplay from './LocationRatingDisplay';
import LocationFeedbackForm from './LocationFeedbackForm';
import { useLocationAnalytics } from '@/hooks/useLocationAnalytics';
import { LocationWithTimeSlots } from '@/types/medical';
import { LocationPopularityIndicator as PopularityData } from '@/types/locationAnalytics';
import locationAnalyticsService from '@/services/locationAnalyticsService';

interface EnhancedLocationCardProps {
  location: LocationWithTimeSlots;
  isSelected: boolean;
  availableTimeSlots: number;
  onSelect: () => void;
  onViewMap: () => void;
  onCall: () => void;
  onShare: () => void;
  compact?: boolean;
  showAnalytics?: boolean;
  showFeedback?: boolean;
}

const EnhancedLocationCard: React.FC<EnhancedLocationCardProps> = ({
  location,
  isSelected,
  availableTimeSlots,
  onSelect,
  onViewMap,
  onCall,
  onShare,
  compact = false,
  showAnalytics = true,
  showFeedback = true
}) => {
  const [popularity, setPopularity] = useState<PopularityData | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'correction' | 'suggestion'>('rating');
  const analytics = useLocationAnalytics();

  useEffect(() => {
    // Track location view when card is rendered
    analytics.trackView(location.id, {
      source: 'location_card',
      availableSlots: availableTimeSlots
    });

    // Load popularity data if analytics are enabled
    if (showAnalytics) {
      loadPopularityData();
    }
  }, [location.id, analytics, showAnalytics, availableTimeSlots]);

  const loadPopularityData = async () => {
    try {
      const popularityData = await locationAnalyticsService.getPopularityIndicators([location.id]);
      if (popularityData.length > 0) {
        setPopularity(popularityData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de popularidade:', error);
    }
  };

  const handleSelect = () => {
    analytics.trackSelection(location.id, {
      source: 'location_card_select',
      availableSlots: availableTimeSlots
    });
    onSelect();
  };

  const handleViewMap = () => {
    analytics.trackMap(location.id);
    onViewMap();
  };

  const handleCall = () => {
    analytics.trackCall(location.id);
    onCall();
  };

  const handleShare = () => {
    analytics.trackShare(location.id, 'location_card');
    onShare();
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackForm(false);
    // Refresh popularity data after feedback
    if (showAnalytics) {
      setTimeout(loadPopularityData, 1000);
    }
  };

  const formatOperatingHours = () => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    const todaySchedule = location.horario_funcionamento[today as keyof typeof location.horario_funcionamento];
    
    if (!todaySchedule || todaySchedule.fechado) {
      return 'Fechado hoje';
    }
    
    return `${todaySchedule.abertura} - ${todaySchedule.fechamento}`;
  };

  const getStatusColor = () => {
    switch (location.status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'temporariamente_fechado': return 'bg-red-100 text-red-800';
      case 'manutencao': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (location.status) {
      case 'ativo': return 'Ativo';
      case 'temporariamente_fechado': return 'Fechado';
      case 'manutencao': return 'Manutenção';
      default: return 'Desconhecido';
    }
  };

  if (compact) {
    return (
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isSelected ? 'border-blue-500 bg-blue-50 shadow-xl ring-2 ring-blue-200' : 'border-gray-200'
        }`}
        onClick={handleSelect}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg truncate">{location.nome_local}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {availableTimeSlots > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {availableTimeSlots} horários
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{location.endereco_completo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatOperatingHours()}</span>
            </div>
          </div>

          {showAnalytics && popularity && (
            <div className="mt-3">
              <LocationPopularityIndicator popularity={popularity} compact />
            </div>
          )}

          {showAnalytics && (
            <div className="mt-3">
              <LocationRatingDisplay locationId={location.id} compact />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'border-blue-500 bg-blue-50 shadow-xl ring-2 ring-blue-200' : 'border-gray-200'
      } ${location.status !== 'ativo' ? 'opacity-75' : ''}`}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{location.nome_local}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {availableTimeSlots > 0 && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {availableTimeSlots} horários disponíveis
                </span>
              )}
            </div>
          </div>
          
          {showAnalytics && popularity && (
            <div className="ml-4">
              <LocationPopularityIndicator popularity={popularity} compact />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location Information */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <span className="text-gray-700">{location.endereco_completo}</span>
          </div>
          
          {location.telefone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{location.telefone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-gray-700">{formatOperatingHours()}</span>
          </div>
        </div>

        {/* Facilities */}
        {location.facilidades && location.facilidades.length > 0 && (
          <div>
            <LocationFacilities facilities={location.facilidades} />
          </div>
        )}

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {popularity && (
              <LocationPopularityIndicator popularity={popularity} showDetails />
            )}
            <LocationRatingDisplay locationId={location.id} showReviews maxReviews={2} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            onClick={handleSelect}
            className={isSelected ? 'bg-blue-600' : ''}
          >
            {isSelected ? 'Selecionado' : 'Selecionar Local'}
          </Button>
          
          <LocationActions
            location={location}
            onViewMap={handleViewMap}
            onCall={handleCall}
            onShare={handleShare}
          />

          {showFeedback && (
            <div className="flex gap-2">
              <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedbackType('rating')}
                    className="flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Avaliar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Avaliar {location.nome_local}</DialogTitle>
                  </DialogHeader>
                  <LocationFeedbackForm
                    locationId={location.id}
                    locationName={location.nome_local}
                    initialType={feedbackType}
                    onSubmitSuccess={handleFeedbackSubmit}
                    onCancel={() => setShowFeedbackForm(false)}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFeedbackType('correction');
                  setShowFeedbackForm(true);
                }}
                className="flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Corrigir
              </Button>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Última atualização: {new Date(location.ultima_atualizacao).toLocaleDateString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLocationCard;