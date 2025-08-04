# TimeSlotButton Component

## Overview

O componente `TimeSlotButton` é uma versão aprimorada do botão de seleção de horários que inclui informações de localização, codificação por cores, tooltips informativos e estados desabilitados para filtros de localização.

## Features Implementadas

### ✅ 1. Badge de Localização
- Exibe um badge com ícone de estabelecimento quando múltiplas localizações estão disponíveis
- Badge posicionado no canto superior direito do botão
- Cores diferentes para cada estabelecimento

### ✅ 2. Codificação por Cores
- Cada estabelecimento recebe uma cor consistente baseada em hash do ID
- Cores aplicadas nos estados de hover e seleção
- Paleta de 6 cores diferentes para distinguir estabelecimentos

### ✅ 3. Tooltips Informativos
- Tooltip mostra nome completo do estabelecimento
- Inclui horário e status de filtro
- Aparece apenas quando há informações de localização

### ✅ 4. Estados Desabilitados
- Horários indisponíveis ficam com opacity reduzida e riscados
- Horários filtrados por localização ficam semi-transparentes
- Estados visuais claros para diferentes condições

### ✅ 5. Estilo Específico por Local
- Cada estabelecimento tem esquema de cores único
- Hover states personalizados por localização
- Consistência visual mantida em toda a aplicação

## Props Interface

```typescript
interface TimeSlotButtonProps {
  time: string;                    // Horário a ser exibido (ex: "09:00")
  available: boolean;              // Se o horário está disponível
  selected: boolean;               // Se o horário está selecionado
  disabled?: boolean;              // Se o botão está desabilitado
  onClick: () => void;             // Callback para clique
  locationId?: string;             // ID do estabelecimento
  locationName?: string;           // Nome do estabelecimento
  showLocationBadge?: boolean;     // Se deve mostrar badge de localização
  isLocationFiltered?: boolean;    // Se há filtro de localização ativo
  className?: string;              // Classes CSS adicionais
}
```

## Uso Básico

```tsx
import { TimeSlotButton } from '@/components/scheduling/TimeSlotButton';

// Uso simples
<TimeSlotButton
  time="09:00"
  available={true}
  selected={false}
  onClick={() => handleTimeSelect("09:00")}
/>

// Com informações de localização
<TimeSlotButton
  time="09:00"
  available={true}
  selected={false}
  onClick={() => handleTimeSelect("09:00")}
  locationId="hospital-1"
  locationName="Hospital São Lucas"
  showLocationBadge={true}
/>

// Com filtro de localização
<TimeSlotButton
  time="09:00"
  available={true}
  selected={false}
  onClick={() => handleTimeSelect("09:00")}
  locationId="hospital-1"
  locationName="Hospital São Lucas"
  isLocationFiltered={true}
/>
```

## Integração com TimeSlotGrid

O componente foi integrado ao `TimeSlotGrid` existente:

```tsx
// No TimeSlotGrid.tsx
{filteredTimeSlots.map((slot) => (
  <TimeSlotButton
    key={`${slot.time}-${slot.location_id || 'no-location'}`}
    time={slot.time}
    available={slot.available}
    selected={selectedTime === slot.time}
    disabled={disabled}
    onClick={() => onChange(slot.time)}
    locationId={slot.location_id}
    locationName={slot.location_name}
    showLocationBadges={showLocationBadges && locaisInfo.length > 1}
    isLocationFiltered={!!selectedLocationId}
  />
))}
```

## Estados Visuais

### 1. Disponível (Padrão)
- Fundo branco, borda cinza
- Hover com cor específica da localização
- Ícone de relógio cinza

### 2. Selecionado
- Fundo gradiente laranja
- Borda laranja com ring
- Ícone de confirmação no canto
- Ícone de relógio laranja

### 3. Indisponível
- Opacity 40%, texto riscado
- Cursor not-allowed
- Fundo cinza claro

### 4. Filtrado por Localização
- Opacity 60% quando não corresponde ao filtro
- Cursor not-allowed
- Mantém estilo base mas semi-transparente

## Cores por Localização

O sistema usa 6 cores diferentes para distinguir estabelecimentos:

1. **Azul**: `bg-blue-100 text-blue-800 border-blue-200`
2. **Verde**: `bg-green-100 text-green-800 border-green-200`
3. **Roxo**: `bg-purple-100 text-purple-800 border-purple-200`
4. **Rosa**: `bg-pink-100 text-pink-800 border-pink-200`
5. **Índigo**: `bg-indigo-100 text-indigo-800 border-indigo-200`
6. **Teal**: `bg-teal-100 text-teal-800 border-teal-200`

## Acessibilidade

### ARIA Labels
- Labels descritivos incluindo horário, disponibilidade e localização
- Exemplo: `"Horário 09:00 disponível - Hospital São Lucas"`

### Navegação por Teclado
- Suporte completo a navegação por Tab
- Enter/Space para seleção
- Focus indicators visíveis

### Screen Readers
- Anúncios claros de estado
- Informações de localização incluídas
- Feedback de mudanças de estado

## Testes

O componente inclui testes abrangentes:

```bash
npx vitest run src/components/scheduling/__tests__/TimeSlotButton.test.tsx
```

### Cenários Testados
- ✅ Renderização básica
- ✅ Interação de clique
- ✅ Estados desabilitados
- ✅ Estados de seleção
- ✅ Badge de localização
- ✅ Tooltips informativos
- ✅ Filtros de localização
- ✅ Atributos de acessibilidade
- ✅ Estados indisponíveis

## Demonstração

Use o componente `TimeSlotButtonDemo` para ver todas as funcionalidades:

```tsx
import { TimeSlotButtonDemo } from '@/components/scheduling/TimeSlotButtonDemo';

// Em uma página ou componente
<TimeSlotButtonDemo />
```

## Performance

### Otimizações Implementadas
- Memoização de cores por localização
- Tooltips condicionais (só renderiza quando necessário)
- Classes CSS computadas uma vez
- Re-renders otimizados

### Considerações
- Hash function simples para cores consistentes
- Componente leve (~2KB gzipped)
- Sem dependências externas além do shadcn/ui

## Próximos Passos

Para futuras melhorias, considere:

1. **Animações**: Transições suaves entre estados
2. **Temas**: Suporte a temas dark/light
3. **Internacionalização**: Suporte a múltiplos idiomas
4. **Customização**: Props para cores personalizadas
5. **Analytics**: Tracking de interações do usuário

## Troubleshooting

### Problemas Comuns

**Badge não aparece:**
- Verifique se `showLocationBadge={true}`
- Confirme que `locationId` e `locationName` estão definidos

**Cores não consistentes:**
- Verifique se o `locationId` é estável entre renders
- Hash function garante consistência baseada no ID

**Tooltip não funciona:**
- Confirme que `locationName` está definido
- Verifique se o botão não está desabilitado

**Estados visuais incorretos:**
- Verifique props `available`, `selected`, `disabled`
- Confirme lógica de `isLocationFiltered`