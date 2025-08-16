# API Reference

## Overview

This document outlines the API endpoints and service methods used in the AgendarBrasil Health Hub appointment scheduling system.

## Authentication Hooks

### useAuthInitialization()

Hook responsável pela inicialização segura do sistema de autenticação da aplicação.

**Returns:**
```typescript
interface AuthInitializationResult {
  isAuthReady: boolean;      // Indica se a autenticação está pronta
  initError: string | null;  // Mensagem de erro em caso de falha
}
```

**Usage:**
```typescript
import { useAuthInitialization } from '@/hooks/useAuthInitialization';

const { isAuthReady, initError } = useAuthInitialization();

if (initError) {
  // Tratar erro de inicialização
  return <ErrorComponent message={initError} />;
}

if (!isAuthReady) {
  // Exibir carregamento
  return <LoadingComponent />;
}

// Prosseguir com aplicação
return <App />;
```

**Error Handling:**
- Captura erros de importação do AuthContext
- Valida exportações de useAuth e AuthProvider
- Implementa recuperação automática via reload da página
- Fornece mensagens de erro em português

## Supabase RPC Functions

### get_available_states()

Returns a list of Brazilian states that have healthcare providers available in the system.

**Returns:**
```typescript
StateInfo[] = {
  uf: string; // State abbreviation (e.g., "SP", "RJ")
}[]
```

**Usage:**
```typescript
const { data } = await supabase.rpc('get_available_states');
```

### get_available_cities(state_uf)

Retorna cidades dentro de um estado específico que possuem profissionais de saúde cadastrados. Esta função foi otimizada para retornar apenas dados reais e incluir contagem de médicos.

**Parameters:**
- `state_uf` (string): Sigla do estado brasileiro (ex: "SP", "MG", "RJ")

**Returns:**
```typescript
CityWithDoctorCount[] = {
  cidade: string;        // Nome da cidade
  estado: string;        // Sigla do estado
  total_medicos: number; // Número de médicos na cidade
}[]
```

### get_doctors_by_location_and_specialty(p_specialty, p_city, p_state)

Busca médicos baseado na especialidade e localização específica. Esta função foi corrigida para garantir busca precisa e retorno de dados completos.

**Parameters:**
- `p_specialty` (string): Especialidade médica (ex: "Cardiologia", "Pediatria")
- `p_city` (string): Nome da cidade (ex: "Belo Horizonte", "São Paulo")
- `p_state` (string): Sigla do estado (ex: "MG", "SP")

**Returns:**
```typescript
DoctorWithLocation[] = {
  id: string;              // UUID do médico
  display_name: string;    // Nome completo do médico
  crm: string;            // Número do CRM
  especialidades: string[]; // Array de especialidades
  local_nome: string;      // Nome do local de atendimento
  local_cidade: string;    // Cidade do local
  local_estado: string;    // Estado do local
  local_endereco: string;  // Endereço completo
  local_telefone: string;  // Telefone do local
}[]
```

**Melhorias da Função:**
- **Busca por Especialidade**: Utiliza operador `ANY` para busca eficiente em arrays de especialidades
- **Filtros Geográficos**: Filtragem precisa por cidade e estado
- **Dados Completos**: Retorna informações completas do médico e local de atendimento
- **Performance Otimizada**: JOINs eficientes entre tabelas relacionadas
- **Validação Integrada**: Inclui testes de validação antes e depois da correção

**Usage:**
```typescript
const { data } = await supabase.rpc('get_doctors_by_location_and_specialty', { 
  p_specialty: 'Cardiologia',
  p_city: 'Belo Horizonte',
  p_state: 'MG'
});

// Exemplo de resposta:
// [
//   {
//     id: "uuid-123",
//     display_name: "Dr. João Silva",
//     crm: "CRM/MG 12345",
//     especialidades: ["Cardiologia", "Clínica Médica"],
//     local_nome: "Clínica Coração Saudável",
//     local_cidade: "Belo Horizonte",
//     local_estado: "MG",
//     local_endereco: "Rua das Flores, 123",
//     local_telefone: "(31) 3333-4444"
//   }
// ]
```

**Implementação SQL:**
```sql
CREATE OR REPLACE FUNCTION public.get_doctors_by_location_and_specialty(
    p_specialty text,
    p_city text,
    p_state text
)
RETURNS TABLE(
    id uuid,
    display_name text,
    crm text,
    especialidades text[],
    local_nome text,
    local_cidade text,
    local_estado text,
    local_endereco text,
    local_telefone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id as id,
        p.display_name,
        m.crm,
        m.especialidades,
        la.nome_local as local_nome,
        la.cidade as local_cidade,
        la.estado as local_estado,
        la.endereco as local_endereco,
        la.telefone as local_telefone
    FROM public.medicos m
    JOIN public.profiles p ON m.user_id = p.id
    JOIN public.locais_atendimento la ON m.user_id = la.medico_id
    WHERE p_specialty = ANY(m.especialidades)
    AND la.cidade = p_city
    AND la.estado = p_state
    ORDER BY p.display_name;
END;
$;
```

