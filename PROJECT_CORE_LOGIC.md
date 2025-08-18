# A Alma do Projeto: Arquitetura da Lógica do Backend

Este documento detalha a arquitetura central do backend, focando em como a lógica de negócio, a segurança e a manipulação de dados são implementadas diretamente no banco de dados Supabase. A ideia é "desenhar" a alma do projeto.

## 1. Row-Level Security (RLS): O Guardião dos Dados

RLS é a espinha dorsal da segurança do sistema. Em vez de controlar permissões no código da aplicação (o que pode ser falho), as regras são aplicadas diretamente no banco de dados. Nenhuma consulta, seja do frontend ou de uma API, pode contornar essas regras.

A lógica fundamental é: **"Você só pode acessar aquilo que é seu"**.

---

### 1.1. Tabela: `profiles`

- **Propósito:** Armazena a identidade de cada usuário.
- **RLS Policy:**
    - **`SELECT` (Ver Dados):**
        - **Regra:** `auth.role() = 'authenticated'`
        - **Tradução:** Qualquer usuário que esteja logado pode ver os perfis de outros usuários. Isso é comum para permitir buscas por nomes, por exemplo.
    - **`UPDATE` (Atualizar Dados):**
        - **Regra:** `auth.uid() = id`
        - **Tradução:** Um usuário só pode atualizar o seu próprio perfil. Você não pode alterar o nome de outro usuário.
    - **`INSERT` / `DELETE` (Criar / Deletar):**
        - **Regra:** Geralmente desabilitado diretamente. A criação de perfil é gerenciada pelo sistema de `auth` do Supabase (através do "sign up"), e a deleção é uma operação sensível, provavelmente restrita ao `service_role`.

---

### 1.2. Tabela: `medicos`

- **Propósito:** Dados profissionais específicos dos médicos.
- **RLS Policy:**
    - **`SELECT` (Ver Dados):**
        - **Regra:** `auth.role() = 'authenticated'`
        - **Tradução:** As informações profissionais de um médico (CRM, especialidades) são públicas para qualquer usuário logado, para permitir a busca e seleção de profissionais.
    - **`INSERT` / `UPDATE` / `DELETE` (Modificar Dados):**
        - **Regra:** `auth.uid() = user_id`
        - **Tradução:** Apenas o próprio médico pode criar, atualizar ou deletar suas informações profissionais.

---

### 1.3. Tabela: `locais_atendimento`

- **Propósito:** Gerenciar as clínicas e consultórios de um médico.
- **RLS Policy:**
    - **`SELECT` (Ver Dados):**
        - **Regra:** `status = 'ativo' OR auth.uid() = medico_id`
        - **Tradução:** Qualquer usuário logado pode ver locais que estão `ativos`. No entanto, um médico pode ver *todos* os seus próprios locais, mesmo que estejam com status 'inativo' ou 'em manutenção'. Isso permite que ele gerencie locais que não estão visíveis para o público.
    - **`INSERT` / `UPDATE` / `DELETE` (Modificar Dados):**
        - **Regra:** `auth.uid() = medico_id`
        - **Tradução:** Apenas o médico "dono" pode adicionar, atualizar ou remover seus locais de atendimento.

---

### 1.4. Tabela: `consultas`

- **Propósito:** O coração do sistema, onde agendamentos são armazenados.
- **RLS Policy:** Esta é a política mais restritiva e importante.
    - **`SELECT` (Ver Dados):**
        - **Regra:** `auth.uid() = paciente_id OR auth.uid() = medico_id`
        - **Tradução:** Você só pode ver uma consulta se for o paciente agendado ou o médico da consulta. Ninguém mais no sistema pode ver os detalhes desse agendamento.
    - **`UPDATE` (Atualizar Dados):**
        - **Regra:** `auth.uid() = paciente_id OR auth.uid() = medico_id`
        - **Tradução:** Apenas o paciente ou o médico envolvidos podem modificar a consulta (ex: cancelar, reagendar).
    - **`INSERT` (Criar Dados):**
        - **Regra:** **`false`** (Desabilitado para todos)
        - **Tradução:** Ninguém tem permissão para criar uma consulta diretamente na tabela. Esta é uma medida de segurança crucial. A criação é forçada a passar por uma `SECURITY DEFINER` function, como veremos na próxima seção.
    - **`DELETE` (Deletar Dados):**
        - **Regra:** Geralmente também desabilitado. A operação de "cancelar" uma consulta é um `UPDATE` no status, não uma deleção física do registro, para manter o histórico.

## 2. Lógica de Inserção de Dados: O Padrão `SECURITY DEFINER`

Como vimos, a inserção direta na tabela `consultas` é bloqueada. Isso é intencional e muito importante para a integridade do sistema. Se um usuário pudesse inserir uma consulta diretamente, ele poderia:
- Agendar um horário já ocupado.
- Agendar fora do horário de atendimento do médico.
- Definir um preço incorreto para a consulta.

Para resolver isso, o sistema usa um padrão poderoso e seguro: **Funções `SECURITY DEFINER`**.

- **Função `SECURITY INVOKER` (Padrão):** Executa com as permissões do *usuário que a chamou*. Se o usuário não pode inserir na tabela `consultas`, a função também não poderá.
- **Função `SECURITY DEFINER` (Especial):** Executa com as permissões do *dono da função* (geralmente o administrador do banco). Ela ignora temporariamente as permissões do usuário chamador, permitindo que a função execute lógica privilegiada de forma controlada.

### Estudo de Caso: `reserve_appointment_slot`

