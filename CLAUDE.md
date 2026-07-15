# CLAUDE.MD — Fonte Única de Verdade

> Última atualização: 2026-07-15

## 1. Visão Geral

Plataforma de telemedicina para o mercado brasileiro. Permite agendamento de consultas (presencial e teleconsulta), videochamadas, gestão de prontuários, prescrições digitais e pagamentos — em conformidade com LGPD e padrões ICP-Brasil.

## 2. Stack Tecnológica

| Camada | Tecnologia | Observações |
|---|---|---|
| **Framework** | React 18 + TypeScript 5 | SPA |
| **Build** | Vite + SWC | Dev server + bundling |
| **Estilização** | Tailwind CSS + shadcn/ui (Radix) | Tokens semânticos em `src/index.css` — proibido cor hardcoded |
| **Roteamento** | React Router DOM v6 | Client-side |
| **Estado servidor** | TanStack Query v5 | Cache, fetching, sync |
| **Formulários** | React Hook Form + Zod | Validação tipada |
| **Backend** | Supabase | PostgreSQL 15 + Auth + Edge Functions + Storage |
| **Pagamentos** | Stripe | Via Edge Functions |
| **Notificações UI** | `sonner` + shadcn `Toaster` | Padrão dual |
| **Ícones / datas** | `lucide-react`, `date-fns` | — |
| **Testes unitários** | Vitest (195 testes) | `src/**/__tests__/` |
| **Testes E2E** | Cypress | `cypress/e2e/` |

## 3. Estrutura de Diretórios (Canônica)

```
├── src/
│   ├── components/         # Componentes por domínio + ui/ (shadcn)
│   ├── pages/              # Componentes de rota (ver §8)
│   ├── contexts/           # AuthContext, NotificationContext, AppointmentServiceProvider
│   ├── hooks/              # useAuth, usePayment, useConsultas, useSafeAuth, useSecurityConfig...
│   ├── services/           # agendamento/, appointmentService, familyService, authService...
│   ├── utils/              # validation, uuidValidation (safeUUID), financialUtils, timeSlotUtils
│   ├── types/              # Definições TS de domínio
│   ├── integrations/supabase/  # client.ts + types.ts (auto-gerado, NÃO editar)
│   └── test/               # setup Vitest
├── supabase/
│   ├── functions/          # Edge Functions (ver §7)
│   ├── migrations/         # SQL versionado (READ-ONLY — sempre via migration tool)
│   └── config.toml         # Único arquivo — não criar cópias
├── cypress/                # E2E
├── public/                 # Assets estáticos
└── docs/                   # Documentação de domínio
```

### Diretórios REMOVIDOS
- ~~`frontend/`~~ — CRA legado (removido em 2026-04-17)
- ~~`backend/`~~ — Express.js legado, substituído por Supabase (removido em 2026-04-17)

## 4. Banco de Dados

### 4.1 Tabelas Canônicas em uso (lowercase)

**Identidade & Perfis**
| Tabela | Descrição |
|---|---|
| `profiles` | Perfil unificado (FK → `auth.users.id`) |
| `medicos` | Dados profissionais (FK → `profiles.id` via `user_id`) |
| `pacientes` | Dados do paciente (FK → `profiles.id` via `user_id`) |
| `family_members` | Vínculos familiares com permissões granulares |
| `especialidades_medicas` | Catálogo de especialidades |

**Agenda & Consulta**
| Tabela | Descrição |
|---|---|
| `consultas` | Consultas agendadas (tabela principal) |
| `locais_atendimento` | Locais físicos/virtuais de atendimento |
| `doctor_availability` | Disponibilidade semanal |
| `doctor_time_off` | Folgas e bloqueios |
| `horarios_disponibilidade` | Config de horários por tipo de consulta |
| `temporary_reservations` | Reserva TTL 15min durante checkout |
| `waiting_list` | Lista de espera |
| `encaminhamentos` | Encaminhamentos entre médicos |
| `medical_triage` | Triagem prévia |
| `medical_services` | Catálogo de serviços |

**Pagamento** ⚠ duplicação a resolver
| Tabela | Descrição |
|---|---|
| `payments` | **Canônica** — usada pelo webhook Stripe |
| `pagamentos` | Legada — a consolidar em `payments` (ver §10) |

**Documentos Médicos & Prescrição**
| Tabela | Descrição |
|---|---|
| `medical_prescriptions` | Prescrições digitais |
| `medical_certificates` | Atestados |
| `medical_exams` | Exames solicitados |
| `prescription_renewals` | Renovação de receita |
| `patient_documents` | Documentos do paciente |
| `document_validations` | Validações ICP-Brasil |
| `vaccination_records` | Cartão de vacinação |
| `health_metrics` | Métricas de saúde |

**Medicação**
| Tabela | Descrição |
|---|---|
| `medication_reminders` | Lembretes |
| `medication_doses` | Doses registradas |