**Melhorias da Função:**
- **Dados Reais**: Retorna apenas cidades com médicos efetivamente cadastrados
- **Contagem de Médicos**: Inclui número de profissionais por cidade
- **Validação Rigorosa**: Filtra registros com dados nulos
- **Performance Otimizada**: JOIN direto entre tabelas para consultas mais rápidas
- **Ordenação Alfabética**: Cidades ordenadas para melhor experiência do usuário

**Usage:**
```typescript
const { data } = await supabase.rpc('get_available_cities', { 
  state_uf: selectedState 
});

// Exemplo de resposta para 'MG':
// [
//   { cidade: "Belo Horizonte", estado: "MG", total_medicos: 15 },
//   { cidade: "Uberlândia", estado: "MG", total_medicos: 8 }
// ]
```

**Implementação SQL:**
```sql
CREATE OR REPLACE FUNCTION public.get_available_cities(state_uf text)
RETURNS TABLE(cidade text, estado text, total_medicos bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        la.cidade,
        la.estado,
        COUNT(*) as total_medicos
    FROM public.locais_atendimento la
    JOIN public.medicos m ON la.medico_id = m.user_id
    WHERE la.estado = state_uf
    AND la.cidade IS NOT NULL
    AND la.estado IS NOT NULL
    GROUP BY la.cidade, la.estado
    ORDER BY la.cidade;
END;
$;
```

## CommunicationService Methods

### makePhoneCall(phoneNumber, options)

Inicia uma chamada telefônica para o número especificado com opções avançadas de fallback.

**Parameters:**
- `phoneNumber` (string): Número de telefone para ligar
- `options` (PhoneCallOptions): Opções de configuração
  - `useWhatsApp?` (boolean): Tentar usar WhatsApp primeiro
  - `fallbackToWhatsApp?` (boolean): Usar WhatsApp como fallback se chamada falhar
  - `showConfirmation?` (boolean): Mostrar confirmação antes de ligar

**Returns:**
```typescript
Promise<CommunicationResult>
```

**Usage:**
```typescript
const result = await CommunicationService.makePhoneCall(
  '+5511999999999',
  { fallbackToWhatsApp: true }
);

if (result.success) {
  console.log(`Chamada iniciada via ${result.provider}`);
} else {
  console.error(`Erro: ${result.error}`);
}
```

### shareViaWhatsApp(data, options)

Compartilha informações detalhadas de localização via WhatsApp com formatação rica.

**Parameters:**
- `data` (ShareLocationData): Dados da localização e consulta
- `options` (ShareOptions): Opções de formatação e conteúdo

**Returns:**
```typescript
Promise<CommunicationResult>
```

**Usage:**
```typescript
const result = await CommunicationService.shareViaWhatsApp({
  location: enhancedLocation,
  appointmentDate: '15/01/2025',
  appointmentTime: '14:30',
  doctorName: 'Dr. João Silva',
  patientName: 'Maria Santos'
}, {
  includeDirections: true,
  includeOperatingHours: true,
  includeFacilities: true,
  format: 'detailed'
});
```

### shareViaEmail(data, options)

Compartilha informações via cliente de email com formatação estruturada em texto.

**Parameters:**
- `data` (ShareLocationData): Dados da localização e consulta
- `options` (ShareOptions): Opções de formatação

**Returns:**
```typescript
Promise<CommunicationResult>
```

### shareViaSMS(data, options)

Compartilha informações via SMS com formatação otimizada para limite de caracteres.

**Parameters:**
- `data` (ShareLocationData): Dados da localização e consulta
- `options` (ShareOptions): Opções de formatação
  - `format?` ('simple' | 'detailed'): Nível de detalhamento da mensagem

**Returns:**
```typescript
Promise<CommunicationResult>
```

### shareViaSystem(data, options)

Usa a Web Share API nativa do sistema operacional para compartilhamento.

**Parameters:**
- `data` (ShareLocationData): Dados da localização e consulta
- `options` (ShareOptions): Opções de formatação

**Returns:**
```typescript
Promise<CommunicationResult>
```

**Usage:**
```typescript
const result = await CommunicationService.shareViaSystem({
  location: enhancedLocation,
  appointmentDate: '15/01/2025',
  appointmentTime: '14:30'
}, {
  includeDirections: true,
  customMessage: 'Consulta médica agendada:'
});
```

### openWhatsAppChat(phoneNumber, message?)

Abre chat do WhatsApp com número específico e mensagem opcional.

**Parameters:**
- `phoneNumber` (string): Número de telefone (será formatado automaticamente)
- `message?` (string): Mensagem inicial opcional

**Returns:**
```typescript
Promise<CommunicationResult>
```

## MapsService Methods

### openLocation(location, options)

Opens a location in the user's preferred maps application with intelligent fallback handling.

**Parameters:**
- `location` (EnhancedLocation): Location object with coordinates and address information
- `options` (object): Configuration options
  - `provider?` (MapsProvider): Preferred maps provider ('google' | 'openstreetmap' | 'apple' | 'waze')
  - `newWindow?` (boolean): Whether to open in new window/tab (default: true)
  - `fallbackOnError?` (boolean): Enable automatic fallback to other providers (default: true)

**Returns:**
```typescript
Promise<{
  success: boolean;
  provider: MapsProvider;
  error?: string;
}>
```

