import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, Users, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { safeArrayAccess, safeArrayLength, safeArrayMap } from '@/utils/arrayUtils';

interface CityInfo {
  cidade: string;
  doctorCount?: number | null;
  total_medicos?: number | null;
  isCapital?: boolean;
}

interface EnhancedCitySelectProps {
  selectedCity: string;
  cities: CityInfo[];
  isLoading: boolean;
  selectedState: string;
  onChange: (value: string) => void;
  onCityInfo?: (info: CityInfo) => void;
}

export const EnhancedCitySelect: React.FC<EnhancedCitySelectProps> = ({
  selectedCity,
  cities,
  isLoading,
  selectedState,
  onChange,
  onCityInfo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Enhanced cities with actual data or defaults
  const enhancedCities = useMemo(() => {
    const safeCities = safeArrayAccess(cities);
    return safeArrayMap(safeCities, (city) => {
      const normalizedTotal =
        typeof city.total_medicos === 'number'
          ? city.total_medicos
          : typeof city.doctorCount === 'number'
            ? city.doctorCount
            : null;

      return {
        ...city,
        doctorCount: normalizedTotal,
        total_medicos: normalizedTotal,
        isCapital: city.isCapital ?? isCapitalCity(city.cidade, selectedState)
      };
    });
  }, [cities, selectedState]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    const safeEnhanced = safeArrayAccess(enhancedCities);
    if (!searchTerm) return safeEnhanced;
    
    const term = searchTerm.toLowerCase();
    return safeEnhanced.filter(city => 
      city.cidade.toLowerCase().includes(term)
    );
  }, [enhancedCities, searchTerm]);

  // Organize cities: capitals and major cities first
  const organizedCities = useMemo(() => {
    const safeFiltered = safeArrayAccess(filteredCities);
    const getDoctorCount = (city: CityInfo) =>
      typeof city.doctorCount === 'number' ? city.doctorCount : 0;

    const capitals = safeFiltered.filter(city => city.isCapital);
    const major = safeFiltered.filter(city => !city.isCapital && getDoctorCount(city) > 50);
    const others = safeFiltered.filter(city => !city.isCapital && getDoctorCount(city) <= 50);

    // Sort each group
    capitals.sort((a, b) => getDoctorCount(b) - getDoctorCount(a));
    major.sort((a, b) => getDoctorCount(b) - getDoctorCount(a));
    others.sort((a, b) => a.cidade.localeCompare(b.cidade));
    
    const display = showAll ? [...capitals, ...major, ...others] : [...capitals, ...major.slice(0, 6)];
    
    return {
      capitals,
      major,
      others,
      display,
      hasMore: (major.length > 6 || others.length > 0) && !showAll
    };
  }, [filteredCities, showAll]);

  const handleCitySelect = (city: CityInfo) => {
    onChange(city.cidade);
    onCityInfo?.(city);
  };

  // Helper function to determine if city is a capital
  function isCapitalCity(cityName: string, state: string): boolean {
    const capitals: Record<string, string> = {
      'AC': 'Rio Branco', 'AL': 'Maceió', 'AP': 'Macapá', 'AM': 'Manaus',
      'BA': 'Salvador', 'CE': 'Fortaleza', 'DF': 'Brasília', 'ES': 'Vitória',
      'GO': 'Goiânia', 'MA': 'São Luís', 'MT': 'Cuiabá', 'MS': 'Campo Grande',
      'MG': 'Belo Horizonte', 'PA': 'Belém', 'PB': 'João Pessoa', 'PR': 'Curitiba',
      'PE': 'Recife', 'PI': 'Teresina', 'RJ': 'Rio de Janeiro', 'RN': 'Natal',
      'RS': 'Porto Alegre', 'RO': 'Porto Velho', 'RR': 'Boa Vista',
      'SC': 'Florianópolis', 'SP': 'São Paulo', 'SE': 'Aracaju', 'TO': 'Palmas'
    };
    
    return capitals[state] === cityName;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Selecione a Cidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedState) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecione um estado primeiro</h3>
          <p className="text-muted-foreground">
            Para ver as cidades disponíveis, primeiro escolha um estado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Selecione a Cidade - {selectedState}
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick access for capitals */}
        {!searchTerm && safeArrayLength(organizedCities.capitals) > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Capital e Principais Cidades
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {[...organizedCities.capitals, ...organizedCities.major.slice(0, 3)].map(city => (
                <Button
                  key={city.cidade}
                  variant={selectedCity === city.cidade ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCitySelect(city)}
                  className="text-sm"
                >
                  {city.cidade}
                  {city.isCapital && <Star className="w-3 h-3 ml-1" />}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Cities grid */}
        <div>
          {searchTerm && (
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Resultados da busca ({safeArrayLength(filteredCities)})
            </h4>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {organizedCities.display.map(city => (
              <Card
                key={city.cidade}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  selectedCity === city.cidade
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleCitySelect(city)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-1">
                        {city.cidade}
                        {city.isCapital && <Star className="w-3 h-3 text-yellow-500" />}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Users className="w-3 h-3" />
                        <span>
                          {typeof city.doctorCount === 'number'
                            ? `${city.doctorCount} ${city.doctorCount === 1 ? 'médico disponível' : 'médicos disponíveis'}`
                            : 'Disponibilidade em atualização'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {city.isCapital && (
                        <Badge variant="default" className="text-xs">
                          Capital
                        </Badge>
                      )}
                      {typeof city.doctorCount === 'number' && city.doctorCount > 100 && (
                        <Badge variant="secondary" className="text-xs">
                          +100 médicos
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {organizedCities.hasMore && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
              >
                Ver todas as cidades
              </Button>
            </div>
          )}
          
          {safeArrayLength(filteredCities) === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma cidade encontrada para "{searchTerm}"</p>
              <Button
                variant="ghost"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Limpar busca
              </Button>
            </div>
          )}
        </div>
        
        {selectedCity && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Selecionado:</span>
              <Badge variant="default" className="flex items-center gap-1">
                {selectedCity}
                {safeArrayAccess(enhancedCities).find(c => c.cidade === selectedCity)?.isCapital && (
                  <Star className="w-3 h-3" />
                )}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};