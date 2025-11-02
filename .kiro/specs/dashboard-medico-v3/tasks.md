# Implementation Plan - Dashboard Médico V3

## Task Overview

Este plano implementa o Dashboard Médico V3 de forma incremental, começando pela estrutura base e adicionando funcionalidades progressivamente. Cada task é independente e testável.

## 📊 Progress Summary

**Completed (Tasks 1-3, 9):** Foundation & Infrastructure ✅
- ✅ Page structure with responsive layout
- ✅ Data layer with React Query hooks
- ✅ State management with DashboardContext
- ✅ Period filter component
- ✅ All API services implemented

**Next Phase (Tasks 4-8):** Core Widgets Implementation 🔄
- 🔄 Task 4: Metrics Cards (replace placeholders with real data)
- 🔄 Task 5: Charts Section (bar chart, donut chart)
- 🔄 Task 6: Upcoming Appointments Widget
- 🔄 Task 7: Alerts Section
- 🔄 Task 8: Quick Actions Widget

**Future Phases:** Polish, Testing & Deployment
- Tasks 10-23: User preferences UI, error handling, accessibility, testing, migration

---

## 🎯 Current Status

**What's Working:**
- ✅ DashboardMedicoV3.tsx page with full layout
- ✅ DashboardHeader with greeting, date, refresh button
- ✅ DashboardGrid with placeholder cards (styled and responsive)
- ✅ DashboardContext managing filters and preferences
- ✅ All data hooks (useDashboardMetrics, useDashboardAppointments, useDashboardAlerts, useDashboardCharts)
- ✅ DashboardService with all API functions
- ✅ PeriodFilter component integrated
- ✅ Route `/dashboard-medico-v3` configured

**What's Next:**
- 🔄 Replace placeholder cards with real MetricCard components using data from hooks
- 🔄 Implement chart components using Recharts
- 🔄 Build appointment list widget
- 🔄 Create alerts section
- 🔄 Add quick actions navigation

---

## Phase 1: Foundation & Structure ✅

### Task 1: Setup Base Structure and Layout ✅

Criar a estrutura base do novo dashboard com layout responsivo e sistema de grid.

**Sub-tasks:**
- [x] 1.1 Criar arquivo `src/pages/DashboardMedicoV3.tsx` com estrutura básica
- [x] 1.2 Implementar `DashboardLayout` component com sidebar integration
- [x] 1.3 Criar `DashboardGrid` component com sistema de grid responsivo (1/2/4 colunas)
- [x] 1.4 Implementar `DashboardHeader` com welcome message, date display e refresh button
- [x] 1.5 Adicionar rota `/dashboard-medico-v3` no App.tsx para testes paralelos
- [x] 1.6 Criar arquivo de estilos `dashboard-v3.css` com variáveis CSS customizadas (opcional)

_Requirements: 1.1, 6.1, 6.2, 6.3, 6.4_

---

### Task 2: Create Data Layer and Hooks ✅

Implementar camada de dados com React Query e hooks customizados para buscar informações do dashboard.

**Sub-tasks:**
- [x] 2.1 Criar `src/hooks/useDashboardMetrics.ts` para buscar métricas usando React Query
- [x] 2.2 Criar `src/hooks/useDashboardAppointments.ts` para buscar consultas usando React Query
- [x] 2.3 Criar `src/hooks/useDashboardAlerts.ts` para buscar alertas usando React Query
- [x] 2.4 Configurar React Query cache e stale time (5 minutos) nos hooks
- [x] 2.5 Adicionar error handling e retry logic nos hooks
- [x] 2.6 Integrar hooks com funções existentes do `dashboardService.ts`
- [x] 2.7 Criar `src/hooks/useDashboardCharts.ts` para buscar dados de gráficos
- [x] 2.8 Criar `src/hooks/dashboard/index.ts` para exportar todos os hooks

_Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.4_

**Nota:** `dashboardService.ts` já existe com funções `fetchDashboardMetrics`, `fetchUpcomingAppointments`, `fetchDashboardAlerts`, `fetchConsultasChartData`, `fetchConsultationTypeData`.

---

### Task 3: Implement State Management ✅

Criar context e state management para filtros, preferências e estado global do dashboard.