**Usage:**
```typescript
const result = await mapsService.openLocation(location, {
  provider: 'google',
  newWindow: true,
  fallbackOnError: true
});

if (result.success) {
  console.log(`Opened in ${result.provider}`);
} else {
  console.error(`Failed to open: ${result.error}`);
}
```

### openDirections(destination, options)

Opens directions to a location in the user's preferred maps application.

**Parameters:**
- `destination` (EnhancedLocation): Target location
- `options` (object): Configuration options
  - `origin?` (LocationCoordinates | string): Starting point (default: current location)
  - `provider?` (MapsProvider): Preferred maps provider
  - `newWindow?` (boolean): Whether to open in new window/tab (default: true)
  - `fallbackOnError?` (boolean): Enable automatic fallback (default: true)

**Returns:**
```typescript
Promise<{
  success: boolean;
  provider: MapsProvider;
  error?: string;
}>
```

### shareLocation(location, method, options)

Shares location information through various communication channels.

**Parameters:**
- `location` (EnhancedLocation): Location to share
- `method` ('system' | 'whatsapp' | 'sms' | 'email' | 'copy'): Sharing method
- `options` (object): Sharing configuration
  - `message?` (string): Custom message to include
  - `includeDirections?` (boolean): Include directions link (default: false)
  - `provider?` (MapsProvider): Maps provider for links

**Returns:**
```typescript
Promise<{
  success: boolean;
  error?: string;
}>
```

**Usage:**
```typescript
await mapsService.shareLocation(location, 'whatsapp', {
  message: 'Consulta médica agendada aqui:',
  includeDirections: true,
  provider: 'google'
});
```

### getCurrentLocation()

Gets the user's current geographic location using the browser's geolocation API.

**Returns:**
```typescript
Promise<LocationCoordinates | null>
```

**Usage:**
```typescript
const currentLocation = await mapsService.getCurrentLocation();
if (currentLocation) {
  console.log(`Current position: ${currentLocation.lat}, ${currentLocation.lng}`);
}
```

### generateMapViewUrl(location, provider?)

Generates a URL for viewing a location on a specific maps provider.

**Parameters:**
- `location` (EnhancedLocation): Location to view
- `provider?` (MapsProvider): Maps provider (auto-detected if not specified)

**Returns:**
```typescript
string
```

### generateDirectionsUrl(destination, origin?, provider?)

Generates a URL for directions to a location.

**Parameters:**
- `destination` (EnhancedLocation): Target location
- `origin?` (LocationCoordinates | string): Starting point
- `provider?` (MapsProvider): Maps provider

**Returns:**
```typescript
string
```

### getAvailableProviders()

Returns a list of maps providers available on the current platform.

**Returns:**
```typescript
Promise<MapsProvider[]>
```

## LocationRefreshManager Methods

### refreshLocation(locationId, priority?)

Agenda o refresh de uma localização específica com prioridade configurável.

**Parameters:**
- `locationId` (string): Identificador único da localização
- `priority?` (RefreshPriority): Prioridade do refresh ('critical' | 'normal' | 'background', padrão: 'normal')

**Returns:**
```typescript
string // Task ID para acompanhamento
```

**Usage:**
```typescript
const taskId = locationRefreshManager.refreshLocation('loc_123', 'critical');
```

### refreshLocations(locationIds, priority?)

Agenda o refresh de múltiplas localizações simultaneamente.

**Parameters:**
- `locationIds` (string[]): Array de identificadores de localização
- `priority?` (RefreshPriority): Prioridade do refresh (padrão: 'normal')

**Returns:**
```typescript
string // Task ID para acompanhamento
```

**Usage:**
```typescript
const taskId = locationRefreshManager.refreshLocations(['loc_1', 'loc_2'], 'normal');
```

### refreshAllLocations(priority?)

Agenda o refresh de todas as localizações do sistema.

**Parameters:**
- `priority?` (RefreshPriority): Prioridade do refresh (padrão: 'background')

**Returns:**
```typescript
string // Task ID para acompanhamento
```

**Usage:**
```typescript
const taskId = locationRefreshManager.refreshAllLocations('background');
```

### forceRefresh(locationId)

Força o refresh imediato de uma localização com prioridade máxima, cancelando tasks pendentes para a mesma localização.

**Parameters:**
- `locationId` (string): Identificador único da localização

**Returns:**
```typescript
string // Task ID para acompanhamento
```

**Usage:**
```typescript
const taskId = locationRefreshManager.forceRefresh('loc_123');
```

### getStats()

Retorna estatísticas detalhadas sobre o sistema de refresh.

**Returns:**
```typescript
RefreshStats = {
  totalRefreshes: number;        // Total de refreshes executados
  successfulRefreshes: number;   // Refreshes bem-sucedidos
  failedRefreshes: number;       // Refreshes que falharam
  averageRefreshTime: number;    // Tempo médio de refresh em ms
  activeRefreshes: number;       // Refreshes em execução
  queuedRefreshes: number;       // Refreshes na fila
}
```

**Usage:**
```typescript
const stats = locationRefreshManager.getStats();
console.log(`Taxa de sucesso: ${(stats.successfulRefreshes / stats.totalRefreshes * 100).toFixed(1)}%`);
```

## RefreshUtils Methods

### schedulePeriodicRefresh(intervalMs?)

