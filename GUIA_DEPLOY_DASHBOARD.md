# 🚀 Guia de Deploy - Dashboard Médico Atualizado

## 🔍 Problema Identificado

O dashboard publicado mostra apenas:
- ❌ "Dashboard em desenvolvimento"
- ❌ Cards vazios com "-" e "Em breve"

**Causa:** Versão antiga do código está publicada (13 commits atrás)

---

## ✅ Solução: Deploy da Versão Atual

### Passo 1: Atualizar o Código Local

```bash
# 1. Verificar status atual
git status

# 2. Puxar as últimas mudanças do repositório
git pull origin main

# 3. Verificar se está atualizado
git log --oneline -5
```

### Passo 2: Fazer Build de Produção

```bash
# Limpar cache e fazer build limpo
npm run build:clean

# OU se o comando acima não funcionar:
npm run build
```

**Verificar se o build foi bem-sucedido:**
- ✅ Pasta `dist/` deve ser criada
- ✅ Sem erros no console
- ✅ Arquivos JS e CSS gerados

### Passo 3: Deploy (Escolha sua plataforma)

#### Opção A: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Seguir as instruções no terminal
```

**Configurações Vercel:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### Opção B: Netlify

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod --dir=dist

# 4. Seguir as instruções
```

**Configurações Netlify:**
- Build command: `npm run build`
- Publish directory: `dist`

#### Opção C: GitHub Pages

```bash
# 1. Adicionar ao package.json:
"homepage": "https://seu-usuario.github.io/agendarbrasil-health-hub",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# 2. Instalar gh-pages
npm install --save-dev gh-pages

# 3. Deploy
npm run deploy
```

#### Opção D: Deploy Manual (Qualquer Servidor)

```bash
# 1. Fazer build
npm run build

# 2. Copiar conteúdo da pasta dist/ para seu servidor
# Via FTP, SSH, ou painel de controle

# 3. Configurar servidor web (nginx/apache) para servir SPA
```

---

## 🔧 Configuração do Servidor (Importante!)

### Para SPA (Single Page Application)

O dashboard é uma SPA React, então precisa de configuração especial:

#### Vercel (vercel.json)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Netlify (_redirects ou netlify.toml)
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🔐 Variáveis de Ambiente

**IMPORTANTE:** Certifique-se de configurar as variáveis de ambiente na plataforma de deploy:

```env
VITE_SUPABASE_URL=https://ulebotjrsgheybhpdnxd.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_STRIPE_PUBLIC_KEY=sua_chave_stripe
```

### Como Configurar:

**Vercel:**
1. Dashboard → Settings → Environment Variables
2. Adicionar cada variável
3. Redeploy

**Netlify:**
1. Site settings → Build & deploy → Environment
2. Adicionar variáveis
3. Trigger deploy

---

## ✅ Checklist Pré-Deploy

- [ ] Código atualizado (`git pull`)
- [ ] Build local funciona (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivo de configuração SPA criado
- [ ] Testado localmente (`npm run preview`)

---

## 🧪 Testar Localmente Antes do Deploy

```bash
# 1. Fazer build
npm run build

# 2. Testar build localmente
npm run preview

# 3. Abrir http://localhost:4173
# 4. Verificar se o dashboard funciona corretamente
```

**O que verificar:**
- ✅ Dashboard carrega sem erros
- ✅ Cards de métricas aparecem
- ✅ Gráficos são renderizados
- ✅ Sidebar funciona
- ✅ Navegação entre páginas funciona

---

## 🐛 Troubleshooting

### Problema: "Dashboard em desenvolvimento" ainda aparece

**Solução:**
```bash
# 1. Limpar cache do navegador (Ctrl+Shift+Delete)
# 2. Fazer hard refresh (Ctrl+F5)
# 3. Verificar se o deploy foi bem-sucedido
# 4. Verificar logs da plataforma de deploy
```

### Problema: Página em branco

**Causas comuns:**
1. ❌ Variáveis de ambiente não configuradas
2. ❌ Configuração SPA ausente
3. ❌ Erro no build

**Solução:**
```bash
# Verificar console do navegador (F12)
# Verificar logs do servidor
# Verificar se dist/index.html existe
```

### Problema: Erro 404 ao navegar

**Causa:** Configuração SPA ausente

**Solução:** Adicionar arquivo de configuração (ver seção acima)

### Problema: Dados não carregam

**Causa:** Variáveis de ambiente do Supabase incorretas

**Solução:**
```bash
# Verificar .env local
cat .env

# Comparar com variáveis na plataforma de deploy
# Atualizar se necessário
```

---

## 📊 Verificar Deploy Bem-Sucedido

Após o deploy, verificar:

1. **URL do site funciona**
   - Abrir em navegador anônimo
   - Verificar se carrega

2. **Dashboard aparece corretamente**
   - Login funciona
   - Dashboard mostra métricas reais
   - Gráficos aparecem
   - Não há mensagem "em desenvolvimento"

3. **Console sem erros**
   - Abrir DevTools (F12)
   - Verificar aba Console
   - Verificar aba Network

4. **Funcionalidades funcionam**
   - Navegação entre páginas
   - Carregamento de dados
   - Interações (cliques, formulários)

---

## 🎯 Comandos Rápidos

### Deploy Rápido (Vercel)
```bash
git pull && npm run build && vercel --prod
```

### Deploy Rápido (Netlify)
```bash
git pull && npm run build && netlify deploy --prod --dir=dist
```

### Deploy via Git (Automático)
```bash
# Se configurado CI/CD:
git add .
git commit -m "Update dashboard"
git push origin main
# Deploy automático será acionado
```

---

## 🔄 Configurar Deploy Automático (Recomendado)

### Vercel
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Cada push em `main` faz deploy automático

### Netlify
1. Conectar repositório GitHub
2. Configurar build settings
3. Deploy automático em cada push

**Vantagens:**
- ✅ Deploy automático
- ✅ Preview de PRs
- ✅ Rollback fácil
- ✅ Logs de build

---

## 📝 Próximos Passos

Depois do deploy bem-sucedido:

1. ✅ Testar todas as funcionalidades
2. ✅ Verificar performance (Lighthouse)
3. ✅ Configurar domínio customizado
4. ✅ Configurar SSL/HTTPS
5. ✅ Configurar analytics (opcional)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. **Verificar logs:**
   - Logs da plataforma de deploy
   - Console do navegador (F12)
   - Network tab para erros de API

2. **Informações úteis para debug:**
   - URL do site
   - Mensagem de erro completa
   - Screenshot do problema
   - Logs do build

3. **Comandos de diagnóstico:**
   ```bash
   # Verificar versão do Node
   node --version
   
   # Verificar versão do npm
   npm --version
   
   # Verificar se build funciona
   npm run build
   
   # Verificar variáveis de ambiente
   cat .env
   ```

---

## 📌 Resumo

**Para fazer deploy agora:**

```bash
# 1. Atualizar código
git pull origin main

# 2. Fazer build
npm run build

# 3. Deploy (escolha um):
vercel --prod              # Vercel
netlify deploy --prod      # Netlify
npm run deploy             # GitHub Pages
```

**Tempo estimado:** 5-10 minutos

---

**Última atualização:** 30/10/2025  
**Versão do Dashboard:** 2.0 (Completo e Funcional)
