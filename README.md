# AgendarBrasil Health Hub

A comprehensive healthcare appointment scheduling platform built with modern web technologies.

## Project Overview

AgendarBrasil Health Hub is a full-featured healthcare management system that enables patients to schedule appointments with healthcare providers across Brazil. The platform provides a seamless experience for finding doctors, selecting appointment times, and managing healthcare consultations.

## Key Features

### Appointment Scheduling System
- **Multi-step appointment booking**: Specialty → Location → Doctor → Date/Time selection
- **Real-time availability**: Dynamic loading of available time slots
- **Location-based search**: Find doctors by state and city
- **Specialty filtering**: Browse healthcare providers by medical specialty
- **Enhanced location details**: Comprehensive location information with facilities, contact details, and operating hours
- **Location-aware time slots**: Time slot buttons with location badges, color coding, and establishment information
- **Maps integration**: View locations on maps, get directions, and share location information
- **Multi-provider maps support**: Google Maps, OpenStreetMap, Apple Maps, and Waze integration
- **Integrated scheduling**: Direct integration with Supabase backend

### Core Functionality
- User authentication and authorization
- Patient dashboard and appointment management
- Doctor and location management
- Real-time data synchronization
- Responsive design for all devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn package manager

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd agendarbrasil-health-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

1. Copy the environment example file:
   ```sh
   cp .env.example .env
   ```

2. Configure your Supabase credentials in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_ENV=development
   ```

3. Verify your environment configuration:
   ```sh
   node test-env-vars.js
   ```
   This script will check if your `.env` file exists and validate that all required environment variables are properly configured.

### Configuration Warnings

The application includes built-in configuration validation to help developers identify setup issues:

- **SupabaseConfigWarning Component**: Displays a prominent warning when Supabase environment variables are missing or incorrectly configured
- **Real-time Validation**: Automatically detects database connection issues and provides clear setup instructions
- **User-friendly Guidance**: Shows step-by-step instructions for configuring required environment variables
- **Development Helper**: References the `.env.example` file for proper configuration format

## Architecture

### Appointment Scheduling Hook (`useAppointmentScheduling`)

The core appointment scheduling functionality is managed by a custom React hook that provides:

**State Management:**
- Selection states for specialty, location, doctor, date, and time
- Loading and submission states
- Data collections for specialties, states, cities, doctors, and available slots

**Key Features:**
- Cascading selection logic (state → city → doctor → availability)
- Automatic data loading based on user selections
- Error handling with toast notifications
- Navigation integration after successful booking

**API Integration:**
- Supabase RPC calls for location data
- AppointmentService integration for doctor and slot management
- Real-time availability checking

### Services Architecture

The application uses a service-oriented architecture with dedicated services for:
- `appointmentService`: Core appointment management
- `authService`: User authentication
- `locationService`: Geographic data management
- `enhancedLocationService`: Advanced location data management with real-time updates
- `medicalService`: Healthcare provider data
- `specialtyService`: Medical specialty management
- `mapsService`: Maps integration and location sharing functionality
- `communicationService`: Comprehensive communication integrations for phone calls, WhatsApp, SMS, email, and system-level sharing

### Location Data Management

The system includes advanced location data management capabilities through the Location Refresh Manager and comprehensive analytics tracking:

#### Location Analytics and Feedback System

O sistema inclui um módulo abrangente de análise e feedback de localizações que permite rastrear interações dos usuários, coletar avaliações e monitorar a popularidade dos estabelecimentos de saúde.

**Funcionalidades Principais:**
- **Rastreamento de Interações**: Monitoramento de visualizações, seleções, chamadas, compartilhamentos e comparações
- **Sistema de Avaliações**: Coleta de avaliações de 1-5 estrelas com comentários opcionais
- **Correções Colaborativas**: Permite que usuários sugiram correções para informações desatualizadas
- **Indicadores de Popularidade**: Cálculo automático de scores de popularidade baseados em múltiplos fatores
- **Análise de Tendências**: Identificação de tendências de crescimento, estabilidade ou declínio
- **Categorização de Feedback**: Organização de feedback por categorias (facilities, contact, hours, accessibility, general)

**Tipos de Dados Coletados:**
```typescript
// Análise de localização
interface LocationAnalytics {
  locationId: string;
  totalViews: number;           // Total de visualizações
  totalSelections: number;      // Total de seleções
  selectionRate: number;        // Taxa de conversão (seleções/visualizações)
  averageRating: number;        // Avaliação média (1-5 estrelas)
  totalRatings: number;         // Total de avaliações recebidas
  popularityScore: number;      // Score calculado de popularidade
  lastUpdated: string;          // Última atualização dos dados
}