Agenda refresh periódico automático de todas as localizações.

**Parameters:**
- `intervalMs?` (number): Intervalo em milissegundos (padrão: 15 minutos)

**Returns:**
```typescript
() => void // Função para cancelar o refresh periódico
```

**Usage:**
```typescript
// Agendar refresh a cada 10 minutos
const stopRefresh = refreshUtils.schedulePeriodicRefresh(10 * 60 * 1000);

// Cancelar quando necessário
stopRefresh();
```

### prefreshPopularLocations(locationIds)

Executa refresh preventivo de localizações populares para melhorar performance.

**Parameters:**
- `locationIds` (string[]): Array de IDs de localizações populares

**Returns:**
```typescript
Promise<void>
```

**Usage:**
```typescript
const popularLocations = ['loc_1', 'loc_2', 'loc_3'];
await refreshUtils.prefreshPopularLocations(popularLocations);
```

### emergencyRefresh(locationIds)

Executa refresh de emergência com prioridade máxima para localizações críticas.

**Parameters:**
- `locationIds` (string[]): Array de IDs de localizações críticas

**Returns:**
```typescript
string[] // Array de Task IDs para acompanhamento
```

**Usage:**
```typescript
const criticalLocations = ['loc_emergency_1', 'loc_emergency_2'];
const taskIds = refreshUtils.emergencyRefresh(criticalLocations);
```

## AppointmentService Methods

### getSpecialties()

Retrieves all available medical specialties.

**Returns:**
```typescript
Promise<string[]>
```

**Usage:**
```typescript
const specialties = await appointmentService.getSpecialties();
```

### getDoctorsByLocationAndSpecialty(specialty, city, state)

Busca médicos que correspondem aos critérios de localização e especialidade especificados. Utiliza a função otimizada `get_doctors_by_location_and_specialty` do Supabase.

**Parameters:**
- `specialty` (string): Especialidade médica (ex: "Cardiologia", "Pediatria")
- `city` (string): Nome da cidade (ex: "Belo Horizonte", "São Paulo")
- `state` (string): Sigla do estado (ex: "MG", "SP")

**Returns:**
```typescript
Promise<DoctorWithLocation[]>
```

**Funcionalidades:**
- Busca eficiente por especialidade usando operador `ANY` em arrays
- Filtragem geográfica precisa por cidade e estado
- Retorna dados completos do médico e local de atendimento
- Performance otimizada com JOINs eficientes
- Ordenação alfabética por nome do médico

**Usage:**
```typescript
const doctors = await appointmentService.getDoctorsByLocationAndSpecialty(
  'Cardiologia', 
  'Belo Horizonte', 
  'MG'
);

// Resultado inclui informações completas:
// - Dados do médico (nome, CRM, especialidades)
// - Dados do local (nome, endereço, telefone)
// - Localização geográfica (cidade, estado)
```

### getAvailableSlotsByDoctor(doctorId, date)

Gets available appointment time slots for a specific doctor on a given date.

**Parameters:**
- `doctorId` (string): Doctor's unique identifier
- `date` (string): Date in YYYY-MM-DD format

**Returns:**
```typescript
Promise<LocalComHorarios[]>
```

**Usage:**
```typescript
const slots = await appointmentService.getAvailableSlotsByDoctor(
  selectedDoctor, 
  selectedDate
);
```

### scheduleAppointment(appointmentData)

Creates a new appointment record in the system.

**Parameters:**
```typescript
{
  paciente_id: string;           // Patient ID
  medico_id: string;             // Doctor ID
  data_consulta: string;         // ISO datetime string
  tipo_consulta: string;         // Consultation type/specialty
  local_id: string;              // Location ID
  local_consulta_texto: string;  // Human-readable location
}
```

**Returns:**
```typescript
Promise<void>
```

**Usage:**
```typescript
await appointmentService.scheduleAppointment({
  paciente_id: user.id,
  medico_id: selectedDoctor,
  data_consulta: appointmentDateTime,
  tipo_consulta: selectedSpecialty,
  local_id: selectedLocal.id,
  local_consulta_texto: localTexto,
});
```

## Data Types

### Location Analytics Types

#### LocationAnalytics
```typescript
interface LocationAnalytics {
  locationId: string;           // Identificador único da localização
  totalViews: number;           // Total de visualizações
  totalSelections: number;      // Total de seleções
  selectionRate: number;        // Taxa de conversão (seleções/visualizações)
  averageRating: number;        // Avaliação média (1-5 estrelas)
  totalRatings: number;         // Total de avaliações recebidas
  popularityScore: number;      // Score calculado de popularidade
  lastUpdated: string;          // Última atualização dos dados
}
```

#### LocationFeedback
```typescript
interface LocationFeedback {
  id: string;                   // Identificador único do feedback
  locationId: string;           // ID da localização
  userId: string;               // ID do usuário
  rating: number;               // Avaliação de 1-5 estrelas
  comment?: string;             // Comentário opcional
  feedbackType: 'rating' | 'correction' | 'suggestion';  // Tipo de feedback
  category?: 'facilities' | 'contact' | 'hours' | 'accessibility' | 'general';
  isVerified: boolean;          // Se o feedback foi verificado
  createdAt: string;            // Data de criação
  updatedAt: string;            // Data de atualização
}
```

