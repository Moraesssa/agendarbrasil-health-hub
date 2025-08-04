# Location Data Management System

Este documento descreve o sistema completo de gerenciamento de dados de localização implementado para o AgendarBrasil Health Hub.

## Visão Geral

O sistema de gerenciamento de dados de localização fornece:

- **Caching inteligente** com estratégias LRU e TTL
- **Validação abrangente** de dados de localização
- **Tratamento robusto de erros** com estratégias de recuperação
- **Refresh automático e manual** de dados
- **Atualizações em tempo real** via Supabase
- **Integração com React Query** para gerenciamento de estado

## Componentes Principais

### 1. Location Cache Manager (`locationCacheManager.ts`)

Gerencia o cache inteligente de dados de localização com recursos avançados.

#### Funcionalidades:
- Cache LRU com eviction automática
- TTL configurável por entrada
- Warm-up de cache para dados frequentemente acessados
- Estatísticas detalhadas de performance
- Otimização automática de cache

#### Exemplo de Uso:

```typescript
import { locationCacheManager, cacheUtils } from '@/utils/locationCacheManager';

// Armazenar dados no cache
const key = cacheUtils.locationKey('location-123');
locationCacheManager.set(key, locationData, { ttl: 15 * 60 * 1000 });

// Recuperar dados do cache
const cachedData = locationCacheManager.get(key);

// Verificar estatísticas
const stats = locationCacheManager.getStats();
console.log(`Hit rate: ${stats.hitRate}%`);

// Warm-up do cache
await locationCacheManager.warmUp([
  {
    key: 'popular_locations',
    fetcher: () => fetchPopularLocations(),
    priority: 3
  }
]);
```

### 2. Location Validator (`locationValidation.ts`)

Fornece validação abrangente de dados de localização.

#### Funcionalidades:
- Validação de campos obrigatórios
- Validação de formatos (telefone, email, CEP, coordenadas)
- Validação de horários de funcionamento
- Validação cruzada de campos
- Validação de regras de negócio

#### Exemplo de Uso:

```typescript
import { locationValidator, validationUtils } from '@/utils/locationValidation';

// Validar localização completa
const result = await locationValidator.validateLocation(locationData);

if (!result.is_valid) {
  const errorMessages = validationUtils.formatValidationErrors(result.errors);
  console.log('Erros de validação:', errorMessages);
}

// Validar campo específico
const phoneValidation = await locationValidator.validateField('telefone', '(11) 1234-5678');

// Usar utilitários de validação
const isValidPhone = validationUtils.validatePhone('(11) 1234-5678');
const isValidEmail = validationUtils.validateEmail('contato@hospital.com');
```

### 3. Location Error Handler (`locationErrorHandler.ts`)

Trata erros de forma inteligente com estratégias de recuperação.

#### Funcionalidades:
- Classificação automática de erros
- Estratégias de recuperação (retry, fallback, escalation)
- Mensagens de erro amigáveis ao usuário
- Detecção de padrões de erro
- Estatísticas de erro

#### Exemplo de Uso:

```typescript
import { locationErrorHandler, errorUtils } from '@/utils/locationErrorHandler';

try {
  const locationData = await fetchLocationData(locationId);
} catch (error) {
  const context = errorUtils.createContext('fetch_location', locationId);
  const recovery = await locationErrorHandler.handleError(error, context);
  
  if (recovery.success) {
    // Usar dados de fallback
    const fallbackData = recovery.fallbackData;
  } else {
    // Mostrar mensagem de erro ao usuário
    showErrorMessage(recovery.userMessage);
  }
}

// Verificar padrões de erro
const patterns = locationErrorHandler.detectErrorPatterns();
if (patterns.hasPattern) {
  console.log('Padrão detectado:', patterns.pattern);
  console.log('Recomendação:', patterns.recommendation);
}
```

### 4. Location Refresh Manager (`locationRefreshManager.ts`)

Gerencia refresh automático e manual de dados de localização.

