# Plataforma de Telemedicina - Arquitetura Técnica

Este repositório contém a estrutura base e a arquitetura técnica para uma plataforma de telemedicina completa, projetada para ser segura, escalável e intuitiva. Este documento descreve a organização do projeto, as tecnologias sugeridas e as diretrizes para o desenvolvimento futuro.

## Visão Geral

A plataforma é dividida em três componentes principais: um banco de dados relacional, uma API de backend e uma aplicação de frontend. A arquitetura foi desenhada para separar as responsabilidades, garantindo que cada parte do sistema possa ser desenvolvida, testada e escalada de forma independente.

##  Estrutura do Projeto

O projeto está organizado na seguinte estrutura de diretórios:

-   `database/`: Contém o esquema do banco de dados (DDL).
-   `backend/`: Contém a API RESTful (Node.js/Express).
-   `frontend/`: Contém a aplicação do usuário (React).

---

### 1. Banco de Dados (`database/`)

O cérebro do sistema, projetado para ser seguro e relacional.

-   **Arquivo Principal:** `database/schema.sql`
-   **Tecnologia Sugerida:** PostgreSQL (devido à sua robustez, suporte a tipos complexos como JSONB e UUID, e confiabilidade).
-   **Design:**
    -   **Relacional:** As tabelas (`Usuarios`, `Medicos`, `Pacientes`, `Consultas`, etc.) são interligadas com chaves estrangeiras para garantir a integridade dos dados.
    -   **Segurança:** O esquema inclui comentários para campos sensíveis (`anotacoes_clinicas`, `hipotese_diagnostica`) que **devem ser criptografados em repouso** na implementação final.
    -   **Auditoria:** Uma tabela `AuditoriaLogs` foi incluída para rastrear ações críticas, essencial para conformidade com a LGPD.
    -   **Performance:** Índices foram definidos em chaves estrangeiras e campos de busca frequente para otimizar a velocidade das consultas.

---

### 2. Backend (`backend/`)

A engrenagem por trás de tudo, responsável pela lógica de negócio, segurança e comunicação.

-   **Localização:** `backend/`
-   **Tecnologia Sugerida:** Node.js com Express.js.
-   **Design da API:**
    -   **RESTful:** A API é estruturada em torno de recursos (ex: `/consultas`, `/medicos`) com verbos HTTP padrão.
    -   **Autenticação:** A segurança dos endpoints será implementada usando **JWT (JSON Web Tokens)**. Um placeholder de middleware (`src/api/middlewares/authMiddleware.js`) já foi criado.
    -   **Estrutura:** O código está organizado em `routes`, `controllers`, `middlewares`, `config` e `services` para manter a clareza e a manutenibilidade.
-   **Como Começar (Desenvolvimento):**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

---

### 3. Frontend (`frontend/`)

A experiência do usuário, com interfaces separadas para médicos e pacientes.

-   **Localização:** `frontend/`
-   **Tecnologia Sugerida:** React.js.
-   **Design da Interface:**
    -   **Baseado em Componentes:** A estrutura de pastas reflete as interfaces descritas na especificação, com páginas dedicadas para o fluxo do médico (`pages/medico`) e do paciente (`pages/paciente`).
    -   **Componentes Criados (Placeholders):**
        -   **Médico:** `Dashboard`, `Agenda`, `SalaDeEsperaVirtual`, `TelaTeleconsulta`.
        -   **Paciente:** `AreaPaciente`, `TelaPreConsulta`, `TelaTeleconsulta`.
-   **Como Começar (Desenvolvimento):**
    ```bash
    cd frontend
    npm install
    npm start
    ```

---

### 4. Integrações de Terceiros

Para funcionalidades complexas, a arquitetura prevê a integração com serviços especializados:

