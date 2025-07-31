# Design Document

## Overview

Este documento detalha o design das melhorias de UX/UI para a página de agendamento, focando em navegação intuitiva e destaque visual de elementos importantes. O design segue os princípios de Material Design e mantém consistência com o design system existente do projeto.

## Architecture

### Component Structure
```
Agendamento.tsx
├── NavigationHeader (novo)
│   ├── HomeButton
│   └── BackButton
├── ProgressIndicator (melhorado)
├── StepContent
│   └── FamilyMemberSelection (melhorado - step 7)
└── NavigationFooter (melhorado)
```

### Design System Integration
- Utiliza componentes existentes do shadcn/ui
- Mantém paleta de cores atual do projeto
- Segue padrões de espaçamento e tipografia estabelecidos
- Adiciona novos tokens de design para elementos destacados

## Components and Interfaces

### 1. NavigationHeader Component
```typescript
interface NavigationHeaderProps {
  currentStep: number;
  totalSteps: number;
  onHomeClick: () => void;
  onBackClick: () => void;
  canGoBack: boolean;
}
```

**Design Specifications:**
- Posicionamento: Fixo no topo da página
- Background: Branco com sombra sutil
- Altura: 64px
- Layout: Flexbox com espaçamento entre elementos

**Elements:**
- **Home Button**: Ícone de casa + texto "Início"
  - Cor: Azul primário (#2563eb)
  - Hover: Background azul claro
  - Posição: Canto esquerdo
  
- **Back Button**: Ícone de seta + texto "Voltar"
  - Cor: Cinza escuro (#374151)
  - Hover: Background cinza claro
  - Visibilidade: Condicional (hidden em step 1)

### 2. Enhanced FamilyMemberSelection Component
```typescript
interface EnhancedFamilyMemberSelectionProps {
  selectedMemberId: string;
  onChange: (memberId: string) => void;
  familyMembers: FamilyMember[];
  currentUserId: string;
  currentUserName: string;
}
```

**Design Specifications:**
- Container: Card com border destacado (2px solid #10b981)
- Background: Gradiente sutil verde (#f0fdf4 to #ecfdf5)
- Padding: 24px
- Border radius: 12px
- Sombra: Elevada (shadow-lg)

**Visual Hierarchy:**
1. **Header Section**:
   - Ícone: 👥 (32px)
   - Título: "Agendar para" (text-xl, font-semibold)
   - Subtítulo: "Selecione para quem agendar" (text-sm, text-gray-600)

2. **Selection Cards**:
   - Layout: Grid responsivo
   - Card hover: Elevação e border highlight
   - Selected state: Border verde + background destacado
   - Ícones: Avatar ou ícone de usuário

### 3. Enhanced ProgressIndicator
```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  completedSteps: number[];
}
```

**Design Specifications:**
- Visual: Barra de progresso com steps clicáveis
- Cores: Verde para completo, azul para atual, cinza para pendente
- Animações: Transições suaves entre estados
- Responsivo: Adapta para mobile com indicador compacto

### 4. Enhanced NavigationFooter
**Design Specifications:**
- Layout: Flexbox com justify-between
- Padding: 24px
- Background: Branco com border-top sutil
- Sticky: Fixo na parte inferior

**Button Styles:**
- **Previous Button**: Outline style, ícone à esquerda
- **Next Button**: Solid style, ícone à direita
- **Confirm Button**: Gradiente verde, destaque especial

## Data Models

### NavigationState
```typescript
interface NavigationState {
  currentStep: number;
  canGoBack: boolean;
  canGoNext: boolean;
  completedSteps: number[];
  hasUnsavedChanges: boolean;
}
```

### UIFeedback
```typescript
interface UIFeedback {
  loading: boolean;
  error: string | null;
  success: string | null;
  fieldErrors: Record<string, string>;
}
```

## Error Handling

### Navigation Errors
- **Invalid Step**: Redirect para step válido mais próximo
- **Missing Data**: Highlight campos obrigatórios
- **Network Issues**: Retry automático com feedback visual

### User Feedback
- **Loading States**: Skeleton loaders e spinners
- **Success States**: Checkmarks e animações de confirmação
- **Error States**: Mensagens claras com ações sugeridas

## Testing Strategy

### Visual Testing
- Screenshot testing para diferentes breakpoints
- Teste de contraste e acessibilidade
- Validação de design tokens

### Interaction Testing
- Testes de navegação entre steps
- Validação de estados disabled/enabled
- Testes de responsividade

### User Experience Testing
- Fluxo completo de agendamento
- Teste com diferentes tipos de usuário
- Validação de feedback visual

## Implementation Notes

### CSS Classes (Tailwind)
```css
/* Navigation Header */
.nav-header {
  @apply fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b;
}

/* Family Selection Highlight */
.family-selection-highlight {
  @apply border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg;
}

/* Enhanced Button States */
.btn-enhanced-hover {
  @apply transition-all duration-200 hover:shadow-md hover:scale-105;
}

/* Progress Indicator */
.progress-step-active {
  @apply bg-blue-600 text-white border-blue-600;
}

.progress-step-completed {
  @apply bg-green-600 text-white border-green-600;
}
```

### Animation Specifications
- **Transitions**: 200ms ease-in-out para hover states
- **Step Changes**: 300ms slide transition
- **Loading**: Pulse animation para skeleton states
- **Success**: Bounce animation para confirmações

### Responsive Breakpoints
- **Mobile (< 768px)**: Stack navigation, compact progress
- **Tablet (768px - 1024px)**: Horizontal layout adaptado
- **Desktop (> 1024px)**: Layout completo com sidebar opcional

### Accessibility Considerations
- **Keyboard Navigation**: Tab order lógico
- **Screen Readers**: ARIA labels apropriados
- **Color Contrast**: WCAG AA compliance
- **Focus Indicators**: Visíveis e consistentes