**FHIR & Integrações**
| Tabela | Descrição |
|---|---|
| `fhir_resources` | Recursos FHIR |
| `external_data_sources` | Fontes externas |
| `integration_logs` | Logs de integração |
| `webhook_event_logs` | Eventos recebidos (Stripe, labs) |

**Notificações & Preferências**
| Tabela | Descrição |
|---|---|
| `medico_notifications` | Notificações do médico |
| `family_notifications` | Notificações familiares |
| `notification_settings` | Preferências de canal |
| `user_preferences` | Preferências de UI/UX |
| `user_consents` | Consentimentos LGPD |

**Auditoria & Debug**
| Tabela | Descrição |
|---|---|
| `security_audit_log` | Auditoria de segurança |
| `simple_audit_log` | Auditoria simples |
| `client_logs` | Logs do frontend (via edge function) |
| `debug_allowlist` | Usuários autorizados a acessar `/debug` |

### 4.2 Tabelas Legadas — NÃO USAR
| Tabela | Status |
|---|---|
| `Usuarios` / `usuarios` | Legado. Usar `profiles` |
| `Medicos` | Legado. Usar `medicos` |
| `Pacientes` | Legado. Usar `pacientes` |
| `Consultas` | Legado. Usar `consultas` |
| `consultations` | Legado (sem FK para profiles) |
| `pagamentos` | A consolidar em `payments` |

### 4.3 Regra RLS + GRANTS
Toda `CREATE TABLE` no schema `public` **exige** GRANTs explícitos na mesma migração (o PostgREST não aplica defaults). Ordem obrigatória: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`. Roles nunca em `profiles` — sempre em tabela separada com função `has_role` `SECURITY DEFINER`.

## 5. Regras de Negócio

### Tipos de Usuário
- **Paciente** — agenda consultas, gerencia família, acompanha medicamentos.
- **Médico** — gerencia agenda, atende, emite documentos.
- **Familiar** — atua em nome de dependentes conforme `family_members.permissions`.

### Fluxo de Agendamento
1. Paciente escolhe especialidade → estado → cidade → médico.
2. Seleciona data/horário → cria `temporary_reservations` (TTL 15min).
3. `usePayment.processPayment` invoca `create-stripe-checkout`.
4. `stripe-webhook` grava em `payments` e atualiza `consultas.status`.
5. `verify-payment` confirma sessão via `sessionId` na volta.

### Fluxo de Cancelamento (paciente)
`AgendaPacienteIntegrada` → `AlertDialog` de confirmação → `cancelConsulta()` → `toast` de feedback → invalida cache TanStack Query.

### Segurança RLS
- Médico acessa apenas suas linhas (`medicos.user_id = auth.uid()`).
- Paciente acessa apenas as suas.
- Familiar acessa via `family_members` com permissões granulares.
- **Nunca** armazenar roles em `profiles`.

## 6. Convenções de Código

### Nomenclatura
- Componentes: `PascalCase.tsx`
- Utilitários/hooks: `camelCase.ts`
- Testes: `__tests__/[nome].test.ts`

### Regras Obrigatórias (Anti-Vibe Coding)
1. **TDD** — testes antes da implementação.
2. **UUIDs sempre validados** via `safeUUID` / `validateUUID` antes de qualquer chamada DB/RPC.
3. **Sem cores hardcoded** — apenas tokens do design system (`index.css` + `tailwind.config.ts`).
4. **Sem `any` amplo** — tipar via `Database` gerado pelo Supabase.
5. **Sem "fix temporário"** — resolver na raiz. Arquivos como `emergencyTypeFixes.ts` estão banidos.
6. **Página sem implementação** → usar `ComingSoonPage` (nunca `null` nem "Em manutenção" cru).
7. **Realtime** — sempre dentro de `useEffect` com cleanup `removeChannel`.
8. **Sem segredos no repo** — usar `add_secret` (Supabase).
9. **Import order**: libs externas → componentes internos → types → relativos.

## 7. Edge Functions

| Função | Responsabilidade | Input principal |
|---|---|---|
| `create-stripe-checkout` | Cria sessão Stripe Checkout | `{ consultaId, medicoId, amount, currency, paymentMethod, successUrl, cancelUrl }` |
| `verify-payment` | Verifica sessão Stripe | `{ sessionId }` |
| `stripe-webhook` | Processa eventos Stripe → `payments` + `consultas` | Payload Stripe (raw) |
| `process-refund` | Estorno | `{ paymentId, amount? }` |
| `customer-portal` | Portal do cliente Stripe | — (usa JWT) |
| `send-appointment-reminder` | Lembretes de consulta | `{ consultaId }` |
| `send-enhanced-email` | Emails transacionais | `{ to, template, data }` |
| `upload-document` | Upload → Storage + `patient_documents` | multipart |
| `client-logs` | Recebe logs do frontend | `{ level, message, context }` |
| `fhir-patient` | CRUD FHIR Patient | `{ operation, resource }` |
| `fhir-observation` | CRUD FHIR Observation | `{ operation, resource }` |
| `webhook-lab-results` | Recebe resultados de laboratório | Payload lab |
| `purge-auth-users` | Limpeza admin de usuários | admin-only |

## 8. Mapa de Rotas (`src/App.tsx`)

| Rota | Componente | Usuário | Status |
|---|---|---|---|
| `/` | `Index` | Público | ✅ |
| `/login` | `Login` | Público | ✅ |
| `/cadastrar` | `Cadastrar` | Público | ✅ |
| `/cadastro-medico` | `CadastroMedico` | Público | ✅ |
| `/cadastro-paciente` | `CadastroPaciente` | Público | ✅ |
| `/user-type` | `UserTypeSelection` | Autenticado | ✅ |
| `/onboarding` | `Onboarding` | Autenticado | ✅ |
| `/dashboard-medico` | `DashboardMedicoV3` | Médico | ✅ |
| `/agenda-medico` | `AgendaMedico` | Médico | ✅ |
| `/gerenciar-agenda` | `GerenciarAgenda` | Médico | ✅ |
| `/gerenciar-locais` | `GerenciarLocaisV2` | Médico | ✅ (CRUD real desde 2026-04-17) |
| `/pacientes-medico` | `PacientesMedico` | Médico | ✅ |
| `/encaminhamentos-medico` | `EncaminhamentosMedico` | Médico | ✅ |
| `/perfil-medico` | `PerfilMedico` | Médico | ✅ |
| `/perfil` | `Perfil` | Autenticado | ✅ |
| `/agendamento` | `Agendamento` | Paciente | ✅ |
| `/agenda-paciente` | `AgendaPacienteIntegrada` | Paciente | ✅ |
| `/historico` | `Historico` | Paciente | ✅ |
| `/gerenciar-familia` | `GerenciarFamilia` | Paciente | ✅ |
| `/dashboard-familiar` | `DashboardFamiliar` | Familiar | ✅ |
| `/gerenciar-conexoes` | `GerenciarConexoes` | Autenticado | ✅ |
| `/gestao-medicamentos` | `GestaoMedicamentos` | Paciente | ✅ |
| `/financeiro` | `Financeiro` | Autenticado | ✅ |
| `/telemedicina` | `Telemedicina` | Autenticado | 🚧 ComingSoon |
| `/scheduler-demo` | `SchedulerDemo` | Interno | 🧪 Demo |
| `/suporte` | `Suporte` | Autenticado | ✅ |
| `/debug` | `Debug` | Allowlist | 🧪 |
| `*` | `NotFound` | Público | ✅ |

## 9. Comandos

```bash
# Desenvolvimento
npm run dev

