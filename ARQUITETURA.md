# Relatório Arquitetônico: Plataforma de Telemedicina

## 1. Resumo Executivo

Esta análise detalha a arquitetura da plataforma de telemedicina. A arquitetura atual é uma implementação moderna no estilo **Jamstack**, utilizando um frontend reativo e um backend baseado em serviços (Backend-as-a-Service).

A plataforma consiste em:
- **Frontend:** Uma Single-Page Application (SPA) construída com **React (Vite), TypeScript, e a biblioteca de componentes shadcn/ui**.
- **Backend:** Um conjunto de serviços hospedados na plataforma **Supabase**, que inclui um banco de dados PostgreSQL, autenticação, e funções serverless.

**Nota Importante:** A arquitetura aqui descrita difere significativamente daquela apresentada no arquivo `README.md`. A investigação revelou que o `README.md` descreve uma estrutura legada e não reflete o estado atual do projeto.

---

## 2. Arquitetura do Frontend

O frontend é o ponto de entrada para todos os usuários da plataforma. É uma aplicação moderna, performática e interativa.

- **Framework e Ferramentas de Build:**
  - **Vite:** Utilizado como servidor de desenvolvimento e para o build da aplicação, oferecendo uma experiência de desenvolvimento rápida.
  - **React 18:** A base da interface do usuário, permitindo a criação de componentes reutilizáveis e reativos.
  - **TypeScript:** Garante a tipagem estática do código, aumentando a robustez e facilitando a manutenção.

- **Localização do Código-Fonte:**
  - O código-fonte principal do frontend reside no diretório `src/` na raiz do projeto.

- **Interface do Usuário (UI):**
  - **shadcn/ui & Radix UI:** Biblioteca de componentes não estilizados que serve como base para a UI.
  - **Tailwind CSS:** Framework CSS utility-first para estilização, permitindo a criação de designs customizados de forma eficiente.
  - **clsx & tailwind-merge:** Utilitários para gerenciar classes CSS de forma dinâmica e sem conflitos.

- **Gerenciamento de Estado e Dados:**
  - **TanStack Query (React Query):** Utilizado para o gerenciamento de estado do servidor, data fetching, caching e sincronização de dados com o backend.
  - **React Hook Form & Zod:** Para construção e validação de formulários.

- **Roteamento:**
  - **React Router DOM:** Gerencia a navegação e as rotas da aplicação no lado do cliente.

- **Testes:**
  - **Vitest:** Para testes unitários e de componentes.
  - **Cypress:** Para testes end-to-end (E2E), simulando o fluxo do usuário de ponta a ponta.

---

## 3. Arquitetura do Backend (Supabase)

O backend adota o modelo **Backend-as-a-Service (BaaS)**, com todos os serviços centralizados na plataforma Supabase.

- **Banco de Dados (PostgreSQL):**
  - **Versão:** PostgreSQL 15.
  - **Schema:** O schema é complexo e customizado, gerenciado através de um grande número de arquivos de migração encontrados em `supabase/migrations/`.
  - **Lógica no Banco:** A aplicação faz uso extensivo de funcionalidades avançadas do PostgreSQL, como:
    - **Funções (Stored Procedures):** Para encapsular lógica de negócio diretamente no banco.
    - **Row Level Security (RLS):** Políticas de segurança em nível de linha são usadas para garantir que os usuários (ex: médicos) só possam acessar os dados aos quais têm permissão.

- **Autenticação:**
  - O serviço **Supabase Auth** é utilizado para gerenciar a identidade dos usuários, incluindo login, registro e gerenciamento de sessões via JWT.

- **Funções Serverless (Edge Functions):**
  - O diretório `supabase/functions/` contém diversas funções TypeScript que executam lógica de backend isolada. As principais funções incluem:
    - **Integração com Stripe:** `create-stripe-checkout`, `process-refund`, `stripe-webhook`.
    - **Integração com Saúde (FHIR):** `fhir-observation`, `fhir-patient` para interoperabilidade com padrões de dados de saúde.
    - **Comunicações:** `send-appointment-reminder`, `send-enhanced-email`.
    - **Utilitários:** `upload-document`, `client-logs`, `verify-payment`.

---

## 4. Integrações com Serviços de Terceiros

A arquitetura depende de serviços de terceiros para funcionalidades críticas:

- **Stripe:** Para processamento de pagamentos, gerenciamento de assinaturas e portais de cliente.
- **FHIR:** A presença de funções `fhir-*` indica a integração com sistemas que seguem o padrão Fast Healthcare Interoperability Resources, essencial para a troca de informações de saúde.
- **Webhooks Externos:** O sistema está preparado para receber dados de fontes externas, como a função `webhook-lab-results` sugere.

---

## 5. Artefatos Legados e Recomendações

Durante a análise, foram encontrados diretórios e arquivos que não fazem parte da arquitetura ativa.

- **Artefatos Identificados:**
  - **`backend/`:** Um projeto Node.js/Express que corresponde à descrição do `README.md`. Não possui integrações com a aplicação principal.
  - **`frontend/`:** Um projeto React (Create React App) básico, também descrito no `README.md`. É completamente ofuscado pela aplicação principal no diretório raiz.
  - **`README.md`:** O arquivo de documentação principal está desatualizado e descreve a arquitetura legada contida nos diretórios `frontend/` e `backend/`.

- **Recomendações:**
  1.  **Remover os Diretórios Legados:** É fortemente recomendado que os diretórios `frontend/` and `backend/` sejam removidos do repositório para evitar confusão e reduzir o tamanho do projeto.
  2.  **Atualizar o `README.md`:** O arquivo `README.md` deve ser completamente reescrito para refletir a arquitetura real (Vite + React + Supabase), incluindo instruções corretas de setup, build e teste.
  3.  **Substituir este Relatório:** Uma vez que o `README.md` for atualizado, este relatório (`ARQUITETURA.md`) pode ser arquivado ou removido, pois a documentação principal estará correta.
