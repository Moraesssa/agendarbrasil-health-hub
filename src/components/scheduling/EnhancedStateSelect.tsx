import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Users, Building2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StateInfo {
  uf: string;
  nome?: string;
  doctorCount?: number;
  cityCount?: number;
  avgWaitTime?: string;
}

interface EnhancedStateSelectProps {
  selectedState: string;
  states: StateInfo[];
  isLoading: boolean;
  onChange: (value: string) => void;
  onStateInfo?: (info: StateInfo) => void;
}

const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
  'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
  'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
  'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
  'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
  'SE': 'Sergipe', 'TO': 'Tocantins'
};

const POPULAR_STATES = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF'];

export const EnhancedStateSelect: React.FC<EnhancedStateSelectProps> = ({
  selectedState,
  states,
  isLoading,
  onChange,
  onStateInfo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Enhanced states with names and mock statistics
  const enhancedStates = useMemo(() => {
    return states.map(state => ({
      ...state,
      nome: STATE_NAMES[state.uf] || state.uf,
      doctorCount: state.doctorCount || Math.floor(Math.random() * 1000) + 50,
      cityCount: state.cityCount || Math.floor(Math.random() * 100) + 10,
      avgWaitTime: state.avgWaitTime || `${Math.floor(Math.random() * 14) + 1} dias`
    }));
  }, [states]);

  // Filter states based on search
  const filteredStates = useMemo(() => {
    if (!searchTerm) return enhancedStates;
    
    const term = searchTerm.toLowerCase();
    return enhancedStates.filter(state => 
      state.uf.toLowerCase().includes(term) ||
      state.nome.toLowerCase().includes(term)
    );
  }, [enhancedStates, searchTerm]);

  // Organize states: popular first, then others
  const organizedStates = useMemo(() => {
    const popular = filteredStates.filter(state => POPULAR_STATES.includes(state.uf));
    const others = filteredStates.filter(state => !POPULAR_STATES.includes(state.uf));
    
    popular.sort((a, b) => a.nome.localeCompare(b.nome));
    others.sort((a, b) => a.nome.localeCompare(b.nome));
    
    const displayStates = showAll ? [...popular, ...others] : popular;
    
    return {
      popular,
      others,
      display: displayStates,
      hasMore: others.length > 0 && !showAll
    };
  }, [filteredStates, showAll]);

  const handleStateSelect = (state: StateInfo) => {
    onChange(state.uf);
    onStateInfo?.(state);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Selecione o Estado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Selecione o Estado
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick popular states */}
        {!searchTerm && organizedStates.popular.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Estados Populares
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {organizedStates.popular.slice(0, 6).map(state => (
                <Button
                  key={state.uf}
                  variant={selectedState === state.uf ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStateSelect(state)}
                  className="text-sm"
                >
                  {state.uf} - {state.nome}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* States grid */}
        <div>
          {searchTerm && (
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Resultados da busca ({filteredStates.length})
            </h4>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {organizedStates.display.map(state => (
              <Card
                key={state.uf}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  selectedState === state.uf
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleStateSelect(state)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{state.nome}</h3>
                      <p className="text-xs text-muted-foreground">{state.uf}</p>
                    </div>
                    {POPULAR_STATES.includes(state.uf) && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{state.doctorCount} médicos</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span>{state.cityCount} cidades</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Espera: {state.avgWaitTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {organizedStates.hasMore && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
              >
                Ver todos os estados ({organizedStates.others.length} restantes)
              </Button>
            </div>
          )}
          
          {filteredStates.length === 0 && searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum estado encontrado para "{searchTerm}"</p>
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
        
        {selectedState && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Selecionado:</span>
              <Badge variant="default">
                {STATE_NAMES[selectedState]} ({selectedState})
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};