// Interações do usuário
interface LocationInteraction {
  interactionType: 'view' | 'select' | 'call' | 'map' | 'share' | 'compare';
  timestamp: string;
  metadata?: {
    duration?: number;          // Tempo gasto visualizando
    source?: string;            // Como chegou à localização
    device?: 'mobile' | 'tablet' | 'desktop';
  };
}
```

**Indicadores de Popularidade:**
- **Níveis**: baixa, média, alta, muito_alta
- **Tendências**: crescendo, estável, decrescendo
- **Comparação**: Percentual acima/abaixo da média
- **Métricas Recentes**: Seleções dos últimos 7 dias

#### Location Refresh Manager (`locationRefreshManager`)

Um sistema avançado de gerenciamento de atualização de dados de localização que oferece controle granular sobre o refresh de informações de estabelecimentos de saúde.

**Funcionalidades Principais:**
- **Sistema de Prioridades**: Suporte a três níveis de prioridade (critical, normal, background)
- **Fila Inteligente**: Processamento ordenado por prioridade com controle de concorrência
- **Retry Automático**: Sistema de retry com delays progressivos baseados na prioridade
- **Estatísticas em Tempo Real**: Monitoramento de performance e status das operações
- **Controle de Concorrência**: Limite máximo de 3 refreshes simultâneos

**Tipos de Prioridade:**
- `critical`: Para atualizações urgentes (delays: 1s, 2s, 5s)
- `normal`: Para atualizações regulares (delays: 2s, 5s, 10s)
- `background`: Para atualizações em segundo plano (delays: 5s, 15s, 30s)

**Métodos Principais:**
```typescript
// Refresh de localização específica
const taskId = locationRefreshManager.refreshLocation(locationId, 'normal');

// Refresh de múltiplas localizações
const taskId = locationRefreshManager.refreshLocations(locationIds, 'normal');

// Refresh de todas as localizações
const taskId = locationRefreshManager.refreshAllLocations('background');

// Refresh forçado com prioridade máxima
const taskId = locationRefreshManager.forceRefresh(locationId);

// Obter estatísticas do sistema
const stats = locationRefreshManager.getStats();
```

**Estatísticas Disponíveis:**
- Total de refreshes executados
- Refreshes bem-sucedidos vs falhados
- Tempo médio de refresh
- Refreshes ativos no momento
- Refreshes na fila de espera

**Utilitários de Refresh (`refreshUtils`):**
```typescript
// Agendar refresh periódico (padrão: 15 minutos)
const stopPeriodicRefresh = refreshUtils.schedulePeriodicRefresh(900000);

// Refresh preventivo de localizações populares
await refreshUtils.prefreshPopularLocations(popularLocationIds);

// Refresh de emergência com prioridade máxima
const taskIds = refreshUtils.emergencyRefresh(criticalLocationIds);
```

**Integração com Enhanced Location Service:**
O Location Refresh Manager trabalha em conjunto com o `enhancedLocationService` para garantir que os dados de localização estejam sempre atualizados, utilizando estratégias inteligentes de cache e refresh baseadas na demanda e importância dos dados.

## Development

### Available Scripts

```sh
# Development server
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Clean build (removes cache)
npm run build:clean

# Clean development (removes cache)
npm run dev:clean

# Linting
npm run lint

# Preview production build
npm run preview
```

### Testing and Debugging Tools

The project includes several debugging and testing utilities:

#### Environment Configuration Testing
- **`test-env-vars.js`**: Environment variables validation script
  - Checks if `.env` file exists in the project root
  - Lists all configured environment variables from `.env`
  - Validates required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV`)
  - Provides clear feedback on missing configuration
  - Uses ES modules with proper file path resolution

