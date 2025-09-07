# Guia de Desenvolvimento

## Como Usar

### Configuração Inicial

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd telemedicine-platform
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Execute a configuração inicial**
   ```bash
   npm run setup
   ```

### Desenvolvimento

#### Servidor de Desenvolvimento
```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run dev:clean    # Limpa cache e inicia o servidor
```

#### Testes
```bash
npm run test:unit           # Testes unitários
npm run test:unit:watch     # Testes unitários em modo watch
npm run test:coverage       # Cobertura de testes
npm run test:e2e           # Testes E2E
npm run test:e2e:open      # Abre interface do Cypress
```

#### Validação e Qualidade
```bash
npm run lint                # Executa linting
npm run validate           # Valida ambiente e conexões
npm run security:audit     # Auditoria de segurança
npm run security:payment   # Validação de segurança de pagamentos
```

### Build e Deploy

#### Build de Desenvolvimento
```bash
npm run build:dev          # Build para desenvolvimento
npm run build:clean        # Build limpo (remove cache)
```

#### Build de Produção
```bash
npm run build:production   # Build completo com validações
npm run validate:production # Valida prontidão para produção
```

### Estrutura de Arquivos

#### Componentes
- Coloque componentes reutilizáveis em `src/components/`
- Use PascalCase para nomes de componentes
- Cada componente deve ter sua própria pasta com index.ts

#### Páginas
- Páginas ficam em `src/pages/`
- Organize por tipo de usuário (Medico, Paciente, etc.)
- Use React Router para navegação

#### Serviços
- APIs e integrações ficam em `src/services/`
- Use TanStack Query para gerenciamento de estado servidor
- Implemente tratamento de erro consistente

#### Utilitários
- Funções auxiliares em `src/utils/`
- Use TypeScript para tipagem forte
- Mantenha funções puras sempre que possível

### Padrões de Código

#### Naming Conventions
- **Arquivos**: camelCase ou PascalCase
- **Componentes**: PascalCase
- **Funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Tipos**: PascalCase com sufixos descritivos

#### Imports
1. React e bibliotecas externas
2. Componentes internos
3. Utilitários e serviços
4. Tipos e interfaces
5. Imports relativos

### Debugging

#### Scripts de Debug Disponíveis
- `development-scripts/debug-supabase.js` - Debug de conexão Supabase
- `development-scripts/test-connections.js` - Teste de conexões
- `development-scripts/debug-horarios.js` - Debug de agendamentos
- `development-scripts/test-payment-security.js` - Teste de segurança de pagamentos

#### Logs e Monitoramento
- Use `console.log` para desenvolvimento
- Implemente logging estruturado para produção
- Configure monitoramento de erros

### Troubleshooting

#### Problemas Comuns

1. **Erro de conexão com Supabase**
   - Verifique as variáveis de ambiente
   - Execute `npm run test:connections`

2. **Problemas de build**
   - Limpe o cache: `npm run build:clean`
   - Verifique dependências: `npm audit`

3. **Testes falhando**
   - Execute `npm run test:unit:watch` para debug
   - Verifique configuração do ambiente de teste

4. **Problemas de performance**
   - Use React DevTools Profiler
   - Analise bundle com `rollup-plugin-visualizer`

### Contribuição

1. Crie uma branch para sua feature
2. Siga os padrões de código estabelecidos
3. Adicione testes para novas funcionalidades
4. Execute validações antes do commit
5. Crie pull request com descrição detalhada