**Sub-tasks:**
- [x] 3.1 Criar `src/contexts/DashboardContext.tsx` para estado global
- [x] 3.2 Implementar state para filtros (period: 'today' | 'week' | 'month' | 'year')
- [x] 3.3 Implementar state para preferências do usuário (hiddenWidgets, widgetOrder)
- [x] 3.4 Criar funções para salvar/carregar preferências do Supabase (tabela user_preferences)
- [x] 3.5 Adicionar DashboardProvider no DashboardMedicoV3
- [x] 3.6 Criar `PeriodFilter.tsx` component integrado com DashboardContext

_Requirements: 9.1, 9.2, 9.3, 9.4_

---

## Phase 2: Core Widgets

### Task 4: Build Metrics Cards Component

Substituir placeholders por cards de métricas reais com dados do backend.

**Sub-tasks:**
- [ ] 4.1 Criar `src/components/dashboard-v3/MetricsSection.tsx` que usa `useDashboardMetrics` hook
- [ ] 4.2 Criar `src/components/dashboard-v3/MetricCard.tsx` com interface de props completa
- [ ] 4.3 Implementar 4 cards com dados reais (Consultas, Receita, Ocupação, Pacientes)
- [ ] 4.4 Manter gradientes de cores e ícones (já existem nos placeholders)
- [ ] 4.5 Criar `MetricCardSkeleton.tsx` para loading state
- [ ] 4.6 Adicionar indicador de mudança percentual com seta up/down e cores (verde/vermelho)
- [ ] 4.7 Adicionar tooltip com detalhes ao passar mouse sobre cada métrica
- [ ] 4.8 Substituir placeholders no DashboardGrid por MetricsSection real
- [ ] 4.9 Integrar com period filter do DashboardContext para atualizar dados

_Requirements: 1.1, 1.2, 1.4, 1.5, 6.5_

**Nota:** O hook `useDashboardMetrics` já está implementado e retorna todos os dados necessários incluindo percentuais de mudança.

---

### Task 5: Create Charts Section

Implementar seção de gráficos interativos com Recharts usando dados reais.

**Sub-tasks:**
- [ ] 5.1 Criar `src/components/dashboard-v3/ChartsSection.tsx` que consome hooks de dados
- [ ] 5.2 Implementar `ConsultasBarChart.tsx` usando `useConsultasChartData` hook (últimos 7 dias)
- [ ] 5.3 Implementar `TiposConsultaDonutChart.tsx` usando `useConsultationTypeData` hook
- [ ] 5.4 Adicionar tooltips customizados para cada gráfico com Recharts
- [ ] 5.5 Criar `ChartSkeleton.tsx` para loading states
- [ ] 5.6 Adicionar responsividade com ResponsiveContainer do Recharts
- [ ] 5.7 Implementar seletor de período (7d, 30d) que atualiza os dados dos gráficos
- [ ] 5.8 Substituir placeholders de gráficos no DashboardGrid

_Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

**Nota:** 
- Recharts v2.12.7 já está instalado
- Hooks `useConsultasChartData` e `useConsultationTypeData` já implementados
- Componentes similares existem em `src/components/dashboard/` que podem servir de referência

---

### Task 6: Build Upcoming Appointments Widget

Criar widget de próximas consultas com lista interativa usando dados reais.

**Sub-tasks:**
- [ ] 6.1 Criar `src/components/dashboard-v3/UpcomingAppointmentsWidget.tsx` usando `useDashboardAppointments` hook
- [ ] 6.2 Criar `src/components/dashboard-v3/AppointmentCard.tsx` para cada item da lista
- [ ] 6.3 Implementar avatar do paciente usando Avatar component do shadcn/ui (foto ou iniciais)
- [ ] 6.4 Adicionar badges de status (confirmada, pendente) e tipo (presencial, teleconsulta)
- [ ] 6.5 Implementar badge de urgência vermelho para consultas < 15 min (campo isUrgent já vem do hook)
- [ ] 6.6 Criar `src/components/dashboard-v3/EmptyState.tsx` genérico reutilizável
- [ ] 6.7 Adicionar navegação para detalhes da consulta ao clicar (usar React Router)
- [ ] 6.8 Substituir placeholder de "Próximas Consultas" no DashboardGrid

_Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

**Nota:** 
- Hook `useDashboardAppointments` já retorna dados ordenados por horário com flag `isUrgent`
- Avatar component do shadcn/ui já está disponível em `src/components/ui/avatar.tsx`
- Badge component já está disponível em `src/components/ui/badge.tsx`

