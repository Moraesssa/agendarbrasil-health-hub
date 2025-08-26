import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lightbulb, Star, Clock, MapPin, TrendingUp, Users, Heart } from 'lucide-react';
import { useAdvancedScheduling } from '@/hooks/useAdvancedScheduling';

interface Doctor {
  id: string;
  display_name: string;
  rating: number;
  nextAvailableSlot: string;
  location: string;
  distance: string;
  specialties: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface SmartRecommendationsProps {
  specialty: string;
  city: string;
  state: string;
  selectedDate: string;
  onDoctorSelect: (doctorId: string) => void;
  onLocationSelect: (location: string) => void;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  specialty,
  city,
  state,
  selectedDate,
  onDoctorSelect,
  onLocationSelect
}) => {
  const [recommendations, setRecommendations] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const { favorites, recentSearches } = useAdvancedScheduling();

  useEffect(() => {
    if (specialty && city && state) {
      generateRecommendations();
    }
  }, [specialty, city, state, selectedDate]);

  const generateRecommendations = () => {
    setIsLoading(true);
    
    // Generate recommendations based on actual data
    setTimeout(() => {
      // TODO: Replace with actual API call to get smart recommendations
      const actualRecommendations: Doctor[] = [];

      // For now, return empty array until actual recommendation API is implemented
      setRecommendations(actualRecommendations);
      setIsLoading(false);
    }, 500);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Users className="w-4 h-4 text-yellow-500" />;
      default:
        return <Heart className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta prioridade';
      case 'medium':
        return 'Boa opção';
      default:
        return 'Alternativa';
    }
  };

  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, 3);

  if (!specialty || !city || !state) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Recomendações Inteligentes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Baseado em suas preferências, avaliações e disponibilidade
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRecommendations.map((doctor, index) => (
              <Card
                key={doctor.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                onClick={() => onDoctorSelect(doctor.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {doctor.display_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">1</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Dr. {doctor.display_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(doctor.rating)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{doctor.rating}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(doctor.priority)}
                          <Badge 
                            variant={doctor.priority === 'high' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {getPriorityLabel(doctor.priority)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Próximo: {doctor.nextAvailableSlot}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{doctor.location}</span>
                        </div>
                        
                        <div className="text-muted-foreground">
                          📍 {doctor.distance}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground italic">
                          💡 {doctor.reason}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doctor.specialties.slice(0, 2).map(spec => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {favorites.includes(doctor.id) && (
                          <Badge variant="destructive" className="text-xs">
                            ❤️ Favorito
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {recommendations.length > 3 && !showAll && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                >
                  Ver mais {recommendations.length - 3} recomendações
                </Button>
              </div>
            )}
            
            {showAll && recommendations.length > 3 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(false)}
                >
                  Mostrar menos
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Quick actions */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Ações rápidas:</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              🔍 Buscar mais médicos
            </Button>
            <Button variant="outline" size="sm">
              📍 Buscar por localização
            </Button>
            <Button variant="outline" size="sm">
              ⭐ Ver médicos favoritos
            </Button>
            <Button variant="outline" size="sm">
              🕐 Outros horários
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};