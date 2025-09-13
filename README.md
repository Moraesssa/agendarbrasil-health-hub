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

### 1. Banco de Dados (Supabase)

O cérebro do sistema, projetado para ser seguro e relacional, utilizando o Supabase como plataforma de banco de dados.

-   **Tecnologia:** PostgreSQL via Supabase (devido à sua robustez, suporte a tipos complexos como JSONB e UUID, e confiabilidade).
-   **Inicialização:** Use o script `backend/src/scripts/init-database.js` para criar as tabelas necessárias.
-   **Design:**
    -   **Relacional:** As tabelas (`usuarios`, `medicos`, `pacientes`, `consultas`, etc.) são interligadas com chaves estrangeiras para garantir a integridade dos dados.
    -   **Segurança:** O esquema inclui campos sensíveis que são protegidos pelas políticas de segurança do Supabase (Row Level Security).
    -   **Auditoria:** O Supabase fornece logs de auditoria para rastrear ações críticas, essencial para conformidade com a LGPD.
    -   **Performance:** Índices são definidos automaticamente em chaves primárias e podem ser adicionados em campos de busca frequente para otimizar a velocidade das consultas.

---

### 2. Backend (`backend/`)

A engrenagem por trás de tudo, responsável pela lógica de negócio, segurança e comunicação.

-   **Localização:** `backend/`
-   **Tecnologia:** Node.js com Express.js e Supabase.
-   **Design da API:**
    -   **RESTful:** A API é estruturada em torno de recursos (ex: `/consultas`, `/medicos`) com verbos HTTP padrão.
    -   **Autenticação:** A segurança dos endpoints é implementada usando o Supabase Auth, que fornece autenticação baseada em JWT (JSON Web Tokens).
    -   **Estrutura:** O código está organizado em `routes`, `controllers`, `middlewares`, `config` e `models` para manter a clareza e a manutenibilidade.
-   **Configuração do Supabase:**
    1. Crie uma conta no [Supabase](https://supabase.com/) e um novo projeto.
    2. Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais do Supabase:
       ```
       SUPABASE_URL=sua_url_do_supabase
       SUPABASE_KEY=sua_chave_do_supabase
       SUPABASE_SERVICE_KEY=sua_chave_de_servico_do_supabase
       VITE_FHIR_BASE_URL=https://sua_url_do_supabase/functions/v1
       ```
    3. Execute o script de inicialização do banco de dados:
       ```bash
       node src/scripts/init-database.js
       ```
    4. Teste a conexão com o Supabase:
       ```bash
       node src/test-supabase-connection.js
       ```
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