-   **Serviço de Vídeo (WebRTC):** Em vez de construir uma solução do zero, a plataforma deve se integrar com um provedor de API de vídeo como **Twilio Video**, **Vonage (TokBox)** ou **Agora.io**. O backend orquestrará a criação de salas e a geração de tokens de acesso, enquanto o frontend se conectará diretamente ao serviço para otimizar a performance. Um placeholder (`backend/src/services/videoService.js`) foi criado.
-   **Assinatura Digital:** Para a emissão de documentos com validade legal (prescrições, atestados), é essencial integrar uma plataforma de assinatura digital que siga o padrão **ICP-Brasil**. O backend enviará os dados do documento para o serviço e armazenará o link seguro para o PDF assinado.

## Dependências

### Frontend Core
- **React**: ^18.3.1 - Framework principal
- **TypeScript**: ^5.5.3 - Tipagem estática
- **Vite**: ^5.4.1 - Build tool e dev server
- **React Router DOM**: ^6.26.2 - Roteamento SPA

### UI & Styling
- **Tailwind CSS**: ^3.4.11 - Framework CSS utilitário
- **Radix UI**: Componentes acessíveis completos (Dialog, Select, Toast, etc.)
- **Lucide React**: ^0.462.0 - Ícones SVG modernos
- **Class Variance Authority**: ^0.7.1 - Variantes de componentes
- **Tailwind Merge**: ^2.5.2 - Merge inteligente de classes CSS
- **Next Themes**: ^0.3.0 - Gerenciamento de temas dark/light

### State Management & Forms
- **TanStack Query**: ^5.56.2 - Gerenciamento de estado servidor
- **React Hook Form**: ^7.53.0 - Gerenciamento de formulários performático
- **Zod**: ^3.23.8 - Validação de esquemas TypeScript-first
- **@hookform/resolvers**: ^3.9.0 - Resolvers para validação

### Backend & Database
- **Supabase**: ^2.50.0 - Backend-as-a-Service completo
- **PostgreSQL** - Banco de dados relacional (via Supabase)
- **Node.js** - Runtime do servidor
- **Express.js** - Framework web para APIs

### Utilities & Tools
- **Date-fns**: ^3.6.0 - Manipulação de datas moderna
- **UUID**: ^10.0.0 - Geração de identificadores únicos
- **Dotenv**: ^17.2.1 - Gerenciamento de variáveis de ambiente
- **CMDK**: ^1.0.0 - Command palette acessível
- **Sonner**: ^1.5.0 - Toast notifications elegantes
- **Input OTP**: ^1.2.4 - Componente de entrada OTP
- **Embla Carousel**: ^8.3.0 - Carousel responsivo
- **React Day Picker**: ^8.10.1 - Seletor de datas
- **React Resizable Panels**: ^2.1.3 - Painéis redimensionáveis
- **Recharts**: ^2.12.7 - Gráficos e visualizações
- **Vaul**: ^0.9.3 - Drawer component

### Testing & Quality
- **Vitest**: ^3.2.4 - Framework de testes unitários rápido
- **Cypress**: ^14.5.4 - Testes E2E completos
- **ESLint**: ^9.9.0 - Linting e análise de código
- **Testing Library**: Testes de componentes React
- **JSDOM**: ^26.1.0 - DOM virtual para testes
- **Terser**: ^5.43.1 - Minificação de JavaScript

### Próximos Passos

1.  **Configurar o Ambiente:** Adicionar um arquivo `.env` em `backend/` com as credenciais do banco de dados e segredos da aplicação.
2.  **Implementar a Lógica:** Preencher os controladores do backend com a lógica de negócio e conectar ao banco de dados.
3.  **Construir a UI:** Desenvolver os componentes de React no frontend para corresponder aos layouts definidos e conectá-los à API do backend.
4.  **Integrar Serviços:** Implementar a comunicação com os serviços de vídeo e assinatura digital.
5.  **Escrever Testes:** Adicionar testes unitários, de integração e e2e para garantir a qualidade e a estabilidade da plataforma.