```sh
# Run environment configuration check
node test-env-vars.js
```

#### Time Slot Generation Testing
- **`test-horarios-debug.js`**: Standalone script to test appointment time slot generation logic
  - Tests the core time slot generation algorithm
  - Validates working hours configuration
  - Simulates different days of the week scenarios
  - Useful for debugging scheduling issues

```sh
# Run time slot generation test
node test-horarios-debug.js
```

#### Doctor Configuration Debugging
- **`debug-doctor-config.js`**: Comprehensive doctor configuration analysis tool
  - Uses hardcoded Supabase credentials for direct database access
  - Analyzes doctor profiles, specialties, and working hours
  - Tests location-based doctor search functionality
  - Validates appointment scheduling configurations
  - Provides detailed output for troubleshooting doctor setup issues

```sh
# Run doctor configuration debug
node debug-doctor-config.js
```

**⚠️ Security Note**: This script contains hardcoded database credentials and should only be used in development environments. Ensure credentials are removed before committing to version control.

#### Other Testing Scripts
- **`test-auth.html`**: Authentication testing interface
- **`test-backend-functions.sql`**: Backend function testing queries
- **`test-webhook-accessibility.js`**: Webhook endpoint testing
- **`debug-horarios.js`**: Advanced scheduling debugging
- **`debug-supabase.js`**: Supabase connection debugging
- **`debug-doctor-config.js`**: Doctor configuration debugging with hardcoded credentials
- **`debug-locations.js`**: Location data and doctor search functionality debugging

```sh
# Run doctor configuration debug
node debug-doctor-config.js

# Run location debugging
node debug-locations.js
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components (Alert, Button, etc.)
│   ├── scheduling/     # Appointment scheduling components (TimeSlotButton, etc.)
│   ├── location/       # Location and facility components
│   ├── health/         # Healthcare-specific components
│   ├── integrations/   # Integration-related components
│   └── SupabaseConfigWarning.tsx  # Database configuration warning
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── pages/              # Route components
├── services/           # Business logic and API calls
│   ├── mapsService.ts  # Maps integration and location sharing
│   ├── locationAnalyticsService.ts  # Location analytics and feedback management
│   └── ...            # Other service files
├── types/              # TypeScript type definitions
│   ├── locationAnalytics.ts  # Location analytics and feedback types
│   └── ...            # Other type definition files
└── utils/              # Utility functions
    ├── arrayUtils.ts           # Array manipulation utilities
    ├── timeSlotUtils.ts        # Appointment time slot generation
    ├── locationUtils.ts        # Geographic data processing
    ├── locationRefreshManager.ts # Advanced location data refresh management
    ├── accessibilityUtils.ts   # Comprehensive accessibility support utilities
    ├── validation.ts           # Form and data validation
    ├── errorLogger.ts          # Error handling and logging
    └── supabaseCheck.ts        # Database connection validation
```

### Key Components

#### SupabaseConfigWarning
A critical system component that provides user-friendly feedback when database configuration is missing or incorrect.

**Features:**
- Conditional rendering based on database connection status
- Clear, actionable error messages in Portuguese
- Step-by-step configuration instructions
- References to `.env.example` for proper setup format
- Uses destructive Alert variant for high visibility

**Usage:**
```tsx
<SupabaseConfigWarning show={!isDatabaseConnected} />
```

**Dependencies:**
- `@/components/ui/alert` (Alert, AlertDescription, AlertTitle)
- `lucide-react` (AlertTriangle icon)

#### TimeSlotButton
Um componente avançado para exibição de horários de agendamento com suporte a informações de localização e estados visuais aprimorados.

**Funcionalidades:**
- Exibição de horários com indicadores visuais de disponibilidade
- Suporte a badges de localização com códigos de cores
- Tooltips informativos com detalhes do estabelecimento
- Estados visuais para seleção, disponibilidade e filtragem
- Integração com sistema de cores por localização
- Acessibilidade completa com ARIA labels

#### LocationTimeSlotMapping
Um componente abrangente para visualização e gerenciamento de horários agrupados por estabelecimento, oferecendo múltiplas visualizações e funcionalidades avançadas de filtragem.