#### Funcionalidades:
- Refresh com prioridades (critical, normal, background)
- Processamento em fila com controle de concorrência
- Retry automático com backoff exponencial
- Refresh em lote e individual
- Estatísticas de refresh

#### Exemplo de Uso:

```typescript
import { locationRefreshManager, refreshUtils } from '@/utils/locationRefreshManager';

// Refresh de localização específica
const taskId = locationRefreshManager.refreshLocation('location-123', 'normal');

// Refresh em lote
const bulkTaskId = locationRefreshManager.refreshLocations(['loc1', 'loc2'], 'critical');

// Refresh de todas as localizações
const allTaskId = locationRefreshManager.refreshAllLocations('background');

// Agendar refresh periódico
const cancelPeriodicRefresh = refreshUtils.schedulePeriodicRefresh(15 * 60 * 1000);

// Verificar estatísticas
const stats = locationRefreshManager.getStats();
console.log(`Taxa de sucesso: ${(stats.successfulRefreshes / stats.totalRefreshes * 100).toFixed(1)}%`);
```

## Hooks React Query

### 1. useLocationData

Hook principal para gerenciamento de dados de localização com React Query.

```typescript
import { useEnhancedLocations, useLocationWithTimeSlots } from '@/hooks/useLocationData';

// Buscar localizações com parâmetros
const { 
  locations, 
  totalCount, 
  isLoading, 
  error 
} = useEnhancedLocations({
  filters: { cidade: 'São Paulo', status: ['ativo'] },
  sort_by: 'distance',
  limit: 20
});

// Buscar localização com horários
const { 
  data: locationWithSlots, 
  isLoading: slotsLoading 
} = useLocationWithTimeSlots('location-123', '2024-01-15');
```

### 2. useLocationDataManager

Hook abrangente que integra todos os recursos de gerenciamento.

```typescript
import { useLocationDataManager } from '@/hooks/useLocationDataManager';

const manager = useLocationDataManager({
  enableRealTimeUpdates: true,
  enableAutoRefresh: true,
  enableCaching: true,
  enableValidation: true,
  refreshInterval: 15 * 60 * 1000
});

// Usar métodos do manager
const locationsQuery = manager.getLocations({ limit: 50 });
const locationQuery = manager.getLocationWithTimeSlots('location-123', '2024-01-15');

// Atualizar localização
await manager.updateLocation({
  location_id: 'location-123',
  updates: { telefone: '(11) 9999-8888' },
  source: 'manual'
});

// Verificar saúde dos dados
const health = await manager.checkDataHealth();
if (health.overall === 'critical') {
  console.log('Problemas detectados:', health.issues);
}
```

## Configuração e Setup

### 1. Configuração do React Query

O sistema já está integrado com o React Query configurado no `App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Sua aplicação */}
    </QueryClientProvider>
  );
}
```

### 2. Configuração do Supabase

As atualizações em tempo real são configuradas automaticamente no `enhancedLocationService.ts`:

```typescript
// Subscriptions são configuradas automaticamente
const statusSubscription = supabase
  .channel('location_status_changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'locais_atendimento'
  }, handleLocationStatusChange)
  .subscribe();
```

## Padrões de Uso Recomendados

### 1. Carregamento de Dados

```typescript
// Componente de lista de localizações
function LocationList() {
  const { locations, isLoading, error } = useEnhancedLocations({
    filters: { status: ['ativo'] },
    sort_by: 'distance'
  });

  if (isLoading) return <LocationSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {locations.map(location => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
}
```

### 2. Validação de Formulários

```typescript
// Hook personalizado para validação de formulário
function useLocationForm() {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const validateLocation = async (data: Partial<EnhancedLocation>) => {
    const result = await locationValidator.validateLocation(data);
    setErrors(result.errors);
    return result.is_valid;
  };

  return { validateLocation, errors };
}
```

### 3. Tratamento de Erros

```typescript
// Hook para tratamento de erros
function useLocationErrorHandling() {
  const handleError = async (error: Error, operation: string, locationId?: string) => {
    const context = errorUtils.createContext(operation, locationId);
    const recovery = await locationErrorHandler.handleError(error, context);
    
    if (recovery.success && recovery.fallbackData) {
      return recovery.fallbackData;
    }
    
    // Mostrar toast de erro
    toast.error(recovery.userMessage);
    throw error;
  };

  return { handleError };
}
```