#### LocationCorrection
```typescript
interface LocationCorrection {
  id: string;                   // Identificador único da correção
  locationId: string;           // ID da localização
  userId: string;               // ID do usuário que sugeriu
  fieldName: string;            // Campo que precisa de correção
  currentValue: string;         // Valor atual
  suggestedValue: string;       // Valor sugerido
  description?: string;         // Descrição da correção
  status: 'pending' | 'approved' | 'rejected';  // Status da correção
  createdAt: string;            // Data de criação
  reviewedAt?: string;          // Data de revisão
  reviewedBy?: string;          // Quem revisou
}
```

#### LocationInteraction
```typescript
interface LocationInteraction {
  id: string;                   // Identificador único da interação
  locationId: string;           // ID da localização
  userId?: string;              // ID do usuário (opcional para tracking anônimo)
  sessionId: string;            // ID da sessão
  interactionType: 'view' | 'select' | 'call' | 'map' | 'share' | 'compare';
  timestamp: string;            // Timestamp da interação
  metadata?: {
    duration?: number;          // Tempo gasto em milissegundos
    source?: string;            // Como chegou à localização
    device?: 'mobile' | 'tablet' | 'desktop';  // Tipo de dispositivo
  };
}
```

#### LocationPopularityIndicator
```typescript
interface LocationPopularityIndicator {
  locationId: string;           // ID da localização
  popularityLevel: 'baixa' | 'média' | 'alta' | 'muito_alta';  // Nível de popularidade
  popularityScore: number;      // Score numérico de popularidade
  trendDirection: 'crescendo' | 'estável' | 'decrescendo';     // Direção da tendência
  recentSelections: number;     // Seleções dos últimos 7 dias
  comparisonToAverage: number;  // Percentual acima/abaixo da média
}
```

#### FeedbackSubmission
```typescript
interface FeedbackSubmission {
  locationId: string;           // ID da localização
  rating?: number;              // Avaliação opcional (1-5)
  comment?: string;             // Comentário opcional
  feedbackType: 'rating' | 'correction' | 'suggestion';  // Tipo de feedback
  category?: string;            // Categoria do feedback
  correctionData?: {            // Dados de correção se aplicável
    fieldName: string;          // Campo a ser corrigido
    currentValue: string;       // Valor atual
    suggestedValue: string;     // Valor sugerido
  };
}
```

#### AnalyticsFilters
```typescript
interface AnalyticsFilters {
  dateRange?: {                 // Filtro por período
    start: string;              // Data de início
    end: string;                // Data de fim
  };
  locationIds?: string[];       // Filtro por localizações específicas
  interactionTypes?: string[];  // Filtro por tipos de interação
  deviceTypes?: string[];       // Filtro por tipos de dispositivo
}
```

### Location Refresh Manager Types

#### RefreshPriority
```typescript
type RefreshPriority = 'critical' | 'normal' | 'background';
```

#### RefreshStatus
```typescript
type RefreshStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
```

#### RefreshTask
```typescript
interface RefreshTask {
  id: string;                    // Identificador único da task
  locationId?: string;           // ID da localização (para refresh específico)
  priority: RefreshPriority;     // Prioridade da task
  status: RefreshStatus;         // Status atual da task
  createdAt: Date;              // Data/hora de criação
  startedAt?: Date;             // Data/hora de início da execução
  completedAt?: Date;           // Data/hora de conclusão
  error?: string;               // Mensagem de erro (se houver)
  retryCount: number;           // Número de tentativas realizadas
  maxRetries: number;           // Número máximo de tentativas
}
```

#### RefreshStats
```typescript
interface RefreshStats {
  totalRefreshes: number;        // Total de refreshes executados
  successfulRefreshes: number;   // Refreshes bem-sucedidos
  failedRefreshes: number;       // Refreshes que falharam
  averageRefreshTime: number;    // Tempo médio de refresh em ms
  activeRefreshes: number;       // Refreshes em execução no momento
  queuedRefreshes: number;       // Refreshes aguardando na fila
}
```

### Communication Service Types