**Funcionalidades Principais:**
- **Múltiplas Visualizações**: Agrupado por estabelecimento, matriz de horários, e lista linear
- **Sistema de Preferências**: Salvamento de estabelecimentos preferidos com seleção automática
- **Filtragem Avançada**: Filtros por localização com feedback visual em tempo real
- **Estatísticas em Tempo Real**: Contadores de estabelecimentos, horários disponíveis e preferências
- **Interface Responsiva**: Layout adaptativo para desktop, tablet e mobile
- **Integração Completa**: Conecta-se com LocationCard e TimeSlotButton para experiência unificada

**Modos de Visualização:**
1. **Agrupado**: Horários organizados por estabelecimento com cards expandidos
2. **Matriz**: Tabela com estabelecimentos vs horários para comparação rápida
3. **Lista**: Visualização linear de horários disponíveis com detalhes de localização

**Propriedades:**
```tsx
interface LocationTimeSlotMappingProps {
  timeSlots: EnhancedTimeSlot[];           // Horários com informações de localização
  locations: LocationWithTimeSlots[];      // Estabelecimentos com dados completos
  selectedTimeSlot?: string;               // Horário atualmente selecionado
  selectedLocationId?: string;             // Localização atualmente selecionada
  onTimeSlotSelect: (time: string, locationId: string) => void;  // Callback de seleção
  onLocationSelect?: (locationId: string) => void;               // Callback de localização
  groupByLocation?: boolean;               // Habilita agrupamento por localização
  showMatrix?: boolean;                    // Habilita visualização em matriz
  className?: string;                      // Classes CSS adicionais
}
```

**Uso:**
```tsx
<LocationTimeSlotMapping
  timeSlots={enhancedTimeSlots}
  locations={locationsWithDetails}
  selectedTimeSlot={selectedTime}
  selectedLocationId={selectedLocation}
  onTimeSlotSelect={(time, locationId) => {
    setSelectedTime(time);
    setSelectedLocation(locationId);
  }}
  onLocationSelect={setSelectedLocation}
  groupByLocation={true}
  showMatrix={true}
/>
```

**Dependências:**
- `@/components/ui/button` - Componente base de botão
- `@/components/ui/badge` - Badge para indicadores de localização
- `@/components/ui/tooltip` - Tooltips informativos
- `@/components/ui/card` - Cards para agrupamento de conteúdo
- `@/components/ui/tabs` - Sistema de abas para múltiplas visualizações
- `@/components/ui/select` - Seletores para filtros
- `@/components/ui/switch` - Controles de preferências
- `@/components/scheduling/TimeSlotButton` - Botões de horário integrados
- `@/components/location/LocationCard` - Cards de estabelecimento
- `@/utils/accessibilityUtils` - Utilitários de acessibilidade integrados
- `lucide-react` - Ícones diversos (Clock, Building, Filter, etc.)

### Maps Service (`mapsService`)

O Maps Service fornece integração abrangente com múltiplos provedores de mapas para visualização de localizações, direções e compartilhamento de informações geográficas.

**Funcionalidades Principais:**
- **Múltiplos Provedores**: Suporte a Google Maps, OpenStreetMap, Apple Maps e Waze
- **Detecção Automática**: Seleção inteligente do melhor provedor baseado na plataforma do usuário
- **Fallback Inteligente**: Sistema de fallback automático quando um provedor não está disponível
- **Visualização de Localizações**: Abertura de localizações em aplicativos de mapas
- **Direções**: Geração de rotas e navegação para estabelecimentos
- **Compartilhamento**: Múltiplas opções de compartilhamento (sistema, WhatsApp, SMS, email, clipboard)
- **Geolocalização**: Obtenção da localização atual do usuário

**Provedores Suportados:**
- **Google Maps**: Provedor padrão com ampla compatibilidade
- **OpenStreetMap**: Alternativa open-source sempre disponível
- **Apple Maps**: Otimizado para dispositivos iOS/macOS
- **Waze**: Focado em navegação com trânsito em tempo real

