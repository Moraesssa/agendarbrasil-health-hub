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

### Frontend
- **React**: ^18.3.1 - Framework principal
- **TypeScript**: ^5.5.3 - Tipagem estática
- **Vite**: ^5.4.1 - Build tool e dev server
- **Tailwind CSS**: ^3.4.11 - Framework CSS
- **Radix UI**: Componentes acessíveis
- **TanStack Query**: ^5.56.2 - Gerenciamento de estado servidor
- **React Router DOM**: ^6.26.2 - Roteamento
- **React Hook Form**: ^7.53.0 - Gerenciamento de formulários
- **Zod**: ^3.23.8 - Validação de esquemas

### Backend & Database
- **Supabase**: ^2.50.0 - Backend-as-a-Service
- **PostgreSQL** - Banco de dados relacional
- **Node.js** - Runtime do servidor

### Testing & Quality
- **Vitest**: ^3.2.4 - Framework de testes
- **Cypress**: ^14.5.4 - Testes E2E
- **ESLint**: ^9.9.0 - Linting
- **Testing Library**: Testes de componentes React

### Próximos Passos

1.  **Configurar o Ambiente:** Adicionar um arquivo `.env` em `backend/` com as credenciais do banco de dados e segredos da aplicação.
2.  **Implementar a Lógica:** Preencher os controladores do backend com a lógica de negócio e conectar ao banco de dados.
3.  **Construir a UI:** Desenvolver os componentes de React no frontend para corresponder aos layouts definidos e conectá-los à API do backend.
4.  **Integrar Serviços:** Implementar a comunicação com os serviços de vídeo e assinatura digital.
5.  **Escrever Testes:** Adicionar testes unitários, de integração e e2e para garantir a qualidade e a estabilidade da plataforma.