#### ShareLocationData
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
```

#### CommunicationResult
```typescript
interface CommunicationResult {
  success: boolean;
  error?: string;
  message?: string;
  provider?: string;
  fallbackUsed?: boolean;
}
```

#### PhoneCallOptions
```typescript
interface PhoneCallOptions {
  useWhatsApp?: boolean;
  fallbackToWhatsApp?: boolean;
  showConfirmation?: boolean;
}
```

#### ShareOptions
```typescript
interface ShareOptions {
  includeDirections?: boolean;
  includeOperatingHours?: boolean;
  includeFacilities?: boolean;
  customMessage?: string;
  format?: 'simple' | 'detailed' | 'appointment';
}
```

### Maps Service Types

#### MapsProvider
```typescript
type MapsProvider = 'google' | 'openstreetmap' | 'apple' | 'waze';
```

#### MapsConfig
```typescript
interface MapsConfig {
  defaultProvider: MapsProvider;
  fallbackProviders: MapsProvider[];
  googleMapsApiKey?: string;
}
```

#### LocationCoordinates
```typescript
interface LocationCoordinates {
  lat: number;
  lng: number;
  precisao: 'exata' | 'aproximada';
}
```

#### EnhancedLocation
```typescript
interface EnhancedLocation {
  id: string;
  nome_local: string;
  coordenadas?: LocationCoordinates;
  endereco: {
    logradouro: string;
    numero: string;
    cidade: string;
    uf: string;
    cep?: string;
  };
  telefone?: string;
  // Additional location properties
}
```

### StateInfo
```typescript
interface StateInfo {
  uf: string; // Brazilian state abbreviation
}
```

### CityInfo
```typescript
interface CityInfo {
  cidade: string;        // City name
  estado: string;        // State abbreviation
  total_medicos: number; // Number of doctors in the city
}
```

### LocalComHorarios
```typescript
interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco: {
    logradouro: string; // Street address
    numero: string;     // Street number
  };
  // Additional location properties
}
```

### Medico
```typescript
interface Medico {
  id: string;
  // Additional doctor properties
  // (specific fields depend on implementation)
}
```

## Testing and Validation Scripts

### testar-cidades-mg.js

Script abrangente para teste de cidades e médicos em Minas Gerais, validando a integridade dos dados e funcionalidade das APIs de busca.

**Funcionalidades:**
- Testa a função `get_available_cities` para o estado de MG
- Valida busca de médicos por especialidade e localização em cada cidade
- Testa múltiplas especialidades: Cardiologia, Pediatria, Clínica Geral
- Fornece estatísticas detalhadas sobre disponibilidade de médicos por cidade
- Identifica cidades sem médicos para garantia de qualidade dos dados
- Utiliza ES modules com carregamento adequado de variáveis de ambiente

**Execução:**
```bash
node testar-cidades-mg.js
```

**Saída Esperada:**
```
🔍 TESTANDO CIDADES EM MINAS GERAIS

📋 Cidades retornadas pela função get_available_cities para MG:
   Total de cidades: 2
   1. Belo Horizonte (15 médicos)
   2. Uberlândia (8 médicos)

🔍 Testando busca de médicos em cada cidade:

🔸 Testando Belo Horizonte/MG:
   Cardiologia: 5 médicos
   Pediatria: 3 médicos
   Clínica Geral: 7 médicos
   📊 Total verificado: 15 médicos

🔸 Testando Uberlândia/MG:
   Cardiologia: 2 médicos
   Pediatria: 2 médicos
   Clínica Geral: 4 médicos
   📊 Total verificado: 8 médicos

✅ Teste de cidades em MG concluído!
```

**Validações Realizadas:**
- Conectividade com Supabase usando variáveis de ambiente
- Integridade da função `get_available_cities`
- Precisão da função `get_doctors_by_location_and_specialty`
- Consistência entre contagem de médicos e dados reais
- Identificação de inconsistências nos dados

**Dependências:**
- Arquivo `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Acesso às funções RPC do Supabase
- Políticas RLS configuradas para acesso público aos dados de médicos

**Casos de Uso:**
- Validação após atualizações no banco de dados
- Verificação de integridade dos dados de localização
- Teste de performance das funções de busca
- Identificação de problemas de configuração RLS
- Monitoramento da qualidade dos dados de médicos

## Error Handling

All API methods should be wrapped in try-catch blocks:

```typescript
try {
  const result = await appointmentService.someMethod();
  // Handle success
} catch (error) {
  logger.error("Operation failed", "context", error);
  toast({ 
    title: "Error message", 
    variant: "destructive" 
  });
}
```

## Authentication

All API calls require user authentication. The `useAuth` hook provides the current user context:

```typescript
const { user } = useAuth();
if (!user) {
  // Handle unauthenticated state
  return;
}
```

## Rate Limiting

Consider implementing rate limiting for API calls to prevent abuse and ensure system stability.

## Caching

The system uses React Query for caching API responses. Consider implementing appropriate cache invalidation strategies for real-time data updates.

## LocationAnalyticsService Methods

### trackLocationView(locationId, metadata?)

Registra uma visualização de localização para análise de popularidade e comportamento do usuário.

**Parameters:**
- `locationId` (string): Identificador único da localização
- `metadata?` (object): Metadados opcionais da interação
  - `duration?` (number): Tempo gasto visualizando em milissegundos
  - `source?` (string): Como o usuário chegou à localização
  - `device?` (string): Tipo de dispositivo ('mobile' | 'tablet' | 'desktop')

**Returns:**
```typescript
Promise<void>
```

**Usage:**
```typescript
await locationAnalyticsService.trackLocationView('loc_123', {
  duration: 5000,
  source: 'search',
  device: 'mobile'
});
```

### trackLocationSelection(locationId, metadata?)

Registra uma seleção de localização para cálculo de taxa de conversão.

**Parameters:**
- `locationId` (string): Identificador único da localização
- `metadata?` (object): Metadados opcionais da seleção

**Returns:**
```typescript
Promise<void>
```

### trackLocationInteraction(interaction)

Registra uma interação específica com uma localização.

**Parameters:**
- `interaction` (LocationInteraction): Dados da interação
  - `locationId` (string): ID da localização
  - `userId?` (string): ID do usuário (opcional para tracking anônimo)
  - `sessionId` (string): ID da sessão
  - `interactionType` ('view' | 'select' | 'call' | 'map' | 'share' | 'compare'): Tipo de interação
  - `metadata?` (object): Metadados adicionais

