# Design Document

## Overview

Este documento descreve o design para corrigir o componente `DateSelect` no sistema de agendamento. O problema atual é uma incompatibilidade de interface entre o componente existente e como ele está sendo usado na página de agendamento. A solução envolve atualizar o componente para aceitar as props necessárias e implementar a lógica de navegação e validação de disponibilidade.

## Architecture

### Component Structure
```
DateSelect (Updated)
├── DatePickerSection (Calendar UI)
├── NavigationButtons (Previous/Next)
├── LoadingState (Availability loading)
└── ErrorState (Error handling)
```

### Data Flow
1. **Input**: `doctorId`, `selectedDate`, `onDateSelect`, `onNext`, `onPrevious`
2. **Processing**: Fetch doctor availability, validate selection
3. **Output**: Date selection, navigation actions

## Components and Interfaces

### Updated DateSelect Interface
```typescript
interface DateSelectProps {
  doctorId: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  disabled?: boolean;
}
```

### Supporting Hooks/Services
- `useAvailableDates(doctorId)`: Hook para buscar datas disponíveis
- `appointmentService.getAvailableDates()`: Service method para API calls

### Component Layout
```
┌─────────────────────────────────────┐
│ Seleção de Data                     │
├─────────────────────────────────────┤
│ [Calendar Component]                │
│   - Datas disponíveis: enabled     │
│   - Datas indisponíveis: disabled  │
│   - Data selecionada: highlighted  │
├─────────────────────────────────────┤
│ [◀ Anterior]    [Próximo ▶]        │
│                 (disabled if no     │
│                  date selected)     │
└─────────────────────────────────────┘
```

## Data Models

### Available Dates Response
```typescript
interface AvailableDatesResponse {
  doctorId: string;
  availableDates: string[]; // Array of YYYY-MM-DD strings
  unavailableDates: string[];
}
```

### Component State
```typescript
interface DateSelectState {
  availableDates: string[];
  isLoading: boolean;
  error: string | null;
}
```

## Error Handling

### Error Scenarios
1. **Network Error**: Falha ao carregar datas disponíveis
2. **Invalid Doctor ID**: ID do médico inválido ou não encontrado
3. **No Available Dates**: Médico sem datas disponíveis

### Error Recovery
- Retry mechanism para network errors
- Fallback para mostrar todas as datas se API falhar
- Clear error messages para o usuário

### Error UI States
```typescript
const ErrorStates = {
  NETWORK_ERROR: "Erro ao carregar datas disponíveis. Tente novamente.",
  NO_DOCTOR: "Médico não encontrado. Volte e selecione novamente.",
  NO_DATES: "Este médico não possui datas disponíveis no momento."
};
```

## Testing Strategy

### Unit Tests
- Component rendering with different props
- Date selection functionality
- Navigation button behavior
- Loading and error states
- Accessibility compliance

### Integration Tests
- Integration with appointment scheduling flow
- API integration for available dates
- Error handling scenarios

### Test Cases
1. **Happy Path**: Successful date selection and navigation
2. **Loading State**: Component behavior during API calls
3. **Error Handling**: Various error scenarios
4. **Accessibility**: Keyboard navigation and screen reader support
5. **Responsive Design**: Mobile and desktop layouts

### Mock Data Strategy
```typescript
const mockAvailableDates = {
  doctorId: "doc-123",
  availableDates: ["2025-01-30", "2025-01-31", "2025-02-01"],
  unavailableDates: ["2025-01-29"]
};
```

## Implementation Notes

### Key Changes Required
1. Update `DateSelect` component interface
2. Add navigation buttons with proper styling
3. Implement availability checking logic
4. Add loading and error states
5. Ensure accessibility compliance

### Styling Consistency
- Use existing Card/Button components for consistency
- Follow the same navigation pattern as other scheduling steps
- Maintain responsive design principles

### Performance Considerations
- Cache available dates to avoid repeated API calls
- Debounce date availability checks
- Lazy load calendar component if needed

## Dependencies

### External Libraries
- `date-fns`: Date formatting and manipulation
- `@/components/ui/*`: Existing UI components
- `lucide-react`: Icons for navigation buttons

### Internal Dependencies
- `useAvailableDates` hook (to be created)
- `appointmentService`: Existing service for API calls
- Existing scheduling components for styling consistency