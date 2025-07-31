# 🚀 Guia de Configuração Rápida - AgendarBrasil Health Hub

Este guia irá ajudá-lo a configurar rapidamente o ambiente de desenvolvimento do AgendarBrasil Health Hub.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase
- Conta no Stripe (opcional, para pagamentos)
- Conta no Resend (opcional, para emails)

## ⚡ Configuração Automática (Recomendado)

### 1. Clone e instale dependências
```bash
git clone <seu-repositorio>
cd agendarbrasil-health-hub
npm install
```

### 2. Execute o assistente de configuração
```bash
npm run setup
```

O assistente irá:
- ✅ Criar o arquivo `.env` automaticamente
- ✅ Solicitar suas credenciais de forma interativa
- ✅ Validar as configurações
- ✅ Testar as conexões

### 3. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## 🔧 Configuração Manual

### 1. Copie o arquivo de exemplo
```bash
cp .env.example .env
```

### 2. Configure as variáveis obrigatórias no arquivo `.env`

#### Supabase (Obrigatório)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

#### Stripe (Opcional - Para pagamentos)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua-chave-publica
STRIPE_SECRET_KEY=sk_test_sua-chave-secreta
STRIPE_WEBHOOK_SECRET=whsec_seu-webhook-secret
```

#### Resend (Opcional - Para emails)
```env
RESEND_API_KEY=re_sua-chave-resend
```

### 3. Valide a configuração
```bash
npm run test:env
npm run test:connections
```

## 🔍 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run setup` | Assistente interativo de configuração |
| `npm run test:env` | Verifica variáveis de ambiente |
| `npm run test:connections` | Testa conexões com serviços |
| `npm run validate` | Executa todos os testes de validação |
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `node debug-doctor-config.js` | Debug de configurações de médicos |
| `node debug-locations.js` | Debug de localizações e busca de médicos |

## 📚 Obtendo as Credenciais

### Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe (Para pagamentos)
1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta ou faça login
3. Vá em **Developers** → **API keys**
4. Copie:
   - **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
5. Para webhooks:
   - Vá em **Developers** → **Webhooks**
   - Adicione endpoint: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
   - Copie o **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Resend (Para emails)
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys**
4. Crie uma nova chave → `RESEND_API_KEY`

## 🚨 Solução de Problemas

### Erro: "Arquivo .env não encontrado"
```bash
cp .env.example .env
npm run setup
```

### Erro: "Supabase connection failed"
- Verifique se a URL do Supabase está correta
- Confirme se a chave anon está válida
- Teste no navegador: `https://seu-projeto.supabase.co/rest/v1/`

### Erro: "Stripe authentication failed"
- Verifique se está usando as chaves corretas (test/live)
- Confirme se a chave secreta começa com `sk_`
- Confirme se a chave pública começa com `pk_`

### Erro: "Resend API error"
- Verifique se a chave API está correta
- Confirme se a chave começa com `re_`
- Verifique se o domínio está verificado no Resend

## 🎯 Próximos Passos

Após a configuração:

1. **Desenvolvimento**: Execute `npm run dev` e acesse http://localhost:5173
2. **Banco de dados**: Configure as tabelas no Supabase usando as migrations
3. **Webhooks**: Configure os webhooks do Stripe para pagamentos
4. **Deploy**: Use `npm run build` para gerar o build de produção

## 📞 Suporte

Se encontrar problemas:

1. Execute `npm run validate` para diagnóstico completo
2. Verifique os logs no console do navegador
3. Consulte a documentação dos serviços (Supabase, Stripe, Resend)
4. Verifique se todas as variáveis estão configuradas corretamente

---

**Dica**: Use sempre o assistente de configuração (`npm run setup`) para uma experiência mais suave! 🚀