# Diagramas de Arquitetura para Documentação de Patente

Este documento contém os diagramas técnicos em formato Mermaid para ilustrar a arquitetura do sistema de telemedicina.

---

## 1. Arquitetura Geral do Sistema

```mermaid
flowchart TB
    subgraph "Camada de Apresentação"
        WEB[Aplicação Web<br/>React + Vite]
        PWA[Progressive Web App]
    end
    
    subgraph "Camada de API"
        EDGE[Edge Functions<br/>Supabase Functions]
        REALTIME[Realtime<br/>WebSocket]
    end
    
    subgraph "Camada de Serviços"
        AUTH[Autenticação<br/>Supabase Auth]
        STORAGE[Armazenamento<br/>Supabase Storage]
        DB[(PostgreSQL 15<br/>com RLS)]
    end
    
    subgraph "Integrações Externas"
        STRIPE[Stripe<br/>Pagamentos]
        FHIR[FHIR Gateway<br/>Interoperabilidade]
        EMAIL[Email/SMS<br/>Notificações]
    end
    
    WEB --> EDGE
    WEB --> REALTIME
    PWA --> EDGE
    
    EDGE --> AUTH
    EDGE --> DB
    EDGE --> STORAGE
    
    EDGE --> STRIPE
    EDGE --> FHIR
    EDGE --> EMAIL
    
    REALTIME --> DB
```

---

## 2. Fluxo de Agendamento Completo

```mermaid
sequenceDiagram
    participant P as Paciente
    participant UI as Interface Web
    participant API as Edge Function
    participant DB as PostgreSQL
    participant OPT as Otimizador
    participant PAY as Stripe
    participant NOT as Notificações
    
    P->>UI: Seleciona especialidade/médico
    UI->>API: GET /available-slots
    API->>DB: Buscar disponibilidade
    DB-->>API: Slots disponíveis
    API-->>UI: Lista de horários
    
    P->>UI: Seleciona horário
    UI->>API: POST /reserve-appointment
    API->>DB: Criar reserva temporária
    API->>OPT: Validar otimização
    OPT-->>API: Slot válido
    DB-->>API: Reserva criada
    API-->>UI: ID da reserva + URL pagamento
    
    UI->>PAY: Redireciona para checkout
    P->>PAY: Realiza pagamento
    PAY->>API: Webhook: pagamento confirmado
    
    API->>DB: Confirmar agendamento
    API->>NOT: Enviar confirmação
    NOT->>P: Email/SMS confirmação
    
    API-->>UI: Agendamento confirmado
```

---

## 3. Fluxo de Otimização em Tempo Real

```mermaid
flowchart TD
    subgraph "Entrada de Dados"
        EVT[Evento Recebido]
        EVT --> |Chegada| E1[PATIENT_ARRIVAL]
        EVT --> |Atraso| E2[PATIENT_LATE]
        EVT --> |No-show| E3[PATIENT_NOSHOW]
        EVT --> |Emergência| E4[EMERGENCY]
    end
    
    subgraph "Motor de Eventos"
        E1 --> ENG[Event Engine]
        E2 --> ENG
        E3 --> ENG
        E4 --> ENG
    end
    
    subgraph "Processamento"
        ENG --> PRED[Preditores]
        PRED --> |ETA| ETA[ETAPredictor]
        PRED --> |Duração| DUR[DurationPredictor]
        PRED --> |Prioridade| PRI[PriorityClassifier]
        
        ETA --> OPT[Otimizador]
        DUR --> OPT
        PRI --> OPT
        
        OPT --> |Best-Insertion| BI[Algoritmo BI]
        BI --> |Refinamento| TWOOPT[2-opt]
    end
    
    subgraph "Validação"
        TWOOPT --> SIM[Simulador Monte Carlo]
        SIM --> |1000 iterações| RISK[Análise de Risco]
    end
    
    subgraph "Saída"
        RISK --> |Aprovado| SCHED[Nova Agenda]
        RISK --> |Risco Alto| ALERT[Alertas]
        SCHED --> NOT[Notificações]
    end
```

---