---

## Phase 3: Alerts & Actions

### Task 7: Implement Alerts Section

Criar seção de alertas e notificações importantes usando dados reais.

**Sub-tasks:**
- [ ] 7.1 Criar `src/components/dashboard-v3/AlertsSection.tsx` usando `useDashboardAlerts` hook
- [ ] 7.2 Criar `src/components/dashboard-v3/AlertCard.tsx` com suporte aos tipos (payment, confirmation, document, message)
- [ ] 7.3 Implementar cores semânticas baseado em priority (low=azul, medium=amarelo, high=vermelho)
- [ ] 7.4 Exibir contador de itens pendentes (campo count) em cada alerta
- [ ] 7.5 Implementar navegação ao clicar usando actionUrl de cada alerta (React Router)
- [ ] 7.6 Adicionar animação de fade-in para alertas (CSS ou framer-motion)
- [ ] 7.7 Renderizar AlertsSection condicionalmente no DashboardGrid (só se houver alertas)

_Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

**Nota:** 
- Hook `useDashboardAlerts` já retorna alertas de pagamentos pendentes e consultas não confirmadas
- Alert component do shadcn/ui já está disponível em `src/components/ui/alert.tsx`

---

### Task 8: Create Quick Actions Widget

Implementar widget de ações rápidas com botões de atalho para navegação.

**Sub-tasks:**
- [ ] 8.1 Criar `src/components/dashboard-v3/QuickActionsWidget.tsx`
- [ ] 8.2 Criar `src/components/dashboard-v3/ActionButton.tsx` component reutilizável
- [ ] 8.3 Implementar 5 ações com navegação usando React Router:
  - Nova Consulta → /agenda-medico
  - Ver Agenda → /agenda-medico
  - Pacientes → /pacientes-medico
  - Locais → /gerenciar-locais
  - Horários → /gerenciar-agenda
- [ ] 8.4 Adicionar ícones do lucide-react (Plus, Calendar, Users, MapPin, Clock) e cores distintas
- [ ] 8.5 Implementar grid responsivo com scroll horizontal em mobile
- [ ] 8.6 Adicionar hover effects e transições suaves (Tailwind CSS)
- [ ] 8.7 Substituir placeholder de "Ações Rápidas" no DashboardGrid

_Requirements: 5.1, 5.2, 5.3, 5.4_

**Nota:** Button component do shadcn/ui já está disponível para uso

---

## Phase 4: Filters & Preferences

### Task 9: Implement Period Filter ✅

Adicionar filtro de período para métricas e gráficos.

**Sub-tasks:**
- [x] 9.1 Criar `PeriodFilter.tsx` component com Select do shadcn/ui
- [x] 9.2 Implementar opções: Hoje, Semana, Mês, Ano
- [x] 9.3 Integrar com DashboardContext para atualizar período global
- [x] 9.4 Adicionar PeriodFilter no DashboardHeader
- [ ] 9.5 Garantir que métricas e gráficos reagem à mudança de período (será testado quando widgets forem implementados)

_Requirements: 9.1, 9.2_

---

### Task 10: Implement User Preferences

Adicionar sistema de personalização do dashboard.

**Sub-tasks:**
- [x] 10.1 Criar tabela `user_preferences` no Supabase (já existe)
- [x] 10.2 Implementar funções de salvar/carregar preferências no DashboardContext (já implementado)
- [ ] 10.3 Criar `WidgetSettings.tsx` modal para ocultar/exibir widgets
- [ ] 10.4 Adicionar botão de configurações no DashboardHeader
- [ ] 10.5 Implementar lógica de ocultar widgets baseado em preferências no DashboardGrid

_Requirements: 9.3, 9.4_

**Nota:** A infraestrutura de preferências já está implementada no DashboardContext. Falta apenas a UI para gerenciar as preferências.

---

## Phase 5: Financial Integration (Optional)

### Task 11: Create Financial Widget (Optional)

Implementar widget de informações financeiras usando financeService existente.