# Testes
npm run test:unit          # Vitest
npm run test:e2e           # Cypress

# Qualidade
npm run lint
npm run validate

# Produção
npm run build:production
npm run validate:production
npm run security:audit
```

## 10. Problemas Conhecidos (verificados 2026-07-15)

- [ ] **Duplicação `payments` vs `pagamentos`** — definir `payments` como canônica e migrar dados/queries de `pagamentos`.
- [ ] **Coexistência PascalCase + lowercase** (`Consultas`/`consultas`, `Medicos`/`medicos`, `Pacientes`/`pacientes`, `Usuarios`/`usuarios`) — migração incremental em andamento.
- [ ] **`/telemedicina`** — ComingSoon. Implementação WebRTC/Twilio pendente.
- [ ] **`usePayment.checkPendingPayments`** — ainda é stub (retorna `[]`).
- [ ] **`consultations` (legado)** — remover após confirmar zero referências.

### Resolvidos recentemente
- ✅ RLS `medico_notifications` restrita ao dono (2026-04-17).
- ✅ Policies UPDATE/DELETE em `Consultas` (2026-04-17).
- ✅ `usePayment` integrado ao Stripe real (2026-04-17).
- ✅ `GerenciarLocaisV2` com CRUD real (2026-04-17).

## 11. Histórico de Decisões

| Data | Decisão |
|---|---|
| 2026-04-17 | Cleanup arquitetural: removidos `frontend/`, `backend/`, `DashboardMedicoV2` e utilitários de "fix temporário" (`emergencyTypeFixes`, `tempTypeAssertions`, `temporaryFixes`, `typeConversions`, `typeFixUtils`, `safeUtils`). |
| 2026-04-17 | Migração RLS: `medico_notifications` INSERT restrito ao médico dono; `Consultas` recebeu policies UPDATE/DELETE. |
| 2026-04-17 | `GerenciarLocaisV2` deixou de ser ComingSoon — CRUD real em `locais_atendimento`. |
| 2026-04-17 | `usePayment` conectado a `create-stripe-checkout` e `verify-payment` (BRL em centavos). |
| 2026-04-17 | Adotado padrão `ComingSoonPage` e refeito `NotFound` em PT-BR (shadcn). |
| 2026-07-15 | Auditoria e reescrita completa deste CLAUDE.md (Anti-Vibe Coding — Akita Way, Fase 1). |