**Exemplo de Uso:**
```typescript
import { mapsService } from '@/services/mapsService';

// Abrir localização no mapa
const result = await mapsService.openLocation(location, {
  provider: 'google',
  newWindow: true,
  fallbackOnError: true
});

// Obter direções
await mapsService.openDirections(destination, {
  origin: currentLocation,
  provider: 'waze'
});

// Compartilhar localização
await mapsService.shareLocation(location, 'whatsapp', {
  message: 'Consulta médica agendada aqui:',
  includeDirections: true
});
```

**Configuração:**
```typescript
const customMapsService = new MapsService({
  defaultProvider: 'google',
  fallbackProviders: ['openstreetmap', 'apple', 'waze'],
  googleMapsApiKey: 'your-api-key' // Opcional para funcionalidades avançadas
});
```

**Métodos Principais:**
- `openLocation()`: Abre localização em aplicativo de mapas
- `openDirections()`: Abre direções para localização
- `shareLocation()`: Compartilha informações de localização
- `getCurrentLocation()`: Obtém localização atual do usuário
- `generateMapViewUrl()`: Gera URL para visualização de mapa
- `generateDirectionsUrl()`: Gera URL para direções
- `getAvailableProviders()`: Lista provedores disponíveis na plataforma

### Communication Service (`communicationService`)

O Communication Service fornece uma interface unificada para todas as funcionalidades de comunicação da plataforma, incluindo chamadas telefônicas, WhatsApp, SMS, email e compartilhamento via sistema operacional.

**Funcionalidades Principais:**
- **Chamadas Telefônicas**: Integração com discador do dispositivo e fallback para WhatsApp
- **WhatsApp**: Abertura de chats e compartilhamento de informações formatadas
- **SMS**: Envio de mensagens de texto otimizadas para diferentes dispositivos
- **Email**: Compartilhamento via cliente de email com formatação estruturada
- **Compartilhamento do Sistema**: Uso da Web Share API nativa quando disponível
- **Fallbacks Inteligentes**: Sistema robusto de fallback para garantir funcionalidade em todas as plataformas

**Interfaces Principais:**
```typescript
interface ShareLocationData {
  location: EnhancedLocation;
  appointmentDate?: string;
  appointmentTime?: string;
  doctorName?: string;
  specialty?: string;
  patientName?: string;
  additionalNotes?: string;
}

interface CommunicationResult {
  success: boolean;
  error?: string;
  message?: string;
  provider?: string;
  fallbackUsed?: boolean;
}

interface PhoneCallOptions {
  useWhatsApp?: boolean;
  fallbackToWhatsApp?: boolean;
  showConfirmation?: boolean;
}

interface ShareOptions {
  includeDirections?: boolean;
  includeOperatingHours?: boolean;
  includeFacilities?: boolean;
  customMessage?: string;
  format?: 'simple' | 'detailed' | 'appointment';
}
```

**Exemplo de Uso:**
```typescript
import { CommunicationService } from '@/services/communicationService';

// Fazer chamada telefônica com fallback para WhatsApp
const callResult = await CommunicationService.makePhoneCall(
  location.telefone, 
  { fallbackToWhatsApp: true }
);

// Compartilhar via WhatsApp com informações detalhadas
const shareResult = await CommunicationService.shareViaWhatsApp({
  location,
  appointmentDate: '15/01/2025',
  appointmentTime: '14:30',
  doctorName: 'Dr. João Silva',
  specialty: 'Cardiologia',
  patientName: 'Maria Santos'
}, {
  includeDirections: true,
  includeOperatingHours: true,
  includeFacilities: true
});

// Compartilhamento via sistema operacional
await CommunicationService.shareViaSystem({
  location,
  appointmentDate: '15/01/2025',
  appointmentTime: '14:30'
});
```

**Métodos Principais:**
- `makePhoneCall()`: Inicia chamadas telefônicas com opções avançadas
- `openWhatsAppChat()`: Abre chat do WhatsApp com número específico
- `shareViaWhatsApp()`: Compartilha informações formatadas via WhatsApp
- `shareViaEmail()`: Compartilha via cliente de email com formatação HTML/texto
- `shareViaSMS()`: Envia informações via SMS com formatação otimizada
- `shareViaSystem()`: Usa Web Share API nativa do sistema operacional
- `formatPhoneNumber()`: Formata números de telefone para exibição
- `formatOperatingHours()`: Formata horários de funcionamento