**Returns:**
```typescript
Promise<void>
```

**Usage:**
```typescript
await locationAnalyticsService.trackLocationInteraction({
  locationId: 'loc_123',
  userId: 'user_456',
  sessionId: 'session_789',
  interactionType: 'call',
  metadata: {
    device: 'mobile',
    source: 'appointment_booking'
  }
});
```

### getLocationAnalytics(locationId)

Obtém dados analíticos completos de uma localização específica.

**Parameters:**
- `locationId` (string): Identificador único da localização

**Returns:**
```typescript
Promise<LocationAnalytics>
```

**Usage:**
```typescript
const analytics = await locationAnalyticsService.getLocationAnalytics('loc_123');
console.log(`Taxa de conversão: ${(analytics.selectionRate * 100).toFixed(1)}%`);
console.log(`Avaliação média: ${analytics.averageRating.toFixed(1)} estrelas`);
```

### getPopularityIndicators(locationIds)

Obtém indicadores de popularidade para múltiplas localizações.

**Parameters:**
- `locationIds` (string[]): Array de identificadores de localização

**Returns:**
```typescript
Promise<LocationPopularityIndicator[]>
```

**Usage:**
```typescript
const indicators = await locationAnalyticsService.getPopularityIndicators(['loc_1', 'loc_2']);
indicators.forEach(indicator => {
  console.log(`${indicator.locationId}: ${indicator.popularityLevel} (${indicator.trendDirection})`);
});
```

### submitFeedback(feedback)

Submete feedback ou avaliação para uma localização.

**Parameters:**
- `feedback` (FeedbackSubmission): Dados do feedback
  - `locationId` (string): ID da localização
  - `rating?` (number): Avaliação de 1-5 estrelas
  - `comment?` (string): Comentário opcional
  - `feedbackType` ('rating' | 'correction' | 'suggestion'): Tipo de feedback
  - `category?` (string): Categoria do feedback
  - `correctionData?` (object): Dados de correção se aplicável

**Returns:**
```typescript
Promise<string> // ID do feedback criado
```

**Usage:**
```typescript
const feedbackId = await locationAnalyticsService.submitFeedback({
  locationId: 'loc_123',
  rating: 5,
  comment: 'Excelente atendimento e instalações modernas',
  feedbackType: 'rating',
  category: 'general'
});
```

### getLocationFeedback(locationId)

Obtém todos os feedbacks de uma localização específica.

**Parameters:**
- `locationId` (string): Identificador único da localização

**Returns:**
```typescript
Promise<LocationFeedback[]>
```

### submitCorrection(correction)

Submete uma correção para informações desatualizadas de uma localização.

**Parameters:**
- `correction` (LocationCorrection): Dados da correção
  - `locationId` (string): ID da localização
  - `userId` (string): ID do usuário que sugere a correção
  - `fieldName` (string): Campo que precisa de correção
  - `currentValue` (string): Valor atual
  - `suggestedValue` (string): Valor sugerido
  - `description?` (string): Descrição da correção

**Returns:**
```typescript
Promise<string> // ID da correção criada
```

**Usage:**
```typescript
const correctionId = await locationAnalyticsService.submitCorrection({
  locationId: 'loc_123',
  userId: 'user_456',
  fieldName: 'telefone',
  currentValue: '(11) 1234-5678',
  suggestedValue: '(11) 9876-5432',
  description: 'Número de telefone atualizado conforme informado pela recepção'
});
```

### getLocationRating(locationId)

Obtém a avaliação média e contagem total de avaliações de uma localização.

**Parameters:**
- `locationId` (string): Identificador único da localização

**Returns:**
```typescript
Promise<{ average: number; count: number }>
```

### getUserLocationRating(locationId, userId)

Obtém a avaliação específica de um usuário para uma localização.

**Parameters:**
- `locationId` (string): Identificador único da localização
- `userId` (string): Identificador único do usuário

**Returns:**
```typescript
Promise<LocationFeedback | null>
```

## Configuration Management

### Environment Variables

The application requires specific environment variables for Supabase integration:

**Required Variables:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `VITE_APP_ENV`: Application environment identifier (development/production)

**Configuration Validation:**
The system includes built-in validation through the `SupabaseConfigWarning` component, which automatically detects missing or incorrect configuration and provides user-friendly setup instructions.

### Build Configuration

The application uses Vite with advanced optimization strategies:

**Development Server:**
- **Port**: 8080 (fixed to avoid conflicts)
- **Host**: `::` (IPv4 and IPv6 support)
- **Hot Module Replacement**: Enabled via React SWC

**Bundle Optimization:**
- **Manual Chunking**: Intelligent chunk splitting strategy
  - React/React-DOM: Kept in main chunk to prevent createContext issues
  - Supabase: Separate vendor chunk for better caching
  - UI Components: Separate chunk for Lucide React and Radix UI
- **Minification**: Terser in production, disabled in development
- **Sourcemaps**: Enabled only in development mode
- **Bundle Analysis**: Automatic generation of `dist/stats.html` in production builds