**Sub-tasks:**
- [ ]* 11.1 Criar `src/components/dashboard-v3/FinancialWidget.tsx`
- [ ]* 11.2 Criar hook `useFinancialSummary` que usa `financeService.getResumoFinanceiro`
- [ ]* 11.3 Implementar card com resumo financeiro (receita mês, comparação, ticket médio)
- [ ]* 11.4 Adicionar mini gráfico de evolução usando Recharts
- [ ]* 11.5 Adicionar botão para navegar para /financeiro
- [ ]* 11.6 Adicionar FinancialWidget ao DashboardGrid

_Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

**Nota:** Esta task é opcional. As métricas financeiras básicas já estão incluídas no MetricsSection (Task 4). Este widget seria para informações financeiras mais detalhadas.

---

## Phase 6: Polish & UX

### Task 12: Implement Empty States

Implementar estados vazios para todos os widgets.

**Sub-tasks:**
- [x] 12.1 Criar `EmptyState.tsx` component genérico reutilizável (será criado em Task 6.6)
- [ ] 12.2 Adicionar empty state em UpcomingAppointmentsWidget (nenhuma consulta hoje)
- [ ] 12.3 Adicionar empty state em ChartsSection (sem dados no período)
- [ ] 12.4 Adicionar empty state em AlertsSection (tudo ok - sem alertas)
- [ ] 12.5 Adicionar CTAs apropriados em cada empty state (ex: "Agendar Consulta")
- [ ] 12.6 Usar ícones do lucide-react para ilustrar cada estado

_Requirements: 12.2_

**Nota:** O EmptyState component será criado durante Task 6 e reutilizado nos outros widgets.

---

## Phase 7: Error Handling & Optimization

### Task 13: Add Error Handling

Implementar tratamento robusto de erros em todos os widgets.

**Sub-tasks:**
- [ ] 13.1 Criar `src/components/dashboard-v3/ErrorState.tsx` component com retry button
- [ ] 13.2 Adicionar error states em MetricsSection (mostrar ErrorState se hook falhar)
- [ ] 13.3 Adicionar error states em ChartsSection
- [ ] 13.4 Adicionar error states em UpcomingAppointmentsWidget
- [ ] 13.5 Adicionar error states em AlertsSection
- [ ] 13.6 Usar toast do shadcn/ui para erros de rede críticos

_Requirements: 1.3, 7.1_

**Nota:** React Query já implementa retry logic automaticamente nos hooks (configurado para 2 tentativas com exponential backoff).

---

### Task 14: Performance Optimizations (Optional)

Otimizar performance do dashboard para carregamento rápido.

**Sub-tasks:**
- [ ]* 14.1 Implementar code splitting com React.lazy para ChartsSection
- [ ]* 14.2 Adicionar Suspense boundary com skeleton fallback
- [ ]* 14.3 Otimizar re-renders com React.memo em MetricCard e AppointmentCard
- [ ]* 14.4 Verificar bundle size e otimizar imports
- [ ]* 14.5 Adicionar prefetching de dados ao hover em quick actions

_Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

**Nota:** React Query já implementa caching e stale time. Estas otimizações são opcionais.

---

## Phase 8: Accessibility & Polish

### Task 15: Implement Accessibility Features

Garantir que o dashboard seja acessível seguindo WCAG AA.

**Sub-tasks:**
- [ ] 15.1 Adicionar ARIA labels em todos os botões e elementos interativos
- [ ] 15.2 Garantir navegação por teclado (Tab, Enter, Esc) em todos os widgets
- [ ] 15.3 Adicionar role="region" e aria-label em cada seção do dashboard
- [ ] 15.4 Implementar focus visible em todos os elementos (já vem do Tailwind)
- [ ] 15.5 Adicionar aria-live="polite" para anúncios de atualização de dados
- [ ] 15.6 Verificar contraste de cores (usar ferramentas como axe DevTools)
- [ ] 15.7 Testar zoom até 200% e garantir que layout não quebra

_Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

---

### Task 16: Polish UI/UX Details

Adicionar detalhes finais de UI/UX para experiência premium.

**Sub-tasks:**
- [ ] 16.1 Adicionar animações de fade-in em widgets ao carregar (framer-motion ou CSS)
- [ ] 16.2 Garantir que todos os skeletons estão implementados e consistentes
- [ ] 16.3 Adicionar transições suaves em hover states (já parcialmente implementado)
- [ ] 16.4 Adicionar tooltips informativos em métricas e ícones
- [ ] 16.5 Revisar espaçamentos e alinhamentos para consistência
- [ ] 16.6 Testar responsividade em mobile, tablet e desktop
- [ ] 16.7 Adicionar loading state no botão de refresh do header