**Características Avançadas:**
- **Detecção de Plataforma**: Adapta comportamento baseado no dispositivo (mobile/desktop)
- **Formatação Inteligente**: Mensagens otimizadas para cada canal de comunicação
- **Tratamento de Erros**: Sistema robusto de tratamento de erros com mensagens em português
- **Fallback para Clipboard**: Copia informações quando métodos nativos falham
- **Validação de Dados**: Validação de números de telefone e dados de localização
- **Acessibilidade**: Suporte completo a leitores de tela e navegação por teclado

### Accessibility Utilities (`accessibilityUtils`)

O sistema inclui um conjunto abrangente de utilitários de acessibilidade que garantem que todos os componentes da aplicação sejam totalmente acessíveis para usuários com deficiências.

**Funcionalidades Principais:**
- **Geradores de ARIA Labels**: Criação automática de labels descritivos em português
- **Navegação por Teclado**: Utilitários para implementar navegação completa via teclado
- **Anúncios para Leitores de Tela**: Sistema de anúncios em tempo real para screen readers
- **Gerenciamento de Foco**: Controle inteligente de foco para melhor experiência de navegação
- **Detecção de Alto Contraste**: Suporte automático para modo de alto contraste
- **Otimização para Touch**: Estilos e comportamentos otimizados para dispositivos touch
- **Regiões Live**: Criação e gerenciamento de regiões ARIA live para atualizações dinâmicas

**Geradores de ARIA Labels:**
```typescript
import { 
  generateLocationAriaLabel,
  generateFacilityAriaLabel,
  generateTimeSlotAriaLabel 
} from '@/utils/accessibilityUtils';

// Gera label para estabelecimento
const locationLabel = generateLocationAriaLabel(
  "Hospital São Paulo", 
  5, 
  "ativo", 
  true
);
// Resultado: "Estabelecimento Hospital São Paulo, ativo, 5 horários disponíveis, selecionado"

// Gera label para facilidade
const facilityLabel = generateFacilityAriaLabel(
  "Estacionamento", 
  true, 
  "Gratuito", 
  "50 vagas disponíveis"
);
// Resultado: "Estacionamento disponível, Gratuito, 50 vagas disponíveis"
```

**Navegação por Teclado:**
```typescript
import { 
  KEYBOARD_KEYS,
  isActivationKey,
  isNavigationKey,
  getNextFocusableElement 
} from '@/utils/accessibilityUtils';

const handleKeyDown = (event: KeyboardEvent) => {
  if (isActivationKey(event.key)) {
    // Ativar elemento (Enter ou Space)
    handleActivation();
  } else if (isNavigationKey(event.key)) {
    // Navegar entre elementos
    const nextElement = getNextFocusableElement(
      event.target as HTMLElement,
      containerRef.current,
      event.key === KEYBOARD_KEYS.ARROW_DOWN ? 'next' : 'previous'
    );
    nextElement?.focus();
  }
};
```

**Anúncios para Screen Readers:**
```typescript
import { 
  announceToScreenReader,
  announceLocationSelection,
  announceTimeSlotSelection,
  announceError,
  announceSuccess 
} from '@/utils/accessibilityUtils';

// Anúncio geral
announceToScreenReader("Dados carregados com sucesso", "polite");

// Anúncios específicos
announceLocationSelection("Hospital São Paulo", 5);
announceTimeSlotSelection("14:30", "Hospital São Paulo");
announceError("Não foi possível carregar os horários");
announceSuccess("Agendamento realizado com sucesso");
```

**Detecção de Preferências de Acessibilidade:**
```typescript
import { 
  detectHighContrastMode,
  prefersReducedMotion,
  checkIsTouchDevice,
  getTouchOptimizedStyles 
} from '@/utils/accessibilityUtils';

// Adaptar interface baseado nas preferências do usuário
const isHighContrast = detectHighContrastMode();
const reducedMotion = prefersReducedMotion();
const isTouchDevice = checkIsTouchDevice();

// Aplicar estilos otimizados
const touchStyles = isTouchDevice ? getTouchOptimizedStyles() : {};
```