**Performance Optimizations:**
- **Dependency Pre-bundling**: Critical dependencies are pre-bundled for faster dev server startup
- **Target ES2015**: Balance between bundle size and browser compatibility
- **Path Aliases**: `@/*` maps to `./src/*` for cleaner imports

## Testing and Debugging

### Environment Configuration Testing

The `test-env-vars.js` script validates environment variable configuration:

**Features:**
- Checks for `.env` file existence in project root
- Lists all configured environment variables from `.env` file
- Validates required environment variables for Supabase integration
- Provides clear success/failure feedback with emojis
- Uses ES modules with proper file path resolution

**Required Environment Variables:**
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public key  
- `VITE_APP_ENV`: Application environment identifier

**Usage:**
```sh
# Run environment configuration validation
node test-env-vars.js
```

**Sample Output:**
```
🔍 Verificando configuração do ambiente...
📁 Arquivo .env existe: true
📋 Variáveis encontradas no .env:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_APP_ENV

🔍 Variáveis de ambiente do processo:
  VITE_SUPABASE_URL: ✅ Configurada
  VITE_SUPABASE_ANON_KEY: ✅ Configurada
  VITE_APP_ENV: ✅ Configurada

✅ Verificação concluída!
```

### Time Slot Generation Testing

The `test-horarios-debug.js` script provides standalone testing for the appointment scheduling algorithm:

**generateTimeSlots(config, selectedDate, existingAppointments)**

Tests the core time slot generation functionality with configurable parameters.

**Parameters:**
- `config` (object): Working hours configuration with consultation duration
- `selectedDate` (Date): Target date for slot generation
- `existingAppointments` (array): Optional array of existing bookings to exclude

**Returns:**
```typescript
TimeSlot[] = {
  time: string;      // HH:MM format
  available: boolean; // Availability status
}[]
```

**Test Configuration Example:**
```javascript
const testConfig = {
  duracaoConsulta: 30,
  horarioAtendimento: {
    segunda: [
      { inicio: '08:00', fim: '12:00', ativo: true },
      { inicio: '14:00', fim: '18:00', ativo: true }
    ]
  }
};
```

**Usage:**
```sh
# Run time slot generation test
node test-horarios-debug.js
```

The test script validates:
- Correct slot generation for configured days
- Proper handling of days without configuration
- Accurate time calculations and formatting
- Consultation duration adherence

### Doctor Configuration Debugging

The `debug-doctor-config.js` script provides comprehensive analysis of doctor configurations in the system:

**Features:**
- Direct database access using hardcoded Supabase credentials
- Analysis of doctor profiles, specialties, and working hours
- Validation of location-based doctor search functionality
- Testing of appointment scheduling configurations
- Detailed output for troubleshooting doctor setup issues

**Security Considerations:**
- Contains hardcoded database credentials for development use only
- Should not be used in production environments
- Credentials should be removed before committing to version control

**Usage:**
```sh
# Run doctor configuration debug
node debug-doctor-config.js
```

**Output Analysis:**
The script provides detailed information about:
- Doctor profiles with display names and IDs
- Associated medical specialties
- Active service locations
- Working hours configuration by day of week
- Active time blocks with lunch break handling
- Location-based search functionality testing

### Location Data Debugging

The `debug-locations.js` script provides specialized debugging for location data and doctor search functionality:

**Features:**
- Direct database access using hardcoded Supabase credentials
- Comprehensive analysis of `locais_atendimento` table data
- Validation of doctor-location relationships
- Testing of `get_doctors_by_location_and_specialty` RPC function
- Geographic data verification (cities, states)
- Address data structure analysis

**Key Functionality:**
- **Location Inventory**: Lists all service locations with associated doctor information
- **Geographic Analysis**: Identifies unique city/state combinations in the system
- **Search Function Testing**: Tests the core location-based doctor search with real data
- **Data Relationship Validation**: Verifies connections between doctors, locations, and specialties
- **Address Structure Review**: Analyzes address data format and completeness

**Security Considerations:**
- Contains hardcoded database credentials for development use only
- Should not be used in production environments
- Credentials should be removed before committing to version control

**Usage:**
```sh
# Run location data debugging
node debug-locations.js
```

**Output Analysis:**
The script provides detailed information about:
- Complete inventory of service locations (`locais_atendimento`)
- Doctor names and specialties for each location
- Location status (active/inactive)
- Address data structure and completeness
- Unique geographic locations (city/state combinations)
- Real-world testing of `get_doctors_by_location_and_specialty` function
- Search result validation with actual data

**Sample Output Structure:**
```
🔍 Verificando localizações dos médicos...

✅ Encontrados X locais de atendimento

🏥 Local: [Nome do Local]
   Médico: [Nome do Médico]
   Especialidades: [Lista de Especialidades]
   Ativo: Sim/Não
   Endereço: [Estrutura JSON do endereço]

📍 Localizações únicas encontradas:
   - Cidade, UF
   - ...

🔍 Testando função get_doctors_by_location_and_specialty...
✅ Resultado: X médico(s) encontrado(s)
   - [Nome do Médico] (ID: [ID])
```

**Use Cases:**
- Debugging location-based search issues
- Validating geographic data integrity
- Testing doctor-location relationships
- Verifying address data structure
- Troubleshooting search function performance