_Requirements: 6.5, 6.6_

---

## Phase 9: Testing (Optional)

### Task 17: Write Tests

Criar testes para componentes e fluxos principais.

**Sub-tasks:**
- [ ]* 17.1 Criar testes unitários para hooks (useDashboardMetrics, useDashboardAppointments, useDashboardAlerts)
- [ ]* 17.2 Criar testes para componentes principais (MetricCard, AppointmentCard, AlertCard)
- [ ]* 17.3 Criar teste E2E com Cypress para fluxo completo do dashboard
- [ ]* 17.4 Testar carregamento de dados e error states
- [ ]* 17.5 Testar navegação e interações principais

_Requirements: Testing Strategy_

**Nota:** Testes são opcionais mas recomendados. Vitest e Cypress já estão configurados no projeto.

---

## Phase 10: Migration & Deployment

### Task 21: Implement Feature Flag (Optional)

Criar feature flag para rollout gradual.

**Sub-tasks:**
- [ ]* 21.1 Adicionar feature flag no contexto de configuração
- [ ]* 21.2 Criar toggle no painel admin para habilitar/desabilitar V3
- [ ]* 21.3 Implementar lógica de roteamento baseada em flag
- [ ]* 21.4 Adicionar analytics para tracking de uso
- [ ]* 21.5 Criar documentação de como usar feature flag

_Requirements: Migration Strategy_

**Nota:** Esta task é opcional. A rota `/dashboard-medico-v3` já existe para testes. Pode-se fazer migração direta sem feature flag.

---

### Task 22: Update Route and Deploy

Atualizar rota principal e fazer deploy.

**Sub-tasks:**
- [ ] 22.1 Testar completamente o dashboard V3 em ambiente de desenvolvimento
- [ ] 22.2 Atualizar rota `/dashboard-medico` para usar DashboardMedicoV3
- [ ] 22.3 Manter V2 disponível em `/dashboard-medico-v2` (já existe como DashboardMedicoV2)
- [ ] 22.4 Fazer build de produção e validar bundle size
- [ ] 22.5 Deploy para staging e validação
- [ ] 22.6 Deploy para produção com monitoramento
- [ ] 22.7 Monitorar métricas de performance e erros nas primeiras 48h

_Requirements: Migration Strategy_

**Nota:** A rota atual `/dashboard-medico` usa DashboardMedicoV2. Após validação completa do V3, basta atualizar o import em App.tsx.

---

### Task 23: Documentation and Cleanup

Documentar e limpar código antigo.

**Sub-tasks:**
- [ ] 23.1 Criar documentação de componentes (Storybook ou similar)
- [ ] 23.2 Atualizar README com informações do V3
- [ ] 23.3 Documentar APIs e hooks
- [ ] 23.4 Criar guia de contribuição para novos widgets
- [ ] 23.5 Deprecar componentes antigos (adicionar warnings)
- [ ] 23.6 Remover código não utilizado após período de transição
- [ ] 23.7 Atualizar testes para refletir mudanças

_Requirements: Migration Strategy_

---

## Summary

**Total Tasks:** 23 (3 completed, 20 remaining)
**Completed:** Tasks 1, 2, 3, 9 (Foundation & Infrastructure)
**Next Priority:** Tasks 4-8 (Core Widgets)
**Estimated Time Remaining:** 3-4 weeks (1 developer full-time)

**Key Dependencies:**
- ✅ Supabase (configured)
- ✅ React Query (configured)
- ✅ Recharts (installed v2.12.7)
- ✅ Tailwind CSS (configured)
- ✅ shadcn/ui components (available)

**Reusable Components from Old Dashboard:**
- `src/components/dashboard/ConsultasChart.tsx` - Can be adapted for Task 5
- `src/components/dashboard/TiposConsultaChart.tsx` - Can be adapted for Task 5
- `src/components/dashboard/MetricsCards.tsx` - Reference for Task 4
- `src/components/dashboard/AlertsSection.tsx` - Reference for Task 7

**Success Criteria:**
- Dashboard loads in < 2 seconds
- All widgets functional and responsive
- WCAG AA compliant
- Zero critical bugs in production
