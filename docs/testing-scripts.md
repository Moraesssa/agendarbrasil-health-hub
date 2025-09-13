# Scripts de Teste e Depuração

Este documento descreve todos os scripts de teste e depuração disponíveis no projeto AgendarBrasil Health Hub.

## Scripts de Validação de Ambiente

### test-env-vars.js

Script para validação de variáveis de ambiente e configuração do projeto.

**Funcionalidades:**
- Verifica se o arquivo `.env` existe no diretório raiz
- Lista todas as variáveis de ambiente configuradas
- Valida variáveis obrigatórias (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV`, `VITE_FHIR_BASE_URL`)
- Fornece feedback claro sobre configurações ausentes
- Utiliza ES modules com resolução adequada de caminhos

**Execução:**
```bash
node test-env-vars.js
```

**Saída Esperada:**
```
✅ Arquivo .env encontrado
📋 Variáveis configuradas:
   VITE_SUPABASE_URL=https://projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_APP_ENV=development
   VITE_FHIR_BASE_URL=https://projeto.supabase.co/functions/v1
✅ Todas as variáveis obrigatórias estão configuradas
```

## Scripts de Teste de Funcionalidades

### testar-cidades-mg.js

Script abrangente para teste de cidades e médicos em Minas Gerais.

**Funcionalidades:**
- Testa a função `get_available_cities` para o estado de MG
- Valida busca de médicos por especialidade e localização
- Testa múltiplas especialidades: Cardiologia, Pediatria, Clínica Geral
- Fornece estatísticas detalhadas sobre disponibilidade de médicos
- Identifica cidades sem médicos para garantia de qualidade
- Carregamento seguro de variáveis de ambiente

**Execução:**
```bash
node testar-cidades-mg.js
```

**Validações Realizadas:**
- Conectividade com Supabase
- Integridade da função `get_available_cities`
- Precisão da função `get_doctors_by_location_and_specialty`
- Consistência entre contagem de médicos e dados reais

### testar-todas-cidades.js

Script completo para teste de todas as cidades e estados com médicos cadastrados no sistema.

**Funcionalidades:**
- Testa a função `get_available_states` para listar todos os estados disponíveis
- Valida a função `get_available_cities` para cada estado brasileiro
- Busca médicos por especialidade e localização em todas as cidades
- Testa 7 especialidades principais: Cardiologia, Pediatria, Anestesiologia, Dermatologia, Ginecologia, Infectologia, Medicina de Família
- Fornece estatísticas completas de cobertura nacional
- Gera resumo consolidado de estados e cidades com médicos
- Carregamento seguro de variáveis de ambiente com ES modules

**Execução:**
```bash
node testar-todas-cidades.js
```

**Validações Realizadas:**
- Conectividade completa com Supabase
- Integridade das funções `get_available_states` e `get_available_cities`
- Precisão da função `get_doctors_by_location_and_specialty` em escala nacional
- Cobertura geográfica do sistema de saúde
- Consistência de dados entre estados e cidades
- Disponibilidade de especialidades médicas por região

**Saída Esperada:**
```
🔍 TESTANDO TODAS AS CIDADES COM MÉDICOS CADASTRADOS

📋 1. ESTADOS DISPONÍVEIS:
   Total de estados: 5
   1. MG - Minas Gerais
   2. SP - São Paulo
   3. SC - Santa Catarina
   4. AM - Amazonas
   5. DF - Distrito Federal

🗺️ ESTADO: MG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📍 Cidades em MG: 2
   
   🏙️ Belo Horizonte/MG (15 médicos)
      ✅ Cardiologia: 3 médicos
         - Dr. João Silva (CRM: 12345)
           Local: Hospital das Clínicas
      ✅ Pediatria: 2 médicos
         - Dra. Maria Santos (CRM: 67890)
           Local: Clínica Infantil

📊 RESUMO GERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Estados e cidades com médicos:
   MG: Belo Horizonte, Uberlândia
   SP: São Paulo, Campinas
```

### test-horarios-debug.js

Script para teste da geração de horários de agendamento.

**Funcionalidades:**
- Testa o algoritmo central de geração de horários
- Valida configuração de horários de funcionamento
- Simula diferentes cenários de dias da semana
- Útil para depuração de problemas de agendamento

**Execução:**
```bash
node test-horarios-debug.js
```

## Scripts de Depuração

### debug-doctor-config.js

Ferramenta abrangente de análise de configuração de médicos.

**Funcionalidades:**
- Acesso direto ao banco de dados Supabase
- Análise de perfis de médicos, especialidades e horários
- Teste de funcionalidade de busca por localização
- Validação de configurações de agendamento
- Saída detalhada para solução de problemas

**Execução:**
```bash
node debug-doctor-config.js
```

**⚠️ Nota de Segurança:** Este script contém credenciais hardcoded e deve ser usado apenas em ambientes de desenvolvimento.

### debug-locations.js

Script para depuração de dados de localização e busca de médicos.

**Funcionalidades:**
- Análise de dados de localização
- Teste de funcionalidade de busca de médicos
- Validação de dados geográficos
- Identificação de problemas de configuração

**Execução:**
```bash
node debug-locations.js
```

### debug-supabase.js

Script para depuração de conexão com Supabase.

**Funcionalidades:**
- Teste de conectividade com banco de dados
- Validação de credenciais
- Verificação de políticas RLS
- Diagnóstico de problemas de conexão

**Execução:**
```bash
node debug-supabase.js
```

### debug-horarios.js

Script avançado para depuração de agendamento.

**Funcionalidades:**
- Análise detalhada de geração de horários
- Teste de disponibilidade de médicos
- Validação de regras de negócio de agendamento
- Identificação de conflitos de horários

**Execução:**
```bash
node debug-horarios.js
```

## Scripts de Teste de Integração

### test-connections.js

Script para teste de conexões com serviços externos.

**Funcionalidades:**
- Teste de conectividade com Supabase
- Validação de integrações externas
- Verificação de APIs de terceiros
- Diagnóstico de problemas de rede

**Execução:**
```bash
npm run test:connections
```

### test-communication-integrations.js

Script para teste de integrações de comunicação.

**Funcionalidades:**
- Teste de integração WhatsApp
- Validação de envio de SMS
- Teste de funcionalidades de email
- Verificação de compartilhamento de sistema

**Execução:**
```bash
node test-communication-integrations.js
```

### test-maps-integration.js

Script para teste de integração com mapas.

**Funcionalidades:**
- Teste de múltiplos provedores de mapas
- Validação de geração de URLs
- Teste de funcionalidades de direções
- Verificação de compartilhamento de localização

**Execução:**
```bash
node test-maps-integration.js
```

## Scripts de Teste de Segurança

### test-payment-security.js

Script para teste de segurança de pagamentos.

**Funcionalidades:**
- Validação de integração Stripe
- Teste de webhooks de pagamento
- Verificação de políticas de segurança
- Auditoria de fluxo de pagamento

**Execução:**
```bash
node test-payment-security.js
```

### validate-rls-policies.js

Script para validação de políticas RLS (Row Level Security).

**Funcionalidades:**
- Verificação de políticas de segurança
- Teste de acesso a dados
- Validação de permissões de usuário
- Auditoria de segurança do banco

**Execução:**
```bash
node validate-rls-policies.js
```

## Scripts de Teste End-to-End

### test-e2e-agendamento.js

Script para teste completo do fluxo de agendamento.

**Funcionalidades:**
- Teste do fluxo completo de agendamento
- Validação de múltiplas etapas
- Teste de integração entre componentes
- Verificação de experiência do usuário

**Execução:**
```bash
node test-e2e-agendamento.js
```

### test-appointment-flow.js

Script para teste específico do fluxo de consultas.

**Funcionalidades:**
- Teste de criação de consultas
- Validação de notificações
- Teste de cancelamento e reagendamento
- Verificação de dados de consulta

**Execução:**
```bash
node test-appointment-flow.js
```

## Scripts de Validação de Produção

### validate-production-readiness.js

Script para validação de prontidão para produção.

**Funcionalidades:**
- Verificação de configurações de produção
- Validação de variáveis de ambiente
- Teste de performance
- Auditoria de segurança

**Execução:**
```bash
node validate-production-readiness.js
```

## Interfaces HTML de Teste

### test-auth.html

Interface HTML para teste de autenticação.

**Funcionalidades:**
- Teste visual de login/logout
- Validação de fluxos de autenticação
- Teste de recuperação de senha
- Interface amigável para testes manuais

### manual-ux-test.html

Interface para testes manuais de UX.

**Funcionalidades:**
- Teste de componentes de interface
- Validação de responsividade
- Teste de acessibilidade
- Feedback visual de interações

### test-communication-page.html

Interface para teste de funcionalidades de comunicação.

**Funcionalidades:**
- Teste de integração WhatsApp
- Validação de chamadas telefônicas
- Teste de compartilhamento
- Interface visual para testes

## Comandos NPM Relacionados

### Validação de Ambiente e Conexões
```bash
# Validação de ambiente
npm run test:env

# Teste de conexões
npm run test:connections

# Validação completa
npm run validate

# Setup interativo
npm run setup
```

### Testes de Segurança
```bash
# Auditoria de segurança
npm run security:audit

# Correção automática de vulnerabilidades
npm run security:fix

# Teste de segurança de pagamentos
npm run security:payment

# Validação completa de segurança de pagamentos
npm run security:validate
```

### Validação de Produção
```bash
# Validação completa de prontidão para produção
npm run production:validate

# Build de produção com validações completas
npm run build:production

# Validação específica de produção
npm run validate:production
```

### Testes End-to-End com Cypress
```bash
# Abrir interface do Cypress
npm run cypress:open

# Executar testes E2E
npm run cypress:run

# Executar testes no Chrome
npm run cypress:run:chrome

# Executar testes no Edge
npm run cypress:run:edge

# Alias para testes E2E
npm run test:e2e
npm run test:e2e:open
```

### Testes Unitários
```bash
# Executar testes unitários
npm run test:unit

# Executar testes em modo watch
npm run test:unit:watch

# Executar testes com cobertura
npm run test:coverage
```

## Boas Práticas para Testes

### Antes de Executar Scripts

1. **Verificar Ambiente**: Sempre execute `node test-env-vars.js` primeiro
2. **Backup de Dados**: Faça backup antes de scripts que modificam dados
3. **Ambiente Isolado**: Use ambiente de desenvolvimento/teste
4. **Credenciais Seguras**: Nunca commite credenciais hardcoded

### Durante a Execução

1. **Monitorar Saída**: Acompanhe logs e mensagens de erro
2. **Documentar Resultados**: Registre resultados para análise posterior
3. **Verificar Impacto**: Monitore impacto no sistema durante testes
4. **Interromper se Necessário**: Pare testes se detectar problemas críticos

### Após a Execução

1. **Analisar Resultados**: Revise todos os outputs e logs
2. **Documentar Problemas**: Registre bugs e inconsistências encontradas
3. **Limpar Dados de Teste**: Remova dados temporários criados
4. **Atualizar Documentação**: Mantenha documentação atualizada

## Solução de Problemas Comuns

### Erro de Conexão com Supabase

```bash
# Verificar variáveis de ambiente
node test-env-vars.js

# Testar conectividade
node debug-supabase.js
```

### Problemas de RLS

```bash
# Validar políticas
node validate-rls-policies.js

# Verificar configuração de médicos
node debug-doctor-config.js
```

### Dados Inconsistentes

```bash
# Testar dados de MG
node testar-cidades-mg.js

# Verificar localizações
node debug-locations.js
```

### Problemas de Performance

```bash
# Testar horários
node test-horarios-debug.js

# Validar fluxo completo
node test-e2e-agendamento.js
```

## Contribuindo com Novos Scripts

Ao criar novos scripts de teste:

1. **Nomenclatura**: Use prefixos `test-`, `debug-`, ou `validate-`
2. **Documentação**: Adicione descrição neste arquivo
3. **ES Modules**: Use sintaxe moderna de ES modules
4. **Tratamento de Erro**: Implemente tratamento robusto de erros
5. **Logs Claros**: Forneça saída clara e informativa
6. **Variáveis de Ambiente**: Use carregamento seguro de `.env`
7. **Português**: Use português para mensagens de usuário