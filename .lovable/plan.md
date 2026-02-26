

## Diagnóstico Completo dos Testes E2E

### Problemas Identificados

Após análise detalhada de todos os 9 arquivos de teste Cypress e dos componentes reais da aplicação, identifiquei problemas graves e sistêmicos que tornam a maioria dos testes E2E não-funcionais.

---

### 1. Arquivos Completamente Quebrados (Referências a comandos/seletores inexistentes)

**`enhanced_scheduling_flow_spec.js`** - 100% quebrado
- Usa comandos inexistentes: `cy.interceptAdvancedSchedulingCalls()`, `cy.waitForPageLoad()`, `cy.clickNext()`, `cy.completeSchedulingSteps()`
- Referencia seletores que não existem na UI: `smart-recommendations`, `progress-indicator`, `enhanced-state-select`, `state-search-input`, `recovery-modal`, `reservation-timer`
- Testa funcionalidades que não existem: comparação de médicos, favoritos, virtual scrolling, axe accessibility plugin

**`doctor_management_spec.js`** - 100% quebrado
- Usa comandos inexistentes: `cy.loginAsDoctor()`, `cy.interceptDoctorManagementCalls()`, `cy.configureBasicSchedule()`
- Todos os seletores são fictícios (não existem na UI)

**`realistic_data_scenarios_spec.js`** - 100% quebrado
- Usa comandos inexistentes: `cy.loadRealisticMockData()`, `cy.interceptRealisticAPIs()`, `cy.clickNext()`, `cy.completeSchedulingSteps()`, `cy.mockTimeOfWeek()`, `cy.mockSeason()`, `cy.setPatientProfile()`
- Testa cenários totalmente hipotéticos

**`agendamento_edge_cases_spec.js`** - 100% quebrado
- Usa comando inexistente: `cy.searchSpecialist()`, `cy.selectFirstAvailableSlot()`
- Referencia seletores da página Index que não existem: `search-specialty-input`, `search-location-input`
- Referencia rotas inexistentes: `/busca`

**`search_flow_spec.js`** - 95% quebrado
- Usa `select()` em componentes Radix `[role="combobox"]` (incompatível)
- Usa `.or()` que não é uma API Cypress válida
- Referencia rotas inexistentes: `/perfil/dr-exemplo-123`
- Intercepta APIs `/api/doctors` que não existem (usa Supabase RPC)

**`onboarding_medico_spec.js`** - 95% quebrado
- A página de Login usa Google OAuth exclusivamente, não há `input[name="email"]` ou `input[name="password"]`
- Todos os seletores `data-testid` referenciados não existem nos componentes de onboarding

**`homepage_spec.js`** - 60% quebrado
- Login: espera `input[type="email"]` e `input[type="password"]` que não existem (Google OAuth)
- Cadastro: espera botão "Criar Conta Grátis" que pode não existir
- Busca: espera fluxo de etapas numeradas ("Etapa 1", "Etapa 2") que não existem
- Usa `.tab()` que requer plugin `cypress-plugin-tab`
- `cy.injectAxe()` requer plugin `cypress-axe`

### 2. Arquivos Parcialmente Funcionais

**`agendamento_spec.js`** - 40% funcional
- Testes de filtro (busca) estão corretos com `data-testid` reais
- Testes de horários/confirmação falham porque visitam `/agendamento` e esperam ver calendário/confirmação sem navegar até essas etapas

**`gerenciar_agenda_spec.js`** - Potencialmente funcional
- Testes com mocks de sessão e interceptors detalhados
- Mais alinhado com a arquitetura real (Supabase, Radix)

### 3. Problema no `cypress/support/commands.js`

- Comandos definidos: `selectSpecialty`, `selectState`, `selectCity`, `clickSearch`, `selectDoctor`, `selectTimeSlot`, `fillPatientData`, `waitForLoading`, `verifyDoctorCard`, `verifySuccessMessage`, `cleanTestData`, `interceptSupabaseApi`, `checkBasicAccessibility`, `waitForElement`, `completeSchedulingFlow`, `mockAuth`
- Comandos usados mas **NÃO definidos**: `interceptAdvancedSchedulingCalls`, `waitForPageLoad`, `clickNext`, `completeSchedulingSteps`, `loginAsDoctor`, `interceptDoctorManagementCalls`, `configureBasicSchedule`, `loadRealisticMockData`, `interceptRealisticAPIs`, `searchSpecialist`, `selectFirstAvailableSlot`, `mockTimeOfWeek`, `mockSeason`, `setPatientProfile`

---

### Plano de Implementação

#### Fase 1: Limpar testes irrecuperáveis
Deletar os 5 arquivos de teste que são 100% fictícios e não refletem nenhuma funcionalidade real:
- `enhanced_scheduling_flow_spec.js`
- `doctor_management_spec.js`
- `realistic_data_scenarios_spec.js`
- `agendamento_edge_cases_spec.js`
- `search_flow_spec.js`

#### Fase 2: Reescrever `homepage_spec.js`
Testes realistas para a página inicial (`/`):
- Verificar carregamento do header e conteúdo principal
- Verificar botão "Entrar" navega para `/login`
- Verificar botão "Agendar Consulta" redireciona para `/login` (não autenticado)
- Verificar botão "Emergência" mostra toast com SAMU 192
- Verificar responsividade mobile (viewport 375x667)
- Remover testes que dependem de plugins inexistentes (`tab`, `axe`)
- Remover testes que esperam formulário de login email/password

#### Fase 3: Reescrever `agendamento_spec.js`
Corrigir testes para que reflitam o fluxo real:
- Etapa busca: testar filtros com mocks Supabase RPC
- Remover testes que esperam calendário/confirmação na carga inicial (requerem navegação por etapas)
- Adicionar testes de fluxo completo com mocks
- Manter testes de responsividade mobile

#### Fase 4: Reescrever `onboarding_medico_spec.js`
- Remover tentativa de login com email/password
- Criar testes que mockam a sessão do Supabase diretamente
- Testar apenas componentes acessíveis após mock de autenticação

#### Fase 5: Manter `gerenciar_agenda_spec.js`
- Este arquivo já usa mocks realistas e está mais alinhado com a arquitetura

#### Fase 6: Criar teste Vitest unitário
Criar `src/test/components.test.tsx` com testes unitários básicos para validar que componentes renderizam sem erros:
- FiltroBusca
- Index page rendering

#### Fase 7: Limpar `cypress/support/commands.js`
Remover comandos não utilizados e manter apenas os que são realmente referenciados pelos testes restantes.

---

### Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| **Deletar** | `cypress/e2e/enhanced_scheduling_flow_spec.js` |
| **Deletar** | `cypress/e2e/doctor_management_spec.js` |
| **Deletar** | `cypress/e2e/realistic_data_scenarios_spec.js` |
| **Deletar** | `cypress/e2e/agendamento_edge_cases_spec.js` |
| **Deletar** | `cypress/e2e/search_flow_spec.js` |
| **Reescrever** | `cypress/e2e/homepage_spec.js` |
| **Reescrever** | `cypress/e2e/agendamento_spec.js` |
| **Reescrever** | `cypress/e2e/onboarding_medico_spec.js` |
| **Manter** | `cypress/e2e/gerenciar_agenda_spec.js` |
| **Atualizar** | `cypress/support/commands.js` |
| **Criar** | `src/test/components.test.tsx` |
| **Atualizar** | `src/test/setup.ts` (adicionar matchMedia mock) |

