import React, { useState, useCallback } from 'react';
import { 
  Navigation, 
  Phone, 
  Share2, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Mail,
  Copy,
  MapPin
} from 'lucide-react';
import { useLocationAccessibility, useKeyboardNavigation } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';
import { 
  LocationWithTimeSlots, 
  LocationContact,
  LocationShareData,
  EnhancedLocation
} from '@/types/location';
import { 
  generateWhatsAppUrl,
  generateLocationShareMessage,
  formatPhoneNumber
} from '@/utils/locationUtils';
import { mapsService, MapsProvider } from '@/services/mapsService';
import { CommunicationService, ShareLocationData } from '@/services/communicationService'; // replaced by kiro @2025-01-08T15:30:00Z
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

// Types for action states
type ActionState = 'idle' | 'loading' | 'success' | 'error';

interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

interface LocationActionsProps {
  location: LocationWithTimeSlots;
  appointmentTime?: string;
  compact?: boolean;
  showLabels?: boolean;
  showDirections?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onActionStart?: (action: string) => void;
  onActionComplete?: (action: string, result: ActionResult) => void;
}

interface ActionButtonProps {
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  label: string;
  onClick: () => void;
  state: ActionState;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

// Action button component with loading states
const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  state,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className
}) => {
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </>
      );
    }

    if (isSuccess) {
      return (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="ml-2">Sucesso!</span>
        </>
      );
    }

    if (isError) {
      return (
        <>
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="ml-2">Erro</span>
        </>
      );
    }

    return (
      <>
        <Icon className="h-4 w-4" />
        <span className="ml-2">{label}</span>
      </>
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "transition-all duration-200",
        isSuccess && "border-green-500 bg-green-50 text-green-700",
        isError && "border-red-500 bg-red-50 text-red-700",
        className
      )}
      aria-label={label}
    >
      {getButtonContent()}
    </Button>
  );
};

