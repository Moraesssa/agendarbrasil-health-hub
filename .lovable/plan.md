## Auditoria do CLAUDE.md (Akita Way — Fase 1)

Objetivo: alinhar o CLAUDE.md ao estado **real** do código, rotas, tabelas e Edge Functions verificados agora, e registrar decisões tomadas nas últimas fases (Stripe, RLS, ComingSoon).

### Divergências detectadas entre CLAUDE.md e o projeto

1. **Data desatualizada** — "2026-03-12" (hoje é 2026-07-15).
2. **Edge Functions incompletas** — faltam no doc: `customer-portal`, `purge-auth-users`, `webhook-lab-results`.
3. **Rotas ausentes** — o CLAUDE.md não lista o mapa de rotas; hoje o App.tsx tem 28 rotas canônicas (dashboard-medico → `DashboardMedicoV3`, `/telemedicina`, `/agenda-paciente`, `/suporte`, `/debug`, `/scheduler-demo`, etc.).
4. **Tabelas ativas incompletas** — faltam tabelas em uso real: `payments`, `temporary_reservations`, `waiting_list`, `medical_triage`, `medical_services`, `prescription_renewals`, `health_metrics`, `vaccination_records`, `notification_settings`, `user_preferences`, `user_consents`, `medico_notifications`, `family_notifications`, `patient_documents`, `document_validations`, `fhir_resources`, `webhook_event_logs`, `security_audit_log`, `client_logs`, `especialidades_medicas`, `external_data_sources`, `integration_logs`, `debug_allowlist`, `simple_audit_log`.
5. **Duplicação de pagamentos** — coexistem `pagamentos` e `payments`; precisa decidir qual é canônica (o doc só cita `pagamentos`).
6. **Problemas conhecidos desatualizados** — RLS de `medico_notifications` e policies de `Consultas` (PascalCase) já foram corrigidos na migração aprovada em 2026-04-17; devem sair da lista.
7. **Itens em aberto reais faltando** — `Telemedicina` como ComingSoon (WebRTC pendente), `usePayment.checkPendingPayments` é stub, duplicação `pagamentos` vs `payments`, `usuarios` (lowercase, 5 col) existe além de `Usuarios` e `profiles`.
8. **Faltam seções operacionais** que a metodologia Akita exige: mapa de rotas ↔ tipo de usuário, contrato de cada Edge Function (input/output), convenção de validação UUID (`safeUUID`), padrão `ComingSoonPage`, comandos de dev/test/build.

### Plano de reescrita do CLAUDE.md

Reescrever `CLAUDE.md` (arquivo único, sem quebrar em outros) mantendo a estrutura numerada atual e adicionando/atualizando seções:

1. **Cabeçalho** — atualizar data para 2026-07-15.
2. **§2 Stack** — adicionar Vitest 195 testes / Cypress E2E, Sonner+Toaster, Lucide, date-fns.
3. **§3 Estrutura** — refletir árvore real (`src/contexts`, `src/integrations/supabase`, `supabase/functions/*` lista completa).
4. **§4 Banco de Dados** — reorganizar em três blocos:
   - **Canônicas em uso** (lista completa das 40+ tabelas ativas agrupadas por domínio: Identidade, Agenda, Consulta, Pagamento, Medicação, Documentos Médicos, FHIR, Notificações, Auditoria).
   - **Legadas / a migrar** (`Usuarios`, `Medicos`, `Pacientes`, `Consultas`, `consultations`, `usuarios` lowercase, `pagamentos` vs `payments` — marcar a decisão canônica).
   - **Nota RLS** — grants explícitos obrigatórios em toda tabela pública (regra do projeto).
5. **§5 Regras de Negócio** — manter e acrescentar: fluxo de cancelamento (`cancelConsulta` + toast + AlertDialog), reserva temporária TTL 15min, webhook Stripe → `payments` + `consultas.status`.
6. **§6 Convenções** — acrescentar: validação UUID obrigatória (`safeUUID`/`validateUUID`), `ComingSoonPage` para páginas sem implementação, sem cores hardcoded, sem `any` amplo, TDD antes da implementação.
7. **§7 Edge Functions** — tabela completa com as 13 funções reais (adicionar `customer-portal`, `purge-auth-users`, `webhook-lab-results`) e input/output resumido de cada uma.
8. **§8 Mapa de Rotas** (nova seção) — tabela `rota → componente → tipo de usuário → status` derivada de `App.tsx`.
9. **§9 Comandos** (nova seção) — `npm run dev`, `npm run test:unit`, `npm run test:e2e`, `npm run build:production`, `npm run validate:production`.
10. **§10 Problemas Conhecidos** — substituir pela lista **atual e verificada**:
    - Duplicação `pagamentos` vs `payments` — decidir canônica.
    - `Telemedicina` = ComingSoon (WebRTC/Twilio pendente).
    - `usePayment.checkPendingPayments` ainda é stub.
    - Coexistência de tabelas PascalCase + lowercase (migração incremental em andamento).
    - Remover: itens já resolvidos de `medico_notifications` e `Consultas` UPDATE/DELETE.
11. **§11 Histórico de Decisões** (nova seção, memória evolutiva do projeto) — 1 linha por decisão datada:
    - 2026-04-17 RLS reforçado em `medico_notifications` e `Consultas`.
    - 2026-04-17 `GerenciarLocaisV2` implementado (CRUD real de `locais_atendimento`).
    - 2026-04-17 `usePayment` integrado a `create-stripe-checkout`/`verify-payment`.
    - 2026-04-17 Cleanup: removidos `frontend/`, `backend/`, `DashboardMedicoV2`, `emergencyTypeFixes.ts` e stubs de tipo.

### Arquivo alterado
- `CLAUDE.md` (reescrita completa mantendo o formato de tabelas markdown existente)

### Fora de escopo
- Nenhuma alteração de código, migração SQL ou renomeação de tabela nesta fase — apenas documentação. Decisões estruturais (ex.: dropar `pagamentos` ou `payments`) ficam listadas como problemas conhecidos para próxima fase.