**Regiões Live para Atualizações Dinâmicas:**
```typescript
import { 
  createLiveRegion,
  updateLiveRegion 
} from '@/utils/accessibilityUtils';

// Criar região live para anúncios
const liveRegion = createLiveRegion('appointment-status', 'assertive');

// Atualizar com novas informações
updateLiveRegion('appointment-status', 'Novo horário disponível às 15:30');
```

**Configuração Padrão de Acessibilidade:**
```typescript
import { DEFAULT_A11Y_CONFIG } from '@/utils/accessibilityUtils';

// Configuração padrão inclui:
// - announceSelections: true
// - announceErrors: true  
// - announceLoading: true
// - enableKeyboardNavigation: true
// - enableHighContrast: true
// - enableReducedMotion: true
// - touchOptimized: true
```

**Integração com Componentes:**
Todos os componentes principais da aplicação utilizam estes utilitários para garantir acessibilidade completa:

- **LocationCard**: ARIA labels descritivos e navegação por teclado
- **TimeSlotButton**: Anúncios de seleção e estados visuais acessíveis  
- **LocationTimeSlotMapping**: Gerenciamento de foco e anúncios de mudanças
- **LocationActions**: Botões acessíveis com feedback para screen readers
- **AppointmentSummary**: Informações estruturadas para leitores de tela

**Padrões de Implementação:**
```typescript
// Exemplo de componente acessível
const AccessibleLocationCard = ({ location, onSelect }) => {
  const ariaLabel = generateLocationAriaLabel(
    location.nome_local,
    location.availableSlots,
    location.status,
    location.selected
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isActivationKey(event.key)) {
      event.preventDefault();
      onSelect(location.id);
      announceLocationSelection(location.nome_local, location.availableSlots);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(location.id)}
      className="focus:ring-2 focus:ring-orange-300"
    >
      {/* Conteúdo do card */}
    </div>
  );
};
```

**Benefícios:**
- **Conformidade WCAG**: Atende aos padrões internacionais de acessibilidade web
- **Experiência Inclusiva**: Garante que todos os usuários possam usar a aplicação
- **Navegação Eficiente**: Suporte completo a navegação por teclado e assistiva
- **Feedback Claro**: Anúncios em português para usuários de screen readers
- **Adaptabilidade**: Detecção automática de preferências de acessibilidade
- **Manutenibilidade**: Utilitários reutilizáveis para desenvolvimento consistente

## Deployment

### Lovable Platform
Simply open [Lovable](https://lovable.dev/projects/08eaeedb-5121-451b-bb36-da1564551706) and click on Share → Publish.

### Custom Domain
To connect a custom domain, navigate to Project > Settings > Domains and click Connect Domain.
Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Security Considerations

### Debug Scripts with Hardcoded Credentials

⚠️ **Important Security Notice**: Some debug scripts in this project contain hardcoded database credentials for development purposes:

- `debug-doctor-config.js` - Contains hardcoded Supabase URL and service key
- Other debug scripts may also contain sensitive credentials

**Security Best Practices:**
1. **Development Only**: These scripts should only be used in development environments
2. **Credential Management**: Remove or replace hardcoded credentials before committing to version control
3. **Environment Variables**: Consider migrating debug scripts to use environment variables instead
4. **Access Control**: Ensure these scripts are not deployed to production environments
5. **Regular Audits**: Regularly review debug scripts for exposed credentials

**Recommended Actions:**
- Use `.env` files for sensitive configuration
- Implement credential rotation policies
- Add debug scripts to `.gitignore` if they contain sensitive data
- Use service accounts with minimal required permissions

## Contributing

### Development Workflow
1. **Lovable**: Visit the [Lovable Project](https://lovable.dev/projects/08eaeedb-5121-451b-bb36-da1564551706) for AI-assisted development
2. **Local IDE**: Clone and develop locally, push changes to sync with Lovable
3. **GitHub**: Edit files directly in the GitHub interface
4. **Codespaces**: Use GitHub Codespaces for cloud-based development

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- React Hook Form for form management
- Zod for runtime validation
