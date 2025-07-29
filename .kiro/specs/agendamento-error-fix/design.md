# Design Document

## Overview

O erro "Cannot read properties of undefined (reading 'length')" está ocorrendo na página de agendamento devido à falta de verificações de tipo adequadas nos componentes de scheduling. O problema principal está nos componentes que tentam acessar a propriedade `length` de arrays que podem estar `undefined` durante o carregamento inicial ou em estados de erro.

### Análise do Problema

1. **Localização do Erro**: O erro está ocorrendo principalmente no componente `SpecialtySelect.tsx` na linha 36, onde `specialties.length` é acessado sem verificar se `specialties` existe.

2. **Causa Raiz**: Durante o carregamento inicial da página de agendamento, os dados são carregados assincronamente através do hook `useNewAppointmentScheduling`. Há um período onde os arrays (`specialties`, `states`, `cities`, `doctors`, etc.) podem estar `undefined` antes de serem inicializados.

3. **Impacto**: O erro quebra a aplicação e impede que os usuários acessem a funcionalidade de agendamento.

## Architecture

### Componentes Afetados

1. **SpecialtySelect.tsx** - Acessa `specialties.length` sem verificação
2. **StateSelect.tsx** - Acessa `states.length` sem verificação  
3. **CitySelect.tsx** - Acessa `cities.length` sem verificação
4. **DoctorSelect.tsx** - Acessa `doctors.length` sem verificação
5. **TimeSlotGrid.tsx** - Acessa `timeSlots.length` sem verificação

### Hook de Estado

O hook `useNewAppointmentScheduling` inicializa os arrays como vazios `[]`, mas há momentos durante o ciclo de vida onde eles podem ser `undefined` devido a:
- Estados de carregamento assíncrono
- Erros de rede
- Falhas na inicialização de dados

## Components and Interfaces

### 1. Defensive Programming Pattern

Implementar verificações defensivas em todos os componentes que acessam propriedades de arrays:

```typescript
// Antes (problemático)
{specialties.length > 0 ? (
  specialties.map(...)
) : (
  <div>Nenhuma especialidade disponível</div>
)}

// Depois (seguro)
{specialties && specialties.length > 0 ? (
  specialties.map(...)
) : (
  <div>Nenhuma especialidade disponível</div>
)}
```

### 2. Type Guards e Utility Functions

Criar funções utilitárias para verificação de arrays:

```typescript
const isValidArray = <T>(arr: T[] | undefined | null): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

const safeArrayAccess = <T>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};
```

### 3. Enhanced Error Boundary

Melhorar o Error Boundary existente para capturar e reportar erros específicos de propriedades undefined:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Log específico para erros de propriedades undefined
  if (error.message.includes("Cannot read properties of undefined")) {
    console.error('Undefined property access error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Data Models

### State Management Enhancement

Modificar o hook `useNewAppointmentScheduling` para garantir inicialização segura:

```typescript
// Estado inicial seguro
const [specialties, setSpecialties] = useState<string[]>([]);
const [states, setStates] = useState<StateInfo[]>([]);
const [cities, setCities] = useState<CityInfo[]>([]);
const [doctors, setDoctors] = useState<Medico[]>([]);

// Verificações antes de setState
const safeSetSpecialties = (data: string[] | undefined) => {
  setSpecialties(Array.isArray(data) ? data : []);
};
```

### Loading States

Implementar estados de carregamento mais granulares:

```typescript
interface LoadingStates {
  specialties: boolean;
  states: boolean;
  cities: boolean;
  doctors: boolean;
  timeSlots: boolean;
}
```

## Error Handling

### 1. Component-Level Error Handling

Cada componente de scheduling deve ter sua própria verificação de erro:

```typescript
export const SpecialtySelect = ({ specialties, ...props }) => {
  // Verificação defensiva no início do componente
  const safeSpecialties = Array.isArray(specialties) ? specialties : [];
  
  return (
    <div className="space-y-2">
      {/* Resto do componente usando safeSpecialties */}
    </div>
  );
};
```

### 2. Hook-Level Error Recovery

Implementar recuperação automática de erros no hook:

```typescript
const handleDataLoadError = useCallback((error: Error, dataType: string) => {
  console.error(`Erro ao carregar ${dataType}:`, error);
  
  // Tentar recuperação automática
  if (retryCount < MAX_RETRIES) {
    setTimeout(() => {
      // Retentar carregamento
    }, RETRY_DELAY);
  }
}, [retryCount]);
```

### 3. User-Friendly Error Messages

Implementar mensagens de erro amigáveis para diferentes cenários:

```typescript
const getErrorMessage = (dataType: string, error: Error) => {
  if (error.message.includes('undefined')) {
    return `Erro ao carregar ${dataType}. Tentando novamente...`;
  }
  return `Erro inesperado ao carregar ${dataType}. Tente recarregar a página.`;
};
```

## Testing Strategy

### 1. Unit Tests

Criar testes para verificar comportamento com dados undefined:

```typescript
describe('SpecialtySelect', () => {
  it('should handle undefined specialties gracefully', () => {
    render(<SpecialtySelect specialties={undefined} />);
    expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
  });
  
  it('should handle empty specialties array', () => {
    render(<SpecialtySelect specialties={[]} />);
    expect(screen.getByText('Nenhuma especialidade disponível')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Testar o fluxo completo de carregamento de dados:

```typescript
describe('Agendamento Flow', () => {
  it('should handle data loading errors gracefully', async () => {
    // Mock API failure
    mockApiCall.mockRejectedValue(new Error('Network error'));
    
    render(<Agendamento />);
    
    // Verificar que a aplicação não quebra
    expect(screen.getByText('Agendamento de Consulta')).toBeInTheDocument();
  });
});
```

### 3. Error Boundary Tests

Testar se o Error Boundary captura erros adequadamente:

```typescript
describe('Error Boundary', () => {
  it('should catch undefined property access errors', () => {
    const ThrowError = () => {
      throw new Error("Cannot read properties of undefined (reading 'length')");
    };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });
});
```

### 4. Performance Tests

Verificar que as verificações defensivas não impactam performance:

```typescript
describe('Performance', () => {
  it('should not significantly impact render time with safety checks', () => {
    const startTime = performance.now();
    
    render(<SpecialtySelect specialties={largeSpecialtiesArray} />);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
  });
});
```

## Implementation Approach

### Phase 1: Immediate Fix
1. Adicionar verificações defensivas em todos os componentes de scheduling
2. Implementar type guards e utility functions
3. Melhorar o Error Boundary

### Phase 2: Enhanced Error Handling
1. Implementar estados de carregamento granulares
2. Adicionar recuperação automática de erros
3. Implementar mensagens de erro amigáveis

### Phase 3: Testing and Monitoring
1. Criar testes abrangentes
2. Implementar logging detalhado
3. Adicionar monitoramento de erros

## Security Considerations

- Validar dados recebidos da API antes de usar
- Implementar sanitização de dados de entrada
- Evitar exposição de informações sensíveis em logs de erro

## Performance Considerations

- Minimizar verificações desnecessárias usando memoização
- Implementar lazy loading para dados não críticos
- Otimizar re-renders com React.memo onde apropriado