A função `reserve_appointment_slot` (cuja existência inferimos do `database-investigation.sql`) é o exemplo perfeito deste padrão.

**Fluxo de Agendamento de uma Consulta:**

```mermaid
sequenceDiagram
    participant User as Usuário (Frontend)
    participant Supabase as API Supabase
    participant reserve_appointment_slot as "Função (SECURITY DEFINER)"
    participant Consultas as Tabela `consultas`

    User->>+Supabase: Chama a função `rpc('reserve_appointment_slot', {...})`
    Note right of User: O usuário NÃO tem permissão<br>de INSERT na tabela `consultas`.

    Supabase->>+reserve_appointment_slot: Executa a função
    Note left of reserve_appointment_slot: A função executa com<br>privilégios de administrador.

    reserve_appointment_slot->>reserve_appointment_slot: 1. Valida os dados (horário, médico, etc.)
    reserve_appointment_slot->>reserve_appointment_slot: 2. Verifica se o horário está realmente livre
    reserve_appointment_slot->>reserve_appointment_slot: 3. Calcula o preço correto

    alt Horário válido e livre
        reserve_appointment_slot->>+Consultas: INSERT INTO consultas (...)
        Note right of Consultas: A inserção é permitida<br>porque a função tem privilégios.
        Consultas-->>-reserve_appointment_slot: Retorna sucesso
        reserve_appointment_slot-->>-Supabase: Retorna { success: true, consulta_id: ... }
    else Horário inválido ou ocupado
        reserve_appointment_slot-->>-Supabase: Retorna { success: false, error: "Horário não disponível" }
    end

    Supabase-->>-User: Retorna o resultado da operação
```

**Vantagens desta abordagem:**

1.  **Segurança Máxima:** O usuário final nunca tem acesso direto de escrita à tabela.
2.  **Lógica Centralizada:** Todas as regras de negócio para criar um agendamento estão em um único lugar, no banco de dados. Isso evita duplicação de código e inconsistências.
3.  **Atomicidade:** A função pode realizar várias etapas (verificar, calcular, inserir) como uma única transação. Se qualquer etapa falhar, nada é salvo.

## 3. Funções do Banco de Dados: O Cérebro do Sistema

As funções PostgreSQL são o cérebro que executa a lógica de negócio. Elas são chamadas pelo frontend através da API do Supabase (`rpc` calls).

### Fluxo de uma Ação do Usuário (Busca por Médico)

Este diagrama mostra como uma simples ação do usuário no frontend dispara uma cadeia de eventos que culmina na execução de uma função no banco de dados.

```mermaid
graph TD
    A[Usuário seleciona 'Cardiologia' em 'São Paulo - SP'] --> B{Frontend App};
    B --> C{API Supabase};
    C --> D[Chama a função<br>rpc('get_doctors_by_location_and_specialty', ...)];
    D --> E[Executa a função no DB];
    E --> F[Filtra tabelas `profiles` e `medicos`];
    F --> G[Aplica RLS para garantir<br>que apenas dados públicos sejam vistos];
    G --> D;
    D --> C;
    C --> B;
    B --> H[Renderiza a lista de médicos na tela];

    subgraph "Aplicação (Browser)"
        A
        B
        H
    end

    subgraph "Infraestrutura Supabase"
        C
    end

    subgraph "Banco de Dados (PostgreSQL)"
        D
        E
        F
        G
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px
```

### Detalhamento das Funções Principais

#### `get_doctors_by_location_and_specialty(p_specialty, p_city, p_state)`
- **Lógica:** Esta função é a base da busca por médicos. Ela recebe a especialidade e a localização, e cruza as informações das tabelas `profiles`, `medicos` e `locais_atendimento` para encontrar os profissionais que atendem aos critérios.
- **Parâmetros:** `p_specialty` (texto), `p_city` (texto), `p_state` (texto).
- **Retorno:** Uma lista de objetos, cada um representando um médico com seu nome, CRM, especialidades e outras informações de perfil.

#### `search_locations(...)`
- **Lógica:** Uma função de busca muito mais poderosa, focada em locais. Permite filtros complexos como "locais em Curitiba que tenham estacionamento e acessibilidade". Ela provavelmente usa os índices GIN nos campos JSONB (`facilidades`) para uma performance otimizada.
- **Parâmetros:** `search_query` (texto), `filter_cidade` (texto), `filter_facilidades` (array de textos), etc.
- **Retorno:** Uma lista de locais de atendimento, possivelmente com um `match_score` para ordenar os resultados por relevância.

#### `get_doctor_schedule_data(p_doctor_id)`
- **Lógica:** Quando um paciente seleciona um médico e vai para a tela de agendamento, esta função é chamada para buscar tudo o que é necessário para montar o calendário: as configurações do médico (duração da consulta, horários de trabalho) e a lista de seus locais de atendimento.
- **Parâmetros:** `p_doctor_id` (UUID).
- **Retorno:** Um único objeto JSON contendo as configurações e uma lista de locais.

#### `get_available_slots_by_doctor(doctorId, date)`
- **Lógica:** (Inferida do `mockDataService`) Após obter os dados da agenda, o frontend provavelmente chama esta função para um dia específico. A função então gera todos os possíveis horários de consulta para aquele dia, consulta a tabela `consultas` para ver quais já estão ocupados, e retorna uma lista de horários com o status `available: true` ou `false`.
- **Parâmetros:** `doctorId` (UUID), `date` (data).
- **Retorno:** Uma lista de objetos de horário, como `{ time: '09:00', available: true }`.