## 4. Modelo de Dados - Entidades Principais

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        string email
        string display_name
        string user_type
        boolean is_active
        timestamp created_at
    }
    
    MEDICOS {
        int id PK
        uuid user_id FK
        string crm
        json especialidades
        json dados_profissionais
        decimal valor_consulta
    }
    
    PACIENTES {
        int id PK
        uuid user_id FK
        json dados_pessoais
        json endereco
        json contato
    }
    
    CONSULTAS {
        int id PK
        uuid medico_id FK
        uuid paciente_id FK
        timestamp consultation_date
        string status
        string consultation_type
    }
    
    FAMILY_MEMBERS {
        uuid id PK
        uuid user_id FK
        uuid family_member_id FK
        string relationship
        string permission_level
        boolean can_schedule
        boolean can_cancel
    }
    
    HEALTH_METRICS {
        int id PK
        uuid patient_id FK
        string tipo
        decimal valor
        string unidade
        timestamp registrado_em
    }
    
    PAYMENTS {
        uuid id PK
        uuid consultation_id FK
        decimal amount
        string status
        string stripe_session_id
    }
    
    PROFILES ||--o| MEDICOS : "is doctor"
    PROFILES ||--o| PACIENTES : "is patient"
    PROFILES ||--o{ FAMILY_MEMBERS : "manages"
    PROFILES ||--o{ FAMILY_MEMBERS : "is managed by"
    PROFILES ||--o{ CONSULTAS : "attends as doctor"
    PROFILES ||--o{ CONSULTAS : "attends as patient"
    PROFILES ||--o{ HEALTH_METRICS : "has metrics"
    CONSULTAS ||--o| PAYMENTS : "has payment"
```

---

## 5. Sistema de Permissões Familiares

```mermaid
flowchart LR
    subgraph "Cuidador Principal"
        CP[Usuário Principal]
    end
    
    subgraph "Dependentes"
        D1[Filho menor]
        D2[Pai idoso]
        D3[Cônjuge]
    end
    
    subgraph "Níveis de Permissão"
        ADM[Admin<br/>Controle Total]
        EDT[Edit<br/>Agendar + Cancelar]
        VIW[View<br/>Apenas Visualizar]
    end
    
    subgraph "Ações Disponíveis"
        A1[can_schedule]
        A2[can_cancel]
        A3[can_view_history]
        A4[can_view_prescriptions]
        A5[can_manage_medications]
    end
    
    CP --> |admin| D1
    CP --> |edit| D2
    CP --> |view| D3
    
    ADM --> A1
    ADM --> A2
    ADM --> A3
    ADM --> A4
    ADM --> A5
    
    EDT --> A1
    EDT --> A2
    EDT --> A3
    
    VIW --> A3
```

---

## 6. Arquitetura FHIR

```mermaid
flowchart TB
    subgraph "Dados Internos"
        PROF[profiles]
        METR[health_metrics]
        CONS[consultas]
        PRESC[medical_prescriptions]
    end
    
    subgraph "Camada de Conversão"
        FUNC1[convert_profile_to_fhir_patient]
        FUNC2[convert_health_metric_to_fhir]
        TS[fhirService.ts]
    end
    
    subgraph "Cache FHIR"
        CACHE[(fhir_resources)]
    end
    
    subgraph "API FHIR"
        API1[/fhir/Patient]
        API2[/fhir/Observation]
        API3[/fhir/Practitioner]
        API4[/fhir/Appointment]
    end
    
    subgraph "Clientes Externos"
        RNDS[RNDS<br/>Rede Nacional]
        LAB[Laboratórios]
        HOSP[Hospitais]
    end
    
    PROF --> FUNC1
    METR --> FUNC2
    FUNC1 --> CACHE
    FUNC2 --> CACHE
    
    CACHE --> API1
    CACHE --> API2
    CONS --> TS --> API4
    
    API1 --> RNDS
    API2 --> LAB
    API4 --> HOSP
```

---

## 7. Fluxo de Pagamento com Stripe

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant E as Edge Function
    participant DB as Database
    participant S as Stripe
    
    U->>F: Clica "Pagar"
    F->>E: POST /create-stripe-checkout
    E->>DB: Buscar dados do agendamento
    DB-->>E: Dados da consulta
    E->>S: Criar Checkout Session
    S-->>E: Session URL
    E->>DB: Salvar payment (pending)
    E-->>F: Checkout URL
    
    F->>S: Redireciona usuário
    U->>S: Preenche dados + paga
    
    S->>E: Webhook: checkout.session.completed
    E->>E: Validar assinatura
    E->>DB: Atualizar payment (succeeded)
    E->>DB: Confirmar agendamento
    E->>E: Enviar notificações
    E-->>S: 200 OK
    
    S-->>F: Redireciona para success_url
    F->>U: Mostra confirmação
```

---

## 8. Fluxo do Simulador Monte Carlo

```mermaid
flowchart TD
    subgraph "Entrada"
        SCHED[Agenda Proposta]
        PARAMS[Parâmetros<br/>iterations=1000]
    end
    
    subgraph "Iteração i (1000x)"
        VAR[Aplicar Variações Estocásticas]
        VAR --> SAMP_DUR[Amostrar Duração<br/>Log-Normal]
        VAR --> SAMP_ETA[Amostrar Chegada<br/>Normal]
        
        SAMP_DUR --> SIM[Simular Execução]
        SAMP_ETA --> SIM
        
        SIM --> CALC[Calcular Métricas]
        CALC --> |Wait Time| M1[avgWaitTime_i]
        CALC --> |Idle Time| M2[avgIdleTime_i]
        CALC --> |Overtime| M3[hasOvertime_i]
    end
    
    subgraph "Agregação"
        M1 --> AGG[Agregar Resultados]
        M2 --> AGG
        M3 --> AGG
        
        AGG --> STATS[Calcular Estatísticas]
        STATS --> MEAN[Média]
        STATS --> P5[Percentil 5%]
        STATS --> P95[Percentil 95%]
        STATS --> PROB[Prob. Overtime]
    end
    
    subgraph "Análise de Risco"
        P95 --> RISK[Identificar Riscos]
        PROB --> RISK
        RISK --> BOTTLE[Gargalos]
        RISK --> CRIT[Caminhos Críticos]
        RISK --> REC[Recomendações]
    end
    
    SCHED --> VAR
    PARAMS --> VAR
```

---

## 9. Estados do Agendamento

```mermaid
stateDiagram-v2
    [*] --> Reservado: Usuário seleciona horário
    
    Reservado --> Expirado: Timeout (15 min)
    Reservado --> PagamentoPendente: Inicia pagamento
    
    PagamentoPendente --> Expirado: Timeout pagamento
    PagamentoPendente --> Confirmada: Pagamento aprovado
    PagamentoPendente --> Cancelada: Pagamento falhou
    
    Confirmada --> EmAndamento: Consulta iniciada
    Confirmada --> Cancelada: Usuário cancela
    Confirmada --> NaoCompareceu: Paciente faltou
    
    EmAndamento --> Realizada: Consulta finalizada
    
    Realizada --> [*]
    Cancelada --> [*]
    NaoCompareceu --> [*]
    Expirado --> [*]
    
    note right of Reservado: Reserva temporária\n(temporary_reservations)
    note right of Confirmada: Agendamento efetivo\n(consultas)
```

---

## 10. Componentes do Frontend

```mermaid
flowchart TB
    subgraph "Páginas Principais"
        HOME[Home]
        LOGIN[Login/Cadastro]
        DASH_P[Dashboard Paciente]
        DASH_M[Dashboard Médico]
        SCHED[Agendamento]
    end
    
    subgraph "Componentes de Agendamento"
        FILTRO[FiltroBusca]
        LISTA[ListaMedicos]
        HORARIOS[SeletorHorarios]
        CONFIRM[ConfirmacaoAgendamento]
    end
    
    subgraph "Componentes Familiares"
        FAM_LIST[FamilyMembersList]
        FAM_ADD[AddFamilyMember]
        FAM_PERM[PermissionsManager]
        FAM_DASH[FamilyDashboard]
    end
    
    subgraph "Componentes Médico"
        AGENDA[AgendaMedico]
        PRONTUARIO[Prontuario]
        RECEITA[Receituario]
    end
    
    subgraph "Serviços"
        S_AUTH[authService]
        S_AGEND[agendamentoService]
        S_FAM[familyService]
        S_FHIR[fhirService]
        S_PAY[paymentService]
    end
    
    HOME --> LOGIN
    LOGIN --> DASH_P
    LOGIN --> DASH_M
    
    DASH_P --> SCHED
    SCHED --> FILTRO --> LISTA --> HORARIOS --> CONFIRM
    
    DASH_P --> FAM_DASH
    FAM_DASH --> FAM_LIST
    FAM_DASH --> FAM_ADD
    FAM_LIST --> FAM_PERM
    
    DASH_M --> AGENDA
    DASH_M --> PRONTUARIO
    PRONTUARIO --> RECEITA
    
    SCHED --> S_AGEND
    FAM_DASH --> S_FAM
    PRONTUARIO --> S_FHIR
    CONFIRM --> S_PAY
```

---

## Notas de Uso

Estes diagramas foram criados usando sintaxe Mermaid e podem ser renderizados em:
- GitHub/GitLab (nativamente)
- Documentação Markdown com suporte Mermaid
- Ferramentas como Mermaid Live Editor (https://mermaid.live)
- Exportação para PNG/SVG para documentos de patente

Para uso em documentos de patente, recomenda-se exportar como imagens vetoriais (SVG) para máxima qualidade de impressão.