// Maps integration component with enhanced functionality
const MapsAction: React.FC<{
  location: LocationWithTimeSlots;
  onActionStart?: (action: string) => void;
  onActionComplete?: (action: string, result: ActionResult) => void;
  compact?: boolean;
  showDirections?: boolean;
}> = ({ location, onActionStart, onActionComplete, compact, showDirections = false }) => {
  const [state, setState] = useState<ActionState>('idle');
  const [directionsState, setDirectionsState] = useState<ActionState>('idle');

  const handleViewMap = useCallback(async () => {
    try {
      setState('loading');
      onActionStart?.('view_map');

      const result = await mapsService.openLocation(location, {
        newWindow: true,
        fallbackOnError: true
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setState('success');
      
      const actionResult: ActionResult = {
        success: true,
        message: `Localização aberta no ${result.provider}`
      };
      
      onActionComplete?.('view_map', actionResult);
      
      toast({
        title: "Mapa aberto",
        description: `A localização foi aberta no ${result.provider}.`,
      });

      // Reset state after success feedback
      setTimeout(() => setState('idle'), 2000);

    } catch (error) {
      setState('error');
      
      const actionResult: ActionResult = {
        success: false,
        message: 'Erro ao abrir mapa',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      onActionComplete?.('view_map', actionResult);
      
      toast({
        title: "Erro ao abrir mapa",
        description: "Não foi possível abrir o aplicativo de mapas. Tente novamente.",
        variant: "destructive",
      });

      // Reset state after error feedback
      setTimeout(() => setState('idle'), 3000);
    }
  }, [location, onActionStart, onActionComplete]);

  const handleDirections = useCallback(async () => {
    try {
      setDirectionsState('loading');
      onActionStart?.('directions');

      const result = await mapsService.openDirections(location, {
        newWindow: true,
        fallbackOnError: true
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setDirectionsState('success');
      
      const actionResult: ActionResult = {
        success: true,
        message: `Direções abertas no ${result.provider}`
      };
      
      onActionComplete?.('directions', actionResult);
      
      toast({
        title: "Direções abertas",
        description: `Navegação iniciada no ${result.provider}.`,
      });

      // Reset state after success feedback
      setTimeout(() => setDirectionsState('idle'), 2000);

    } catch (error) {
      setDirectionsState('error');
      
      const actionResult: ActionResult = {
        success: false,
        message: 'Erro ao abrir direções',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      onActionComplete?.('directions', actionResult);
      
      toast({
        title: "Erro ao abrir direções",
        description: "Não foi possível abrir as direções. Tente novamente.",
        variant: "destructive",
      });

      // Reset state after error feedback
      setTimeout(() => setDirectionsState('idle'), 3000);
    }
  }, [location, onActionStart, onActionComplete]);

  if (showDirections) {
    return (
      <div className="flex gap-2">
        <ActionButton
          icon={MapPin}
          label={compact ? "Mapa" : "Ver no Mapa"}
          onClick={handleViewMap}
          state={state}
          variant="outline"
          size={compact ? "sm" : "default"}
        />
        <ActionButton
          icon={Navigation}
          label={compact ? "Direções" : "Como Chegar"}
          onClick={handleDirections}
          state={directionsState}
          variant="outline"
          size={compact ? "sm" : "default"}
        />
      </div>
    );
  }

  return (
    <ActionButton
      icon={Navigation}
      label={compact ? "Mapa" : "Ver no Mapa"}
      onClick={handleViewMap}
      state={state}
      variant="outline"
    />
  );
};

// Phone call component
const CallAction: React.FC<{
  location: LocationWithTimeSlots;
  onActionStart?: (action: string) => void;
  onActionComplete?: (action: string, result: ActionResult) => void;
  compact?: boolean;
}> = ({ location, onActionStart, onActionComplete, compact }) => {
  const [state, setState] = useState<ActionState>('idle');

  const handleCall = useCallback(async () => {
    if (!location.telefone) {
      toast({
        title: "Telefone não disponível",
        description: "Este estabelecimento não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      setState('loading');
      onActionStart?.('call');

      const result = await CommunicationService.makePhoneCall(location.telefone);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setState('success');
      
      const actionResult: ActionResult = {
        success: true,
        message: result.message || 'Chamada iniciada'
      };
      
      onActionComplete?.('call', actionResult);
      
      toast({
        title: "Chamada iniciada",
        description: `Ligando para ${formatPhoneNumber(location.telefone)}`,
      });

      setTimeout(() => setState('idle'), 2000);

    } catch (error) {
      setState('error');
      
      const actionResult: ActionResult = {
        success: false,
        message: 'Erro ao iniciar chamada',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      onActionComplete?.('call', actionResult);
      
      toast({
        title: "Erro ao ligar",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a chamada.",
        variant: "destructive",
      });

      setTimeout(() => setState('idle'), 3000);
    }
  }, [location, onActionStart, onActionComplete]);

  if (!location.telefone) {
    return null;
  }

  return (
    <ActionButton
      icon={Phone}
      label={compact ? "Ligar" : "Ligar"}
      onClick={handleCall}
      state={state}
      variant="outline"
    />
  );
};

// Share action component with multiple options
const ShareAction: React.FC<{
  location: LocationWithTimeSlots;
  appointmentTime?: string;
  onActionStart?: (action: string) => void;
  onActionComplete?: (action: string, result: ActionResult) => void;
  compact?: boolean;
}> = ({ location, appointmentTime, onActionStart, onActionComplete, compact }) => {
  const [state, setState] = useState<ActionState>('idle');

  const prepareShareData = useCallback((): ShareLocationData => {
    // Convert LocationWithTimeSlots to the format expected by CommunicationService
    const enhancedLocation: EnhancedLocation = {
      id: location.id,
      nome_local: location.nome_local,
      endereco_completo: location.endereco_completo,
      bairro: location.bairro,
      cidade: location.cidade,
      estado: location.estado,
      cep: location.cep,
      telefone: location.telefone,
      whatsapp: location.whatsapp,
      email: location.email,
      website: location.website,
      coordenadas: location.coordenadas,
      horario_funcionamento: location.horario_funcionamento,
      facilidades: location.facilidades,
      status: location.status,
      motivo_fechamento: location.motivo_fechamento,
      previsao_reabertura: location.previsao_reabertura,
      horarios_disponiveis: location.horarios_disponiveis,
      ultima_atualizacao: location.ultima_atualizacao,
      verificado_em: location.verificado_em,
      fonte_dados: location.fonte_dados,
      descricao: location.descricao,
      instrucoes_acesso: location.instrucoes_acesso,
      observacoes_especiais: location.observacoes_especiais
    };

    return {
      location: enhancedLocation,
      appointmentTime
    };
  }, [location, appointmentTime]);

  const handleShare = useCallback(async (method: 'system' | 'whatsapp' | 'email' | 'sms') => {
    try {
      setState('loading');
      onActionStart?.(`share_${method}`);

      const shareData = prepareShareData();
      let result;

      switch (method) {
        case 'system':
          result = await CommunicationService.shareViaSystem(shareData);
          break;
        case 'whatsapp':
          result = await CommunicationService.shareViaWhatsApp(shareData);
          break;
        case 'email':
          result = await CommunicationService.shareViaEmail(shareData);
          break;
        case 'sms':
          result = await CommunicationService.shareViaSMS(shareData);
          break;
        default:
          throw new Error('Método de compartilhamento não suportado');
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      setState('success');
      
      const actionResult: ActionResult = {
        success: true,
        message: result.message || 'Compartilhado com sucesso'
      };
      
      onActionComplete?.(`share_${method}`, actionResult);
      
      toast({
        title: "Compartilhado com sucesso",
        description: result.message,
      });

      setTimeout(() => setState('idle'), 2000);

    } catch (error) {
      setState('error');
      
      const actionResult: ActionResult = {
        success: false,
        message: 'Erro ao compartilhar',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      onActionComplete?.(`share_${method}`, actionResult);
      
      toast({
        title: "Erro ao compartilhar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });

      setTimeout(() => setState('idle'), 3000);
    }
  }, [prepareShareData, onActionStart, onActionComplete]);

  // Simple share button for compact mode
  if (compact) {
    return (
      <ActionButton
        icon={Share2}
        label="Compartilhar"
        onClick={() => handleShare('system')}
        state={state}
        variant="outline"
      />
    );
  }

  // Dropdown with multiple share options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={state === 'loading'}>
          {state === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {CommunicationService.supportsNativeSharing() && (
          <>
            <DropdownMenuItem onClick={() => handleShare('system')}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>

        {CommunicationService.canSendSMS() && (
          <DropdownMenuItem onClick={() => handleShare('sms')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            SMS
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Main LocationActions component with enhanced accessibility
export const LocationActions: React.FC<LocationActionsProps> = ({
  location,
  appointmentTime,
  compact = false,
  showLabels = true,
  showDirections = false,
  orientation = 'horizontal',
  className,
  onActionStart,
  onActionComplete
}) => {
  const { 
    isHighContrast,
    reducedMotion,
    isTouchDevice,
    getAccessibleStyles 
  } = useLocationAccessibility();

  const { containerRef } = useKeyboardNavigation(
    (index: number) => {
      // Handle keyboard activation of action buttons
      const buttons = containerRef.current?.querySelectorAll('button:not([disabled])');
      if (buttons && buttons[index]) {
        (buttons[index] as HTMLButtonElement).click();
      }
    },
    {
      orientation: orientation === 'vertical' ? 'vertical' : 'horizontal',
      wrap: true,
      homeEndKeys: true
    }
  );

  const containerClasses = cn(
    "flex gap-2",
    orientation === 'vertical' ? "flex-col" : "flex-row",
    compact && orientation === 'horizontal' && "flex-wrap",
    // Enhanced touch targets for mobile
    isTouchDevice && "gap-3",
    className
  );

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className={containerClasses}
        style={getAccessibleStyles}
        role="group"
        aria-label={`Ações para ${location.nome_local}`}
        aria-describedby={`location-${location.id}-actions-help`}
      >
        {/* Hidden help text for screen readers */}
        <div 
          id={`location-${location.id}-actions-help`}
          className="sr-only"
        >
          Use as setas do teclado para navegar entre as ações. Pressione Enter ou Espaço para ativar uma ação.
        </div>
        {/* Maps Action */}
        <MapsAction
          location={location}
          onActionStart={onActionStart}
          onActionComplete={onActionComplete}
          compact={compact}
          showDirections={showDirections}
        />

        {/* Call Action */}
        <CallAction
          location={location}
          onActionStart={onActionStart}
          onActionComplete={onActionComplete}
          compact={compact}
        />

        {/* Share Action */}
        <ShareAction
          location={location}
          appointmentTime={appointmentTime}
          onActionStart={onActionStart}
          onActionComplete={onActionComplete}
          compact={compact}
        />

        {/* Website Link (if available) */}
        {location.website && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => window.open(location.website, '_blank')}
                aria-label="Visitar site"
              >
                <ExternalLink className="h-4 w-4" />
                {!compact && showLabels && <span className="ml-2">Site</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visitar site do estabelecimento</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

// Specialized variants
export const LocationActionsCompact: React.FC<Omit<LocationActionsProps, 'compact'>> = (props) => (
  <LocationActions {...props} compact={true} />
);

export const LocationActionsVertical: React.FC<Omit<LocationActionsProps, 'orientation'>> = (props) => (
  <LocationActions {...props} orientation="vertical" />
);

// Hook for managing action states
export const useLocationActions = (location: LocationWithTimeSlots) => {
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [lastResults, setLastResults] = useState<Record<string, ActionResult>>({});

  const handleActionStart = useCallback((action: string) => {
    setActionStates(prev => ({ ...prev, [action]: 'loading' }));
  }, []);

  const handleActionComplete = useCallback((action: string, result: ActionResult) => {
    setActionStates(prev => ({ 
      ...prev, 
      [action]: result.success ? 'success' : 'error' 
    }));
    setLastResults(prev => ({ ...prev, [action]: result }));

    // Reset state after feedback period
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [action]: 'idle' }));
    }, result.success ? 2000 : 3000);
  }, []);

  return {
    actionStates,
    lastResults,
    handleActionStart,
    handleActionComplete
  };
};

export default LocationActions;