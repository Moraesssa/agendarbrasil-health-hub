# Mapa de Rotas do Frontend e Integração com o Backend

Este documento detalha as rotas da aplicação frontend, os componentes de página que elas renderizam e como cada uma se integra com as tabelas e funções do banco de dados no `schema public`.

## Mapeamento Detalhado

A seguir, a lista de rotas e sua conexão com a arquitetura do sistema.

---

### **Rotas de Acesso e Cadastro**

| Rota | Componente da Página | Propósito | Integração com Backend |
| :--- | :--- | :--- | :--- |
| `/login` | `Login.tsx` | Autenticar usuários existentes. | Interage com o `auth.users` do Supabase para validar credenciais. |
| `/cadastrar` | `Cadastrar.tsx` | Registrar um novo usuário. | Cria uma nova entrada em `auth.users` e, em seguida, em `public.profiles`. |
| `/user-type` | `UserTypeSelection.tsx` | Permitir que o novo usuário escolha seu tipo (médico ou paciente). | Atualiza o campo `user_type` na tabela `public.profiles`. |
| `/onboarding` | `Onboarding.tsx` | Coletar informações adicionais após o cadastro. | Popula as tabelas `public.medicos` ou `public.pacientes` com base no tipo de usuário. |

---

### **Rotas do Paciente**

| Rota | Componente da Página | Propósito | Integração com Backend |
| :--- | :--- | :--- | :--- |
| `/agendamento` | `Agendamento.tsx` | Fluxo tradicional de agendamento em 7 passos. | **Funções:** `get_specialties`, `get_available_states`, `get_available_cities`, `get_doctors_for_scheduling`, `reserve_appointment_slot`. **Tabelas:** Lê de `medicos`, `locais_atendimento`; escreve em `consultas`. |
| `/agendamento-inteligente` | `AgendamentoIntegrado.tsx` | Fluxo inteligente de agendamento mantido como rota alternativa para testes. | **Funções:** `get_specialties`, `get_available_states`, `get_available_cities`, `get_doctors_for_scheduling`, `reserve_appointment_slot`. **Tabelas:** Lê de `medicos`, `locais_atendimento`; escreve em `consultas`. |
| `/agenda-paciente` | `AgendaPaciente.tsx` | Visualizar as consultas futuras e passadas do paciente. | **Tabelas:** Lê a tabela `public.consultas` filtrando pelo `paciente_id` do usuário logado (via RLS). |
| `/historico` | `Historico.tsx` | Ver um histórico detalhado de saúde e consultas. | **Tabelas:** Lê `public.consultas`, `public.pagamentos` e possivelmente outras tabelas relacionadas à saúde. |
| `/gerenciar-familia` | `GerenciarFamilia.tsx` | Adicionar ou remover membros da família para agendamento. | **Tabelas:** Lê e escreve na tabela `public.familiares` (tabela inferida). |
| `/dashboard-familiar` | `DashboardFamiliar.tsx` | Ver um painel com a saúde e consultas dos membros da família. | **Tabelas:** Lê `public.consultas` e `public.profiles` para os membros da família associados. |

---

### **Rotas do Médico**

| Rota | Componente da Página | Propósito | Integração com Backend |
| :--- | :--- | :--- | :--- |
| `/dashboard-medico` | `DashboardMedico.tsx` | Painel principal com métricas, consultas do dia, etc. | **Tabelas:** Lê `public.consultas` (filtrado pelo `medico_id`), `public.pacientes`. |
| `/perfil-medico` | `PerfilMedico.tsx` | Visualizar e editar o perfil profissional do médico. | **Tabelas:** Lê e atualiza `public.profiles` e `public.medicos`. |
| `/agenda-medico` | `AgendaMedico.tsx` | Visualizar a agenda completa do médico (dia, semana, mês). | **Tabelas:** Lê `public.consultas` filtrando pelo `medico_id` do usuário logado (via RLS). |
| `/gerenciar-agenda` | `GerenciarAgenda.tsx` | Configurar horários de atendimento, duração das consultas, etc. | **Tabelas:** Atualiza o campo `configuracoes` (JSONB) na tabela `public.medicos`. |
| `/gerenciar-locais` | `GerenciarLocais.tsx` | Adicionar, editar ou remover clínicas e consultórios. | **Tabelas:** Lê e escreve na tabela `public.locais_atendimento`. |
| `/pacientes-medico` | `PacientesMedico.tsx` | Ver a lista de todos os pacientes que já consultaram. | **Tabelas:** Lê `public.pacientes` e `public.consultas` para encontrar pacientes únicos. |
| `/financeiro` | `Financeiro.tsx` | Ver o histórico de pagamentos recebidos e métricas financeiras. | **Tabelas:** Lê as tabelas `public.pagamentos` e `public.consultas`. |

---

### **Rotas Gerais**

| Rota | Componente da Página | Propósito | Integração com Backend |
| :--- | :--- | :--- | :--- |
| `/` | `Index.tsx` | Página inicial da aplicação. | Geralmente estática ou com pouca interação com o banco de dados. |
| `/perfil` | `Perfil.tsx` | Página de perfil genérica para todos os usuários. | **Tabelas:** Lê e atualiza a tabela `public.profiles`. |
| `*` | `NotFound.tsx` | Página de erro 404 para rotas inexistentes. | Nenhuma integração com o banco de dados. |