## Monitoramento e Debugging

### 1. Estatísticas de Performance

```typescript
// Verificar performance do sistema
function LocationPerformanceMonitor() {
  const manager = useLocationDataManager();
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const stats = manager.getStatistics();
      const health = await manager.checkDataHealth();
      
      console.log('Cache hit rate:', stats.cache.hitRate);
      console.log('Error rate:', stats.errors.totalOperations > 0 
        ? (Object.values(stats.errors.errorsByType).reduce((a, b) => a + b, 0) / stats.errors.totalOperations * 100).toFixed(1) + '%'
        : '0%'
      );
      
      if (health.overall !== 'healthy') {
        console.warn('Health issues:', health.issues);
      }
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [manager]);

  return null;
}
```

### 2. Debug de Cache

```typescript
// Utilitário para debug de cache
function debugCache() {
  const stats = locationCacheManager.getStats();
  const mostAccessed = locationCacheManager.getMostAccessed(10);
  const expiring = locationCacheManager.getExpiringEntries(5 * 60 * 1000);
  
  console.log('Cache Stats:', stats);
  console.log('Most Accessed:', mostAccessed);
  console.log('Expiring Soon:', expiring);
}
```

## Testes

O sistema inclui testes abrangentes em `locationDataManagement.test.ts`:

```bash
# Executar testes
npm run test src/utils/__tests__/locationDataManagement.test.ts

# Executar testes com coverage
npm run test:coverage src/utils/__tests__/locationDataManagement.test.ts
```

## Considerações de Performance

### 1. Cache Strategy

- **Aggressive**: Para aplicações com muitos acessos repetidos
- **Normal**: Balanceamento entre performance e uso de memória
- **Minimal**: Para aplicações com restrições de memória

### 2. Refresh Strategy

- **Critical**: Para dados críticos que precisam estar sempre atualizados
- **Normal**: Para dados importantes com refresh regular
- **Background**: Para dados menos críticos com refresh em background

### 3. Validation Strategy

- Validação completa apenas quando necessário
- Validação de campos específicos para feedback em tempo real
- Cache de resultados de validação para dados estáticos

## Troubleshooting

### Problemas Comuns

1. **Cache não funcionando**: Verificar se TTL não está muito baixo
2. **Validação falhando**: Verificar se dados estão no formato correto
3. **Refresh não executando**: Verificar se queue está sendo processada
4. **Erros não sendo tratados**: Verificar se context está sendo criado corretamente

### Logs e Debugging

O sistema usa o logger centralizado para todas as operações:

```typescript
import { logger } from '@/utils/logger';

// Logs são automaticamente categorizados por contexto
logger.info('Cache hit', 'locationCacheManager', { key, hitRate });
logger.error('Validation failed', 'locationValidator', { errors });
```

## Extensibilidade

O sistema foi projetado para ser extensível:

### 1. Adicionar Novos Validadores

```typescript
locationValidator.addValidationRule('custom_field', {
  name: 'custom_validation',
  validator: (value) => customValidationLogic(value),
  message: 'Mensagem de erro personalizada',
  severity: 'warning'
});
```

### 2. Adicionar Estratégias de Cache

```typescript
// Implementar nova estratégia no locationCacheManager
locationCacheManager.addStrategy('custom_strategy', {
  shouldCache: (key, data) => customCacheLogic(key, data),
  evictionPolicy: (entries) => customEvictionLogic(entries)
});
```

### 3. Adicionar Handlers de Erro

```typescript
// Adicionar novo tipo de erro no locationErrorHandler
locationErrorHandler.addErrorType('custom_error', {
  classifier: (error) => customErrorClassification(error),
  recovery: (error, context) => customRecoveryStrategy(error, context)
});
```

Este sistema fornece uma base sólida e extensível para gerenciamento de dados de localização no AgendarBrasil Health Hub.