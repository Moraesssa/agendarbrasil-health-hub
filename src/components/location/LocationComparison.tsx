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
  StarOff,
  Heart,
  HeartOff,
  Filter,
  MoreHorizontal,
  Settings,
  Zap
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
import { AdvancedLocationComparison } from './AdvancedLocationComparison';
import { ComparisonCriteriaConfig } from './ComparisonCriteriaConfig';
import { ComparisonExportShare } from './ComparisonExportShare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface LocationComparisonProps {
  locations: LocationWithTimeSlots[];
  selectedLocation?: string;
  onLocationSelect: (locationId: string) => void;
  onSaveComparison?: (comparisonData: ComparisonData) => void;
  savedComparisons?: SavedComparison[];
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

interface SavedComparison {
  id: string;
  name: string;
  locationIds: string[];
  createdAt: string;
  notes?: string;
}

interface ComparisonCriteria {
  showDistance: boolean;
  showFacilities: boolean;
  showHours: boolean;
  showAvailability: boolean;
  showContact: boolean;
  priorityFacilities: string[];
}

interface ComparisonShareData {
  title: string;
  locations: LocationWithTimeSlots[];
  summary: string;
  url?: string;
}

interface ComparisonRowProps {
  label: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  children: React.ReactNode;
  className?: string;
}

// Comparison row component
const ComparisonRow: React.FC<ComparisonRowProps> = ({ 
  label, 
  icon: Icon, 
  children, 
  className 
}) => (
  <TableRow className={cn("hover:bg-gray-50", className)}>
    <TableHead className="font-medium text-gray-700 w-32">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm">{label}</span>
      </div>
    </TableHead>
    {children}
  </TableRow>
);

// Status badge for comparison
const ComparisonStatusBadge: React.FC<{ location: LocationWithTimeSlots }> = ({ location }) => {
  const isOpen = isLocationOpen(location);
  
  if (location.status !== 'ativo') {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        {getLocationStatusLabel(location.status)}
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        isOpen 
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-yellow-100 text-yellow-800 border-yellow-200"
      )}
    >
      <CheckCircle2 className="h-3 w-3 mr-1" />
      {isOpen ? 'Aberto' : 'Fechado'}
    </Badge>
  );
};

// Availability comparison
const AvailabilityComparison: React.FC<{ location: LocationWithTimeSlots }> = ({ location }) => {
  const { available_slots_count, next_available_slot } = location;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-blue-800">
          {available_slots_count} horário{available_slots_count !== 1 ? 's' : ''}
        </span>
      </div>
      {next_available_slot && (
        <div className="text-xs text-gray-600">
          Próximo: {next_available_slot}
        </div>
      )}
    </div>
  );
};

