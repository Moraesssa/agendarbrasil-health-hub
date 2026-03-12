# CLAUDE.MD — Fonte Única de Verdade

> Última atualização: 2026-03-12

## 1. Visão Geral

Plataforma de telemedicina para o mercado brasileiro. Permite agendamento de consultas (presencial e teleconsulta), videochamadas, gestão de prontuários, prescrições digitais e pagamentos — em conformidade com LGPD e padrões ICP-Brasil.

## 2. Stack Tecnológica

| Camada | Tecnologia | Observações |
|---|---|---|
| **Framework** | React 18 + TypeScript | SPA (Single Page Application) |
| **Build** | Vite | Dev server + bundling |
| **Estilização** | Tailwind CSS + shadcn/ui (Radix) | Tokens semânticos em `index.css` |
| **Roteamento** | React Router DOM v6 | Client-side routing |
| **Estado servidor** | TanStack Query v5 | Cache, fetching, sync |
| **Formulários** | React Hook Form + Zod | Validação tipada |
| **Backend** | Supabase (BaaS) | PostgreSQL 15 + Auth + Edge Functions |
| **Pagamentos** | Stripe | Via Edge Functions |
| **Testes unitários** | Vitest | `src/**/__tests__/` |
| **Testes E2E** | Cypress | `cypress/` |

## 3. Estrutura de Diretórios (Canônica)

```
├── src/                    # Aplicação React principal
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # shadcn/ui base
│   │   └── [feature]/      # Por domínio (scheduling, medical, etc.)
│   ├── pages/              # Componentes de rota
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom hooks
│   ├── services/           # Comunicação com APIs/Supabase
│   ├── utils/              # Funções puras utilitárias
│   ├── types/              # Definições TypeScript
│   └── integrations/       # Configuração Supabase (auto-gerado)
├── supabase/
│   ├── functions/          # Edge Functions (Stripe, FHIR, emails)
│   └── migrations/         # Migrações SQL (READ-ONLY)
├── public/                 # Assets estáticos
└── docs/                   # Documentação
```

### Diretórios REMOVIDOS (legado)
- ~~`frontend/`~~ — CRA legado, não faz parte da app ativa
- ~~`backend/`~~ — Express.js legado, substituído por Supabase

## 4. Banco de Dados — Tabelas Ativas

### Tabelas Canônicas (lowercase)
| Tabela | Descrição |
|---|---|
| `profiles` | Perfil unificado de todos os usuários (auth.users) |
| `medicos` | Dados profissionais do médico (FK → profiles.id via user_id) |
| `pacientes` | Dados do paciente (FK → profiles.id via user_id) |
| `consultas` | Agendamentos de consultas (tabela principal) |
| `doctor_availability` | Horários disponíveis por dia da semana |
| `doctor_time_off` | Folgas e bloqueios de agenda |
| `locais_atendimento` | Locais de atendimento do médico |
| `horarios_disponibilidade` | Configuração de horários por tipo de consulta |
| `pagamentos` | Registros de pagamento (FK → consultas) |
| `encaminhamentos` | Encaminhamentos entre médicos |
| `family_members` | Vínculos familiares |
| `medication_reminders` | Lembretes de medicação |
| `medication_doses` | Doses registradas |
| `medical_certificates` | Atestados médicos |
| `medical_exams` | Exames solicitados |
| `medical_prescriptions` | Prescrições digitais |

### Tabelas Legadas (PascalCase) — NÃO USAR
| Tabela | Status |
|---|---|
| `Usuarios` | Legado. Usar `profiles` |
| `Medicos` | Legado. Usar `medicos` (lowercase) |
| `Pacientes` | Legado. Usar `pacientes` (lowercase) |
| `Consultas` | Legado. Usar `consultas` (lowercase) |
| `consultations` | Legado (sem FK para profiles). Não usar |

## 5. Regras de Negócio

### Tipos de Usuário
- **Paciente**: Agenda consultas, gerencia família, acompanha medicamentos
- **Médico**: Gerencia agenda, atende consultas, emite documentos
- **Familiar**: Agenda/visualiza em nome de familiares (permissões granulares)

### Fluxo de Agendamento
1. Paciente seleciona especialidade → estado → cidade → médico
2. Seleciona data e horário disponível
3. Reserva temporária criada (`temporary_reservations`, TTL 15min)
4. Pagamento via Stripe
5. Confirmação → registro em `consultas`

### Segurança (RLS)
- Todas as tabelas usam Row Level Security
- Médicos só acessam seus próprios dados e consultas
- Pacientes só acessam seus próprios dados
- Familiares acessam dados via `family_members` com permissões granulares
- **NUNCA** armazenar roles na tabela `profiles` — usar tabela separada

## 6. Convenções de Código

### Nomenclatura
- Componentes: `PascalCase.tsx`
- Utilitários: `camelCase.ts`
- Testes: `__tests__/[nome].test.ts`

### Regras Obrigatórias
1. **Sem cores hardcoded** — usar tokens semânticos do design system
2. **Sem `any` desnecessário** — tipar corretamente
3. **Sem imports não utilizados** — manter limpo
4. **Testes antes de implementação** (TDD)
5. **Sem arquivos de "fix temporário"** — resolver na raiz

### Import Order
1. React e libs externas
2. Componentes internos
3. Types/interfaces
4. Imports relativos

## 7. Edge Functions (Supabase)

| Função | Responsabilidade |
|---|---|
| `create-stripe-checkout` | Cria sessão de pagamento Stripe |
| `stripe-webhook` | Processa eventos do Stripe |
| `process-refund` | Processa estornos |
| `send-appointment-reminder` | Envia lembretes de consulta |
| `send-enhanced-email` | Emails transacionais |
| `fhir-patient` / `fhir-observation` | Interoperabilidade FHIR |
| `client-logs` | Recebe logs do frontend |
| `upload-document` | Upload de documentos médicos |
| `verify-payment` | Verifica status de pagamento |

## 8. Problemas Conhecidos

- [ ] `medico_notifications` INSERT com `WITH CHECK (true)` — qualquer autenticado pode criar
- [ ] `Consultas` (PascalCase) sem policy UPDATE/DELETE
- [ ] Tabelas PascalCase coexistem com lowercase (migração pendente)
