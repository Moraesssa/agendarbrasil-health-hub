# Components Documentation

## Overview

This document provides detailed information about the custom components used in the AgendarBrasil Health Hub application.

## Build Optimization for Components

### Component Loading Strategy

Os componentes são otimizados para carregamento eficiente através da configuração de build:

**Chunking Strategy:**
- **Core Components**: Componentes críticos (AuthContext, SupabaseConfigWarning) permanecem no chunk principal
- **UI Components**: Componentes shadcn/ui são agrupados no chunk `ui-vendor`
- **Feature Components**: Componentes específicos de funcionalidades são carregados sob demanda

**Import Optimization:**
```typescript
// ✅ Otimizado - Import específico
import { Button } from '@/components/ui/button';

// ❌ Evitar - Import de barrel que pode aumentar bundle
import { Button, Card, Dialog } from '@/components/ui';
```

**Lazy Loading Pattern:**
```typescript
// Para componentes grandes ou raramente usados
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

// Uso com Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

## Authentication System Components

### useAuthInitialization Hook

O hook `useAuthInitialization` é um componente crítico do sistema de autenticação que garante a inicialização adequada dos módulos de autenticação antes da renderização da aplicação principal.

#### Propósito
- Verificar a integridade dos módulos de autenticação durante a inicialização
- Fornecer estados de carregamento e erro para feedback ao usuário
- Implementar recuperação automática em caso de falhas críticas
- Prevenir renderização da aplicação com sistema de autenticação quebrado

#### Interface
```typescript
interface AuthInitializationResult {
  isAuthReady: boolean;      // Estado de prontidão da autenticação
  initError: string | null;  // Mensagem de erro caso ocorra falha
}

export const useAuthInitialization = (): AuthInitializationResult
```

#### Funcionalidades Principais

**Verificação de Módulos:**
- Importação dinâmica do `@/contexts/AuthContext`
- Validação se `useAuth` está exportado como função
- Validação se `AuthProvider` está exportado como função
- Detecção de problemas de importação circular

**Tratamento de Erros:**
- Captura de erros durante importação de módulos
- Logging detalhado de erros para debugging
- Mensagens de erro em português para usuários finais
- Recuperação automática via recarregamento da página

**Estados de Inicialização:**
- `isAuthReady: false` - Inicialização em progresso
- `isAuthReady: true` - Autenticação pronta para uso
- `initError: string` - Erro crítico detectado

#### Exemplo de Implementação

**Uso Básico:**
```tsx
import { useAuthInitialization } from '@/hooks/useAuthInitialization';