// Operating hours comparison
const OperatingHoursComparison: React.FC<{ location: LocationWithTimeSlots }> = ({ location }) => {
  const today = new Date();
  const dayName = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][today.getDay()] as keyof typeof location.horario_funcionamento;
  const todayHours = location.horario_funcionamento[dayName];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-sm cursor-help">
            {todayHours.fechado 
              ? 'Fechado hoje' 
              : `${todayHours.abertura} - ${todayHours.fechamento}`
            }
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">Horários de Funcionamento</div>
            {Object.entries(location.horario_funcionamento).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-sm">
                <span className="capitalize">{day.replace('_', '-')}:</span>
                <span>
                  {hours.fechado 
                    ? 'Fechado' 
                    : `${hours.abertura} - ${hours.fechamento}`
                  }
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Distance comparison
const DistanceComparison: React.FC<{ location: LocationWithTimeSlots }> = ({ location }) => {
  if (!location.distance_km) {
    return <span className="text-gray-500 text-sm">Não informado</span>;
  }
  
  return (
    <div className="flex items-center gap-1">
      <Navigation className="h-4 w-4 text-gray-500" />
      <span className="text-sm">
        {location.distance_km < 1 
          ? `${Math.round(location.distance_km * 1000)}m`
          : `${location.distance_km.toFixed(1)}km`
        }
      </span>
    </div>
  );
};

// Comparison score calculation
const ComparisonScore: React.FC<{ 
  location: LocationWithTimeSlots; 
  criteria: ComparisonCriteria;
}> = ({ location, criteria }) => {
  const calculateScore = () => {
    let score = 0;
    let maxScore = 0;

    // Availability score (0-30 points)
    if (criteria.showAvailability) {
      maxScore += 30;
      score += Math.min(location.available_slots_count * 2, 30);
    }

    // Status score (0-20 points)
    maxScore += 20;
    if (location.status === 'ativo' && location.is_open_now) {
      score += 20;
    } else if (location.status === 'ativo') {
      score += 15;
    } else if (location.status === 'temporariamente_fechado') {
      score += 5;
    }

    // Facilities score (0-25 points)
    if (criteria.showFacilities) {
      maxScore += 25;
      const availableFacilities = location.facilidades.filter(f => f.available);
      const priorityFacilitiesCount = availableFacilities.filter(f => 
        criteria.priorityFacilities.includes(f.type)
      ).length;
      const totalFacilitiesScore = availableFacilities.length * 2;
      const priorityScore = priorityFacilitiesCount * 5;
      score += Math.min(totalFacilitiesScore + priorityScore, 25);
    }

    // Distance score (0-15 points) - closer is better
    if (criteria.showDistance && location.distance_km !== undefined) {
      maxScore += 15;
      if (location.distance_km <= 1) {
        score += 15;
      } else if (location.distance_km <= 5) {
        score += 10;
      } else if (location.distance_km <= 10) {
        score += 5;
      }
    }

    // Contact info score (0-10 points)
    if (criteria.showContact) {
      maxScore += 10;
      if (location.telefone) score += 5;
      if (location.email) score += 3;
      if (location.website) score += 2;
    }

    return { score, maxScore, percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0 };
  };

  const { score, maxScore, percentage } = calculateScore();

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700 bg-green-100';
    if (percentage >= 60) return 'text-yellow-700 bg-yellow-100';
    if (percentage >= 40) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  const getStarCount = (percentage: number) => {
    return Math.round((percentage / 100) * 5);
  };

  const starCount = getStarCount(percentage);

  return (
    <div className="space-y-2">
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        getScoreColor(percentage)
      )}>
        <span>{percentage}%</span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-3 w-3",
              index < starCount 
                ? "text-yellow-500 fill-yellow-500" 
                : "text-gray-300"
            )}
          />
        ))}
      </div>
      <div className="text-xs text-gray-500">
        {score}/{maxScore} pontos
      </div>
    </div>
  );
};