function App() {
  const { isAuthReady, initError } = useAuthInitialization();

  // Exibir erro crítico
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-800">
              Erro de Inicialização
            </h2>
          </div>
          <p className="text-red-700 mb-4">{initError}</p>
          <p className="text-sm text-red-600">
            A página será recarregada automaticamente em alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  // Exibir carregamento
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Inicializando sistema de autenticação...</p>
        </div>
      </div>
    );
  }

  // Renderizar aplicação principal
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
```

**Uso Avançado com Retry Manual:**
```tsx
function AppWithRetry() {
  const { isAuthReady, initError } = useAuthInitialization();
  const [retryCount, setRetryCount] = useState(0);

  const handleManualRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  if (initError) {
    return (
      <div className="error-container">
        <h2>Erro de Inicialização</h2>
        <p>{initError}</p>
        <p>Tentativas: {retryCount}</p>
        <Button onClick={handleManualRetry} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // ... resto da implementação
}
```

#### Integração com Sistema de Monitoramento

**Logging de Erros:**
```tsx
useEffect(() => {
  if (initError) {
    // Enviar erro para sistema de monitoramento
    console.error('Auth initialization failed:', {
      error: initError,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Opcional: enviar para serviço de analytics
    // analytics.track('auth_initialization_error', { error: initError });
  }
}, [initError]);
```

#### Dependências
- `React` - useState, useEffect hooks
- `@/contexts/AuthContext` - Módulo de autenticação (importação dinâmica)

#### Casos de Uso Comuns
1. **Aplicação Principal**: Garantir autenticação antes de renderizar rotas
2. **Páginas Protegidas**: Verificar integridade antes de acessar contexto de auth
3. **Desenvolvimento**: Detectar problemas de configuração rapidamente
4. **Produção**: Recuperação automática de falhas temporárias

#### Considerações de Performance
- **Importação Dinâmica**: Evita problemas de dependência circular
- **Execução Única**: useEffect com array de dependências vazio
- **Recuperação Rápida**: Timeout de 2 segundos para recarregamento
- **Estados Mínimos**: Apenas dois estados booleanos para eficiência

#### Troubleshooting

**Problemas Comuns:**
1. **"useAuth is not properly exported"**: Verificar exportação no AuthContext
2. **"AuthProvider is not properly exported"**: Verificar exportação do provider
3. **Recarregamento infinito**: Problema persistente no AuthContext
4. **Importação circular**: Reorganizar estrutura de imports

**Soluções:**
```typescript
// AuthContext.tsx - Estrutura correta de exportação
export const useAuth = () => {
  // implementação do hook
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // implementação do provider
};

// Exportação padrão opcional
export default { useAuth, AuthProvider };
```

## System Components

### Location Refresh Manager Integration

Os componentes do sistema integram-se com o Location Refresh Manager para garantir dados de localização sempre atualizados.

#### Padrões de Integração

**Refresh Automático em Componentes de Localização:**
```tsx
import { locationRefreshManager } from '@/utils/locationRefreshManager';

const LocationCard = ({ location }: { location: EnhancedLocation }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refresh automático quando dados estão desatualizados
  useEffect(() => {
    const lastUpdate = new Date(location.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24) {
      locationRefreshManager.refreshLocation(location.id, 'background');
    }
  }, [location.id, location.lastUpdated]);
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const taskId = locationRefreshManager.forceRefresh(location.id);
      
      toast({
        title: "Atualizando dados",
        description: "Informações da localização estão sendo atualizadas...",
        variant: "default"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{location.nome_local}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {/* Resto do componente */}
    </Card>
  );
};
```

**Monitoramento de Estatísticas:**
```tsx
const RefreshStatsDisplay = () => {
  const [stats, setStats] = useState<RefreshStats | null>(null);
  
  useEffect(() => {
    const updateStats = () => {
      setStats(locationRefreshManager.getStats());
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000); // Atualiza a cada 5 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.successfulRefreshes}</div>
          <div className="text-sm text-muted-foreground">Atualizações bem-sucedidas</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.activeRefreshes}</div>
          <div className="text-sm text-muted-foreground">Atualizações ativas</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{Math.round(stats.averageRefreshTime)}ms</div>
          <div className="text-sm text-muted-foreground">Tempo médio</div>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Refresh Preventivo em Listas de Localização:**
```tsx
const LocationList = ({ locations }: { locations: EnhancedLocation[] }) => {
  useEffect(() => {
    // Identifica localizações populares (com mais interações)
    const popularLocations = locations
      .filter(loc => loc.interactionCount > 10)
      .map(loc => loc.id);
    
    if (popularLocations.length > 0) {
      refreshUtils.prefreshPopularLocations(popularLocations);
    }
  }, [locations]);
  
  return (
    <div className="space-y-4">
      {locations.map(location => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
};
```

**Tratamento de Erros de Refresh:**
```tsx
const useLocationRefreshError = () => {
  useEffect(() => {
    const handleRefreshError = (error: any) => {
      toast({
        title: "Erro na atualização",
        description: "Não foi possível atualizar os dados da localização. Tentando novamente...",
        variant: "destructive"
      });
    };
    
    // Listener para erros de refresh (implementação dependente do sistema de eventos)
    // locationRefreshManager.on('error', handleRefreshError);
    
    return () => {
      // locationRefreshManager.off('error', handleRefreshError);
    };
  }, []);
};
```

### SupabaseConfigWarning

A critical system component that provides user-friendly feedback when database configuration is missing or incorrect.

### Maps Integration Components

Os componentes de integração com mapas utilizam o `mapsService` para fornecer funcionalidades de visualização, navegação e compartilhamento de localizações.

#### LocationActions Component

Componente que fornece ações relacionadas a mapas e comunicação para estabelecimentos de saúde, integrando tanto o Maps Service quanto o Communication Service.

**Funcionalidades:**
- **Ver no Mapa**: Abre a localização no aplicativo de mapas preferido do usuário
- **Ligar**: Inicia chamada telefônica para o estabelecimento com fallback inteligente
- **Compartilhar**: Compartilha informações da localização via múltiplos canais

**Integração com Maps Service e Communication Service:**
```tsx
import { mapsService } from '@/services/mapsService';
import { CommunicationService } from '@/services/communicationService';

const handleViewOnMap = async () => {
  const result = await mapsService.openLocation(location, {
    newWindow: true,
    fallbackOnError: true
  });
  
  if (!result.success) {
    toast({
      title: "Erro ao abrir mapa",
      description: result.error,
      variant: "destructive"
    });
  }
};

const handlePhoneCall = async () => {
  const result = await CommunicationService.makePhoneCall(location.telefone, {
    fallbackToWhatsApp: true,
    showConfirmation: false
  });
  
  if (!result.success) {
    toast({
      title: "Erro ao fazer ligação",
      description: result.error,
      variant: "destructive"
    });
  } else if (result.fallbackUsed) {
    toast({
      title: "WhatsApp aberto",
      description: "Não foi possível fazer ligação direta, WhatsApp foi aberto como alternativa",
      variant: "default"
    });
  }
};

const handleShare = async () => {
  // Tenta compartilhamento via sistema primeiro
  const systemResult = await CommunicationService.shareViaSystem({
    location,
    appointmentDate: selectedDate,
    appointmentTime: selectedTime,
    doctorName: selectedDoctor?.nome,
    patientName: user?.nome
  }, {
    includeDirections: true,
    includeOperatingHours: true,
    includeFacilities: true
  });
  
  // Se falhar, oferece alternativas
  if (!systemResult.success) {
    // Fallback para WhatsApp
    await CommunicationService.shareViaWhatsApp({
      location,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime
    }, {
      includeDirections: true,
      format: 'detailed'
    });
  }
};
```

**Propriedades:**
```typescript
interface LocationActionsProps {
  location: EnhancedLocation;
  appointmentData?: {
    date?: string;
    time?: string;
    doctorName?: string;
    patientName?: string;
    specialty?: string;
  };
  showMapButton?: boolean;
  showCallButton?: boolean;
  showShareButton?: boolean;
  onActionComplete?: (action: string, success: boolean) => void;
}
```

**Funcionalidades Avançadas:**
- **Fallback Inteligente**: Chamadas telefônicas com fallback automático para WhatsApp
- **Compartilhamento Adaptativo**: Usa Web Share API quando disponível, senão oferece alternativas
- **Formatação Rica**: Mensagens formatadas com informações completas da consulta
- **Tratamento de Erros**: Feedback claro para o usuário em caso de falhas
- **Detecção de Plataforma**: Comportamento otimizado para mobile e desktop

### TimeSlotButton

Um componente avançado para exibição e seleção de horários de agendamento, com suporte completo a informações de localização e estados visuais aprimorados.

#### Propósito
- Exibir horários disponíveis para agendamento de consultas
- Fornecer feedback visual sobre disponibilidade e seleção
- Integrar informações de localização com códigos de cores consistentes
- Oferecer tooltips informativos com detalhes do estabelecimento
- Suportar filtragem por localização com estados visuais apropriados

#### Propriedades
```typescript
interface TimeSlotButtonProps {
  time: string;                    // Horário no formato HH:MM
  available: boolean;              // Disponibilidade do horário
  selected: boolean;               // Estado de seleção atual
  disabled?: boolean;              // Estado desabilitado opcional
  onClick: () => void;             // Função callback para clique
  locationId?: string;             // Identificador único da localização
  locationName?: string;           // Nome do estabelecimento
  showLocationBadge?: boolean;     // Controla exibição do badge de localização
  isLocationFiltered?: boolean;    // Indica se filtro por localização está ativo
  className?: string;              // Classes CSS adicionais
}
```

#### Funcionalidades Principais

**Estados Visuais:**
- **Disponível**: Botão branco com borda cinza, hover com cores da localização
- **Selecionado**: Gradiente laranja com borda destacada e anel de foco
- **Indisponível**: Opacidade reduzida, texto riscado, cursor desabilitado
- **Filtrado**: Opacidade reduzida quando não corresponde ao filtro de localização

**Sistema de Cores por Localização:**
- Atribuição automática de cores baseada em hash do ID da localização
- Paleta de 6 cores (azul, verde, roxo, rosa, índigo, teal)
- Consistência visual entre badges e estados de hover
- Cores acessíveis com contraste adequado

**Indicadores Visuais:**
- **Ícone de Relógio**: Presente em todos os botões para identificação rápida
- **Badge de Localização**: Ícone de prédio no canto superior direito
- **Indicador de Seleção**: CheckCircle2 no canto superior direito quando selecionado
- **Tooltip Informativo**: Detalhes da localização e horário ao passar o mouse

#### Exemplo de Uso
```tsx
import { TimeSlotButton } from '@/components/scheduling/TimeSlotButton';

function TimeSlotGrid() {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {timeSlots.map((slot) => (
        <TimeSlotButton
          key={slot.time}
          time={slot.time}
          available={slot.available}
          selected={selectedTime === slot.time}
          onClick={() => setSelectedTime(slot.time)}
          locationId={slot.locationId}
          locationName={slot.locationName}
          showLocationBadge={true}
          isLocationFiltered={locationFilter !== null}
        />
      ))}
    </div>
  );
}
```

#### Dependências
- `@/components/ui/button` - Componente base de botão do shadcn/ui
- `@/components/ui/badge` - Badge para indicadores de localização
- `@/components/ui/tooltip` - Sistema de tooltips informativos
- `@/lib/utils` - Utilitário cn para combinação de classes CSS
- `lucide-react` - Ícones Clock, Building e CheckCircle2
- `React` - Hooks e funcionalidades core do React

#### Algoritmos Internos

**Geração de Cores por Localização:**
```typescript
const getLocationColor = (locationId: string): string => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200', 
    // ... outras cores
  ];
  
  // Função hash simples para atribuição consistente
  let hash = 0;
  for (let i = 0; i < locationId.length; i++) {
    hash = ((hash << 5) - hash + locationId.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
};
```

**Estilização Condicional:**
- Lógica complexa de classes CSS baseada em múltiplos estados
- Transições suaves com `transition-all duration-200`
- Efeitos de hover com `hover:shadow-md hover:scale-105`
- Estados de foco acessíveis com `ring-2 ring-orange-300`

#### Acessibilidade
- **ARIA Labels**: Descrições completas incluindo horário, disponibilidade e localização
- **Navegação por Teclado**: Suporte completo a navegação via teclado
- **Contraste de Cores**: Todas as combinações de cores atendem aos padrões WCAG
- **Estados de Foco**: Indicadores visuais claros para navegação por teclado
- **Tooltips Acessíveis**: Informações adicionais disponíveis via screen readers

#### Integração com Sistema de Localização
- Suporte a filtragem por localização com feedback visual
- Badges coloridos para identificação rápida de estabelecimentos
- Tooltips com informações detalhadas da localização
- Estados desabilitados quando localização não corresponde ao filtro ativo

#### Casos de Uso
1. **Grade de Horários**: Exibição de múltiplos horários em layout de grade
2. **Seleção de Horário**: Interface para escolha de horário específico
3. **Comparação de Localizações**: Visualização de horários por estabelecimento
4. **Filtragem por Local**: Destaque de horários de localização específica
5. **Confirmação de Agendamento**: Exibição do horário selecionado

#### Purpose
- Alerts developers and users when Supabase environment variables are not properly configured
- Provides clear, actionable instructions for resolving configuration issues
- Prevents confusion when the application cannot connect to the database

#### Props
```typescript
interface SupabaseConfigWarningProps {
  show: boolean; // Controls component visibility based on database connection status
}
```

#### Features
- **Conditional Rendering**: Only displays when `show` prop is `true`
- **Destructive Alert Styling**: Uses red/warning colors for high visibility
- **Multilingual Support**: All text content is in Portuguese for Brazilian users
- **Step-by-step Instructions**: Provides numbered list of configuration steps
- **Reference Documentation**: Points users to `.env.example` file for proper format

#### Usage Example
```tsx
import { SupabaseConfigWarning } from '@/components/SupabaseConfigWarning';

function App() {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  
  // Check database connection status
  useEffect(() => {
    checkDatabaseConnection().then(setIsDatabaseConnected);
  }, []);

  return (
    <div>
      <SupabaseConfigWarning show={!isDatabaseConnected} />
      {/* Rest of application */}
    </div>
  );
}
```

#### Dependencies
- `@/components/ui/alert` - Base Alert components from shadcn/ui
- `lucide-react` - AlertTriangle icon for visual emphasis
- `React` - Core React functionality

#### Configuration Instructions Provided
1. Configure Supabase environment variables in `.env` file
2. Set `VITE_SUPABASE_URL` with project URL
3. Set `VITE_SUPABASE_ANON_KEY` with public key
4. Restart development server
5. Reference `.env.example` for proper format

#### Styling
- Uses `Alert` component with `variant="destructive"` for error styling
- Includes `mb-6` margin for proper spacing
- Uses `AlertTriangle` icon with `h-4 w-4` sizing
- Structured content with ordered list for clear instructions
- Code formatting for environment variable names

#### Integration Points
This component is typically used in:
- Application root components
- Dashboard layouts
- Any component that requires database connectivity
- Development environment setup flows

## UI Foundation Components

The application uses shadcn/ui components as the foundation for consistent styling and behavior:

### Alert Components
- `Alert`: Base alert container with variant support
- `AlertTitle`: Styled title for alert messages
- `AlertDescription`: Content area for detailed alert information

### Loading Components

#### LoadingSpinner

A reusable loading spinner component that provides consistent loading states across the application.

**Purpose:**
- Standardize loading UI patterns
- Reduce code duplication
- Provide consistent user experience during async operations

**Props:**
```typescript
interface LoadingSpinnerProps {
  message?: string;        // Custom loading message (default: "Carregando...")
  className?: string;      // Additional CSS classes
  size?: 'sm' | 'md' | 'lg'; // Spinner size (default: 'md')
}
```

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Basic usage
<LoadingSpinner />

// With custom message
<LoadingSpinner message="Configurando perfil..." />

// Different sizes
<LoadingSpinner size="lg" message="Processando..." />
```

**Features:**
- Responsive design with gradient background
- Configurable spinner sizes (sm: 6x6, md: 8x8, lg: 12x12)
- Smooth animations with CSS transitions
- Consistent styling with application theme

### Common Variants
- `default`: Standard informational alerts
- `destructive`: Error and warning alerts (used by SupabaseConfigWarning)

## Communication Service Integration Patterns

### Phone Call Integration

Todos os componentes que oferecem funcionalidade de chamada telefônica devem implementar o padrão de fallback inteligente:

```tsx
import { CommunicationService } from '@/services/communicationService';

const handlePhoneCall = async (phoneNumber: string) => {
  try {
    const result = await CommunicationService.makePhoneCall(phoneNumber, {
      fallbackToWhatsApp: true,
      showConfirmation: false
    });
    
    if (result.success) {
      if (result.fallbackUsed) {
        toast({
          title: "WhatsApp aberto",
          description: `Não foi possível fazer ligação direta. ${result.message}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Ligação iniciada",
          description: result.message,
          variant: "default"
        });
      }
    } else {
      toast({
        title: "Erro ao fazer ligação",
        description: result.error,
        variant: "destructive"
      });
    }
  } catch (error) {
    console.error('Phone call error:', error);
    toast({
      title: "Erro inesperado",
      description: "Tente novamente em alguns instantes",
      variant: "destructive"
    });
  }
};
```

### WhatsApp Sharing Integration

Para compartilhamento via WhatsApp com informações detalhadas:

```tsx
const handleWhatsAppShare = async (locationData: ShareLocationData) => {
  const result = await CommunicationService.shareViaWhatsApp(locationData, {
    includeDirections: true,
    includeOperatingHours: true,
    includeFacilities: true,
    format: 'detailed'
  });
  
  if (!result.success && !result.fallbackUsed) {
    // Tenta fallback para clipboard
    try {
      const fallbackResult = await CommunicationService.shareViaSystem(locationData);
      if (fallbackResult.fallbackUsed) {
        toast({
          title: "Informações copiadas",
          description: "WhatsApp não disponível. Informações copiadas para área de transferência.",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar as informações",
        variant: "destructive"
      });
    }
  }
};
```

### Multi-Channel Sharing

Implementação de compartilhamento com múltiplas opções:

```tsx
const ShareOptionsMenu = ({ locationData }: { locationData: ShareLocationData }) => {
  const shareOptions = [
    {
      label: 'Compartilhar via Sistema',
      icon: Share2,
      action: () => CommunicationService.shareViaSystem(locationData),
      primary: true
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      action: () => CommunicationService.shareViaWhatsApp(locationData, { format: 'detailed' })
    },
    {
      label: 'SMS',
      icon: MessageSquare,
      action: () => CommunicationService.shareViaSMS(locationData, { format: 'simple' })
    },
    {
      label: 'Email',
      icon: Mail,
      action: () => CommunicationService.shareViaEmail(locationData)
    }
  ];

  const handleShare = async (shareAction: () => Promise<CommunicationResult>) => {
    const result = await shareAction();
    
    if (result.success) {
      toast({
        title: "Compartilhado com sucesso",
        description: result.message,
        variant: "default"
      });
    } else {
      toast({
        title: "Erro ao compartilhar",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {shareOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={() => handleShare(option.action)}
          >
            <option.icon className="h-4 w-4 mr-2" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### Loading States for Communication Actions

Implementar estados de carregamento para ações de comunicação:

```tsx
const [isSharing, setIsSharing] = useState(false);
const [isCallInProgress, setIsCallInProgress] = useState(false);

const handleCommunicationAction = async (
  action: () => Promise<CommunicationResult>,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);
  try {
    const result = await action();
    // Handle result...
  } finally {
    setLoading(false);
  }
};

return (
  <div className="flex gap-2">
    <Button 
      onClick={() => handleCommunicationAction(
        () => CommunicationService.makePhoneCall(location.telefone),
        setIsCallInProgress
      )}
      disabled={isCallInProgress}
    >
      {isCallInProgress ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Ligando...
        </>
      ) : (
        <>
          <Phone className="mr-2 h-4 w-4" />
          Ligar
        </>
      )}
    </Button>
    
    <Button 
      onClick={() => handleCommunicationAction(
        () => CommunicationService.shareViaSystem(locationData),
        setIsSharing
      )}
      disabled={isSharing}
    >
      {isSharing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Compartilhando...
        </>
      ) : (
        <>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </>
      )}
    </Button>
  </div>
);
```

## Maps Service Integration Patterns

### Error Handling with Maps

Todos os componentes que integram com o Maps Service devem implementar tratamento de erro robusto:

```tsx
const handleMapAction = async () => {
  try {
    const result = await mapsService.openLocation(location);
    
    if (!result.success) {
      toast({
        title: "Erro ao abrir mapa",
        description: result.error || "Nenhum aplicativo de mapas disponível",
        variant: "destructive"
      });
    }
  } catch (error) {
    console.error('Maps integration error:', error);
    toast({
      title: "Erro inesperado",
      description: "Tente novamente em alguns instantes",
      variant: "destructive"
    });
  }
};
```

### Platform Detection

O Maps Service detecta automaticamente a melhor plataforma, mas componentes podem personalizar o comportamento:

```tsx
const [preferredProvider, setPreferredProvider] = useState<MapsProvider>('google');

// Detectar plataforma iOS para preferir Apple Maps
useEffect(() => {
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  if (isIOS) {
    setPreferredProvider('apple');
  }
}, []);
```

### Loading States

Implementar estados de carregamento para ações de mapas:

```tsx
const [isOpeningMap, setIsOpeningMap] = useState(false);

const handleOpenMap = async () => {
  setIsOpeningMap(true);
  try {
    await mapsService.openLocation(location);
  } finally {
    setIsOpeningMap(false);
  }
};

return (
  <Button 
    onClick={handleOpenMap} 
    disabled={isOpeningMap}
  >
    {isOpeningMap ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Abrindo...
      </>
    ) : (
      <>
        <MapPin className="mr-2 h-4 w-4" />
        Ver no Mapa
      </>
    )}
  </Button>
);
```

### Accessibility for Maps Integration

Garantir acessibilidade em componentes de mapas:

```tsx
<Button
  onClick={handleOpenMap}
  aria-label={`Abrir ${location.nome_local} no mapa`}
  title={`Ver localização de ${location.nome_local} no aplicativo de mapas`}
>
  <MapPin className="h-4 w-4" />
  <span className="sr-only">
    Abrir {location.nome_local} no mapa
  </span>
</Button>
```

## Accessibility Utilities Integration

### Comprehensive Accessibility Support

O sistema inclui utilitários abrangentes de acessibilidade (`@/utils/accessibilityUtils`) que devem ser integrados em todos os componentes para garantir conformidade com padrões WCAG e uma experiência inclusiva.

#### ARIA Labels Automáticos

Todos os componentes devem utilizar os geradores de ARIA labels para fornecer descrições consistentes e informativas:

```tsx
import { 
  generateLocationAriaLabel,
  generateFacilityAriaLabel,
  generateTimeSlotAriaLabel 
} from '@/utils/accessibilityUtils';

const LocationCard = ({ location, selected, onSelect }) => {
  const ariaLabel = generateLocationAriaLabel(
    location.nome_local,
    location.availableSlots,
    location.status,
    selected
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => onSelect(location.id)}
      className="focus:ring-2 focus:ring-orange-300"
    >
      <h3>{location.nome_local}</h3>
      <p>{location.availableSlots} horários disponíveis</p>
    </div>
  );
};
```

#### Navegação por Teclado

Implementar navegação completa por teclado usando os utilitários fornecidos:

```tsx
import { 
  KEYBOARD_KEYS,
  isActivationKey,
  isNavigationKey,
  getNextFocusableElement,
  focusElement
} from '@/utils/accessibilityUtils';

const KeyboardNavigableGrid = ({ items, onItemSelect }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
    if (isActivationKey(event.key)) {
      event.preventDefault();
      onItemSelect(items[currentIndex]);
      return;
    }

    if (isNavigationKey(event.key)) {
      event.preventDefault();
      const currentElement = event.target as HTMLElement;
      let nextElement: HTMLElement | null = null;

      switch (event.key) {
        case KEYBOARD_KEYS.ARROW_RIGHT:
        case KEYBOARD_KEYS.ARROW_DOWN:
          nextElement = getNextFocusableElement(currentElement, gridRef.current!, 'next');
          break;
        case KEYBOARD_KEYS.ARROW_LEFT:
        case KEYBOARD_KEYS.ARROW_UP:
          nextElement = getNextFocusableElement(currentElement, gridRef.current!, 'previous');
          break;
        case KEYBOARD_KEYS.HOME:
          nextElement = gridRef.current?.querySelector('[tabindex="0"]') as HTMLElement;
          break;
        case KEYBOARD_KEYS.END:
          const focusableElements = findFocusableElements(gridRef.current!);
          nextElement = focusableElements[focusableElements.length - 1];
          break;
      }

      if (nextElement) {
        focusElement(nextElement);
      }
    }
  };

  return (
    <div ref={gridRef} role="grid" className="grid grid-cols-4 gap-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          role="gridcell"
          tabIndex={index === 0 ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
```

#### Anúncios para Screen Readers

Implementar anúncios automáticos para mudanças de estado e ações do usuário:

```tsx
import { 
  announceToScreenReader,
  announceLocationSelection,
  announceTimeSlotSelection,
  announceError,
  announceSuccess,
  announceLoadingStart,
  announceLoadingComplete
} from '@/utils/accessibilityUtils';

const LocationSelector = ({ locations, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSelect = async (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    setSelectedLocation(locationId);
    onLocationSelect(locationId);

    // Anunciar seleção para screen readers
    announceLocationSelection(location.nome_local, location.availableSlots);

    // Carregar horários disponíveis
    setIsLoading(true);
    announceLoadingStart('horários disponíveis');

    try {
      const timeSlots = await loadTimeSlots(locationId);
      announceLoadingComplete('horários disponíveis', timeSlots.length);
      announceSuccess(`${timeSlots.length} horários carregados para ${location.nome_local}`);
    } catch (error) {
      announceError('Não foi possível carregar os horários disponíveis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div role="listbox" aria-label="Selecionar estabelecimento">
      {locations.map(location => (
        <LocationCard
          key={location.id}
          location={location}
          selected={selectedLocation === location.id}
          onSelect={handleLocationSelect}
        />
      ))}
    </div>
  );
};
```

#### Regiões Live para Atualizações Dinâmicas

Criar regiões live para anunciar mudanças de conteúdo em tempo real:

```tsx
import { createLiveRegion, updateLiveRegion } from '@/utils/accessibilityUtils';

const DynamicContentComponent = () => {
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Criar região live para anúncios de status
    createLiveRegion('status-announcements', 'polite');
    createLiveRegion('error-announcements', 'assertive');

    return () => {
      // Cleanup seria feito aqui se necessário
    };
  }, []);

  const updateStatus = (newStatus: string, isError = false) => {
    setStatus(newStatus);
    
    const regionId = isError ? 'error-announcements' : 'status-announcements';
    updateLiveRegion(regionId, newStatus);
  };

  return (
    <div>
      <div className="sr-only" id="status-announcements" aria-live="polite" aria-atomic="true" />
      <div className="sr-only" id="error-announcements" aria-live="assertive" aria-atomic="true" />
      
      {/* Conteúdo do componente */}
      <div aria-describedby="status-announcements">
        {/* Interface do usuário */}
      </div>
    </div>
  );
};
```

#### Detecção de Preferências de Acessibilidade

Adaptar comportamento baseado nas preferências do usuário:

```tsx
import { 
  detectHighContrastMode,
  prefersReducedMotion,
  checkIsTouchDevice,
  getTouchOptimizedStyles,
  getHighContrastStyles
} from '@/utils/accessibilityUtils';

const AdaptiveComponent = ({ children }) => {
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    reducedMotion: false,
    touchOptimized: false
  });

  useEffect(() => {
    setAccessibilitySettings({
      highContrast: detectHighContrastMode(),
      reducedMotion: prefersReducedMotion(),
      touchOptimized: checkIsTouchDevice()
    });

    // Escutar mudanças nas preferências
    const mediaQueries = [
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-motion: reduce)')
    ];

    const handleChange = () => {
      setAccessibilitySettings({
        highContrast: detectHighContrastMode(),
        reducedMotion: prefersReducedMotion(),
        touchOptimized: checkIsTouchDevice()
      });
    };

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, []);

  const getAdaptiveStyles = () => {
    let styles = {};

    if (accessibilitySettings.highContrast) {
      styles = { ...styles, ...getHighContrastStyles() };
    }

    if (accessibilitySettings.touchOptimized) {
      styles = { ...styles, ...getTouchOptimizedStyles() };
    }

    return styles;
  };

  const getAdaptiveClasses = () => {
    const classes = [];

    if (accessibilitySettings.reducedMotion) {
      classes.push('motion-reduce:transition-none');
    }

    if (accessibilitySettings.touchOptimized) {
      classes.push('touch:min-h-[44px]', 'touch:min-w-[44px]');
    }

    return classes.join(' ');
  };

  return (
    <div 
      style={getAdaptiveStyles()}
      className={getAdaptiveClasses()}
    >
      {children}
    </div>
  );
};
```

#### Formulários Acessíveis

Implementar formulários com suporte completo a acessibilidade:

```tsx
import { generateFieldDescription, ARIA_ATTRIBUTES } from '@/utils/accessibilityUtils';

const AccessibleForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form>
      <div className="space-y-4">
        <div>
          <label htmlFor="patient-name" className="block text-sm font-medium">
            Nome do Paciente *
          </label>
          <input
            id="patient-name"
            type="text"
            required
            aria-describedby="patient-name-description patient-name-error"
            aria-invalid={errors.patientName ? 'true' : 'false'}
            className="mt-1 block w-full rounded-md border-gray-300"
          />
          <div 
            id="patient-name-description" 
            className="mt-1 text-sm text-gray-600"
          >
            {generateFieldDescription('Nome completo do paciente', true)}
          </div>
          {errors.patientName && (
            <div 
              id="patient-name-error" 
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.patientName}
            </div>
          )}
        </div>

        <div>
          <fieldset>
            <legend className="text-sm font-medium">Tipo de Consulta</legend>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="consultation-presencial"
                  type="radio"
                  name="consultation-type"
                  value="presencial"
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="consultation-presencial" className="ml-2 text-sm">
                  Presencial
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="consultation-online"
                  type="radio"
                  name="consultation-type"
                  value="online"
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="consultation-online" className="ml-2 text-sm">
                  Online (Telemedicina)
                </label>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </form>
  );
};
```

#### Padrões de Componentes Acessíveis

**Botões Acessíveis:**
```tsx
const AccessibleButton = ({ 
  children, 
  onClick, 
  loading = false, 
  disabled = false,
  ariaLabel,
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
      {...props}
    >
      {loading && <span className="sr-only">Carregando...</span>}
      {children}
    </button>
  );
};
```

**Cards Interativos:**
```tsx
const InteractiveCard = ({ 
  title, 
  content, 
  onSelect, 
  selected = false,
  disabled = false 
}) => {
  const ariaLabel = `${title}${selected ? ', selecionado' : ''}${disabled ? ', indisponível' : ''}`;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(e) => {
        if (!disabled && isActivationKey(e.key)) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`
        cursor-pointer rounded-lg border p-4 transition-all
        focus:ring-2 focus:ring-blue-500 focus:outline-none
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
      `}
    >
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  );
};
```

## Best Practices

### Component Development
1. **Conditional Rendering**: Use props to control component visibility
2. **Clear Props Interface**: Define TypeScript interfaces for all props
3. **Accessibility**: Include appropriate ARIA labels and semantic HTML using accessibility utilities
4. **Internationalization**: Consider language support for user-facing text
5. **Error Boundaries**: Implement proper error handling for critical components

### Accessibility Implementation
1. **ARIA Labels**: Always use `generateLocationAriaLabel`, `generateFacilityAriaLabel`, and `generateTimeSlotAriaLabel` for consistent descriptions
2. **Keyboard Navigation**: Implement full keyboard support using `KEYBOARD_KEYS` constants and navigation utilities
3. **Screen Reader Announcements**: Use announcement functions for state changes and user actions
4. **Focus Management**: Utilize `focusElement` and `getNextFocusableElement` for proper focus control
5. **Live Regions**: Create live regions for dynamic content updates
6. **Preference Detection**: Adapt interface based on user accessibility preferences
7. **Touch Optimization**: Apply touch-friendly styles for mobile devices
8. **High Contrast Support**: Ensure compatibility with high contrast modes
9. **Reduced Motion**: Respect user preferences for reduced motion
10. **Semantic HTML**: Use appropriate HTML elements and ARIA roles

### Configuration Components
1. **Clear Instructions**: Provide step-by-step guidance for setup issues
2. **Reference Documentation**: Link to example files and documentation
3. **Visual Hierarchy**: Use appropriate styling to convey urgency
4. **Actionable Content**: Focus on what users need to do to resolve issues

### Communication Service Integration Guidelines
1. **Fallback Strategy**: Always implement fallback mechanisms for communication methods
2. **Platform Detection**: Adapt behavior based on device capabilities (mobile vs desktop)
3. **User Feedback**: Provide clear success/error messages in Portuguese
4. **Data Validation**: Validate phone numbers and location data before communication attempts
5. **Privacy Compliance**: Respect user privacy when accessing device communication features
6. **Accessibility**: Ensure all communication actions are accessible via keyboard and screen readers
7. **Error Recovery**: Offer alternative communication methods when primary method fails
8. **Message Formatting**: Optimize message content for each communication channel
9. **Loading States**: Show appropriate loading indicators during communication actions
10. **Graceful Degradation**: Provide clipboard fallback when native sharing is unavailable

### Maps Service Integration Guidelines
1. **Provider Fallback**: Always enable fallback to ensure functionality across platforms
2. **User Preference**: Consider storing user's preferred maps provider in local storage
3. **Error Feedback**: Provide clear, actionable error messages in Portuguese
4. **Performance**: Cache location coordinates to avoid repeated geocoding
5. **Privacy**: Request geolocation permission only when necessary
6. **Offline Handling**: Gracefully handle scenarios when maps services are unavailable

### Integration Guidelines
1. **Environment Detection**: Check configuration status before rendering warnings
2. **Development vs Production**: Consider different behavior for different environments
3. **Performance**: Avoid unnecessary re-renders with proper dependency management
4. **User Experience**: Provide clear feedback without overwhelming the interface