// Action buttons for comparison
const ComparisonActions: React.FC<{ 
  location: LocationWithTimeSlots;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ location, isSelected, onSelect }) => (
  <div className="space-y-2">
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onSelect}
      className="w-full"
    >
      {isSelected ? (
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
);

export const LocationComparison: React.FC<LocationComparisonProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  onSaveComparison,
  savedComparisons = [],
  className
}) => {
  // Local state for comparison functionality
  const [comparisonName, setComparisonName] = useState('');
  const [comparisonNotes, setComparisonNotes] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'advanced'>('standard');
  const [criteria, setCriteria] = useState<ComparisonCriteria>({
    showDistance: true,
    showFacilities: true,
    showHours: true,
    showAvailability: true,
    showContact: true,
    priorityFacilities: ['estacionamento', 'acessibilidade']
  });

  // Generate comparison summary for sharing
  const comparisonSummary = useMemo(() => {
    if (locations.length === 0) return '';
    
    const locationNames = locations.map(loc => loc.nome_local).join(', ');
    const totalSlots = locations.reduce((sum, loc) => sum + loc.available_slots_count, 0);
    const openCount = locations.filter(loc => loc.is_open_now).length;
    
    return `Comparação de ${locations.length} estabelecimentos: ${locationNames}. Total de ${totalSlots} horários disponíveis. ${openCount} estabelecimento${openCount !== 1 ? 's' : ''} aberto${openCount !== 1 ? 's' : ''} agora.`;
  }, [locations]);

  // Handle sharing functionality
  const handleShare = useCallback(async (method: 'whatsapp' | 'email' | 'sms' | 'system' | 'copy') => {
    const shareData: ComparisonShareData = {
      title: `Comparação de Estabelecimentos - AgendarBrasil`,
      locations,
      summary: comparisonSummary,
      url: window.location.href
    };

    try {
      switch (method) {
        case 'system':
          if (navigator.share) {
            await navigator.share({
              title: shareData.title,
              text: shareData.summary,
              url: shareData.url
            });
          } else {
            throw new Error('Sistema de compartilhamento não suportado');
          }
          break;

        case 'copy':
          const textToShare = `${shareData.title}\n\n${shareData.summary}\n\n${shareData.url || ''}`;
          await navigator.clipboard.writeText(textToShare);
          toast({
            title: "Copiado!",
            description: "Comparação copiada para a área de transferência.",
          });
          break;

        case 'whatsapp':
          const whatsappText = encodeURIComponent(`${shareData.title}\n\n${shareData.summary}\n\n${shareData.url || ''}`);
          window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
          break;

        case 'email':
          const emailSubject = encodeURIComponent(shareData.title);
          const emailBody = encodeURIComponent(`${shareData.summary}\n\nDetalhes:\n${locations.map(loc => 
            `• ${loc.nome_local}\n  ${formatAddress(loc)}\n  ${loc.telefone ? formatPhoneNumber(loc.telefone) : 'Telefone não informado'}\n  ${loc.available_slots_count} horário${loc.available_slots_count !== 1 ? 's' : ''} disponível${loc.available_slots_count !== 1 ? 'eis' : ''}\n`
          ).join('\n')}\n\n${shareData.url || ''}`);
          window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_blank');
          break;

        case 'sms':
          const smsText = encodeURIComponent(`${shareData.title}\n${shareData.summary}\n${shareData.url || ''}`);
          window.open(`sms:?body=${smsText}`, '_blank');
          break;
      }

      toast({
        title: "Compartilhado!",
        description: "Comparação compartilhada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar a comparação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [locations, comparisonSummary]);

  // Handle saving comparison
  const handleSaveComparison = useCallback(() => {
    if (!comparisonName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a comparação.",
        variant: "destructive"
      });
      return;
    }

    const comparisonData: ComparisonData = {
      id: `comparison_${Date.now()}`,
      name: comparisonName.trim(),
      locations,
      criteria,
      createdAt: new Date().toISOString(),
      notes: comparisonNotes.trim() || undefined
    };

    if (onSaveComparison) {
      onSaveComparison(comparisonData);
      toast({
        title: "Comparação salva!",
        description: `A comparação "${comparisonName}" foi salva com sucesso.`,
      });
      setShowSaveDialog(false);
      setComparisonName('');
      setComparisonNotes('');
    }
  }, [comparisonName, comparisonNotes, locations, criteria, onSaveComparison]);

  // Export comparison as JSON
  const handleExportComparison = useCallback(() => {
    const exportData = {
      title: `Comparação de Estabelecimentos - ${new Date().toLocaleDateString('pt-BR')}`,
      locations: locations.map(loc => ({
        nome: loc.nome_local,
        endereco: formatAddress(loc),
        telefone: loc.telefone ? formatPhoneNumber(loc.telefone) : null,
        status: getLocationStatusLabel(loc.status),
        horarios_disponiveis: loc.available_slots_count,
        aberto_agora: loc.is_open_now,
        facilidades: loc.facilidades.filter(f => f.available).map(f => f.type),
        distancia_km: loc.distance_km
      })),
      criterios: criteria,
      gerado_em: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparacao-estabelecimentos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado!",
      description: "Comparação exportada como arquivo JSON.",
    });
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
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Building className="h-5 w-5 text-orange-600" />
            Comparação de Estabelecimentos
          </CardTitle>
          
          {/* Enhanced Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'standard' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('standard')}
                className="h-8 px-3"
              >
                <Building className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Padrão</span>
              </Button>
              <Button
                variant={viewMode === 'advanced' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('advanced')}
                className="h-8 px-3"
              >
                <Zap className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Avançado</span>
              </Button>
            </div>

            {/* Criteria Configuration */}
            <ComparisonCriteriaConfig
              criteria={criteria}
              onCriteriaChange={setCriteria}
            />

            {/* Export and Share */}
            <ComparisonExportShare
              locations={locations}
              comparisonTitle="Comparação de Estabelecimentos"
            />

            {/* Save Comparison Button */}
            {onSaveComparison && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {comparisonSummary}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Render Advanced or Standard View */}
        {viewMode === 'advanced' ? (
          <AdvancedLocationComparison
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationSelect={onLocationSelect}
            onSaveComparison={onSaveComparison}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Critério</TableHead>
                {locations.map((location) => (
                  <TableHead key={location.id} className="min-w-64">
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-900 text-base">
                        {location.nome_local}
                      </div>
                      <ComparisonStatusBadge location={location} />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {/* Address - Always shown */}
              <ComparisonRow label="Endereço" icon={MapPin}>
                {locations.map((location) => (
                  <TableCell key={location.id} className="align-top">
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {formatAddress(location)}
                    </div>
                  </TableCell>
                ))}
              </ComparisonRow>

              {/* Phone - Conditional based on criteria */}
              {criteria.showContact && (
                <ComparisonRow label="Telefone" icon={Phone}>
                  {locations.map((location) => (
                    <TableCell key={location.id} className="align-top">
                      {location.telefone ? (
                        <div className="text-sm text-gray-700">
                          {formatPhoneNumber(location.telefone)}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Não informado</span>
                      )}
                    </TableCell>
                  ))}
                </ComparisonRow>
              )}

              {/* Operating Hours - Conditional based on criteria */}
              {criteria.showHours && (
                <ComparisonRow label="Horário Hoje" icon={Clock}>
                  {locations.map((location) => (
                    <TableCell key={location.id} className="align-top">
                      <OperatingHoursComparison location={location} />
                    </TableCell>
                  ))}
                </ComparisonRow>
              )}

              {/* Availability - Conditional based on criteria */}
              {criteria.showAvailability && (
                <ComparisonRow label="Disponibilidade" icon={Calendar}>
                  {locations.map((location) => (
                    <TableCell key={location.id} className="align-top">
                      <AvailabilityComparison location={location} />
                    </TableCell>
                  ))}
                </ComparisonRow>
              )}

              {/* Distance - Conditional based on criteria */}
              {criteria.showDistance && (
                <ComparisonRow label="Distância" icon={Navigation}>
                  {locations.map((location) => (
                    <TableCell key={location.id} className="align-top">
                      <DistanceComparison location={location} />
                    </TableCell>
                  ))}
                </ComparisonRow>
              )}

              {/* Facilities - Conditional based on criteria */}
              {criteria.showFacilities && (
                <ComparisonRow label="Facilidades" icon={Building}>
                  {locations.map((location) => (
                    <TableCell key={location.id} className="align-top">
                      {location.facilidades.length > 0 ? (
                        <LocationFacilities 
                          facilities={location.facilidades}
                          compact={true}
                          maxVisible={4}
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">Nenhuma informada</span>
                      )}
                    </TableCell>
                  ))}
                </ComparisonRow>
              )}

              {/* Enhanced Comparison Score Row */}
              <ComparisonRow label="Pontuação" icon={Star} className="bg-yellow-50">
                {locations.map((location) => (
                  <TableCell key={location.id} className="align-top">
                    <ComparisonScore location={location} criteria={criteria} />
                  </TableCell>
                ))}
              </ComparisonRow>

              {/* Actions */}
              <ComparisonRow label="Ações" icon={CheckCircle2} className="border-t-2 border-gray-200">
                {locations.map((location) => (
                  <TableCell key={location.id} className="align-top py-4">
                    <ComparisonActions
                      location={location}
                      isSelected={selectedLocation === location.id}
                      onSelect={() => onLocationSelect(location.id)}
                    />
                  </TableCell>
                ))}
              </ComparisonRow>
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>

      {/* Save Comparison Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Salvar Comparação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nome da Comparação *
                </label>
                <input
                  type="text"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  placeholder="Ex: Clínicas Centro da Cidade"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notas (opcional)
                </label>
                <textarea
                  value={comparisonNotes}
                  onChange={(e) => setComparisonNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta comparação..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveComparison}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default LocationComparison;