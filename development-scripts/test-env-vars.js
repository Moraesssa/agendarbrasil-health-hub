#!/usr/bin/env node

/**
 * Teste de Variáveis de Ambiente - AgendarBrasil Health Hub
 * 
 * Este script verifica se todas as variáveis de ambiente necessárias
 * estão configuradas corretamente e testa as conexões.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

log.title('🔍 AgendarBrasil Health Hub - Verificação de Ambiente');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  log.error('Arquivo .env não encontrado!');
  console.log('💡 Execute: cp .env.example .env');
  console.log('💡 Em seguida, configure as variáveis no arquivo .env');
  console.log('💡 Ou execute: node setup-environment.js');
  process.exit(1);
}

log.success('Arquivo .env encontrado');

// Ler e processar o arquivo .env
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('\n📋 Variáveis encontradas no .env:');
Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  const maskedValue = value.length > 10 ? 
    value.substring(0, 8) + '...' + value.substring(value.length - 4) : 
    value;
  console.log(`   ${key} = ${maskedValue}`);
});

// Verificar variáveis obrigatórias
console.log('\n🔧 Verificando configurações obrigatórias:');

const requiredVars = [
  { name: 'VITE_SUPABASE_URL', description: 'URL do projeto Supabase' },
  { name: 'VITE_SUPABASE_ANON_KEY', description: 'Chave pública do Supabase' },
  { name: 'VITE_APP_ENV', description: 'Ambiente da aplicação' }
];

let hasErrors = false;

requiredVars.forEach(({ name, description }) => {
  const value = envVars[name];
  if (!value || value.includes('your-') || value.includes('xxx')) {
    log.error(`${name}: Não configurado ou usando valor placeholder`);
    console.log(`   ${colors.yellow}Descrição: ${description}${colors.reset}`);
    hasErrors = true;
  } else {
    log.success(`${name}: Configurado`);
  }
});

// Verificar configurações de integração
console.log('\n🔧 Verificando integrações:');

const integrations = [
  {
    name: 'Supabase Service Role',
    vars: ['SUPABASE_SERVICE_ROLE_KEY'],
    description: 'Necessário para funções server-side'
  },
  {
    name: 'Stripe Payment',
    vars: ['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    description: 'Necessário para processamento de pagamentos'
  },
  {
    name: 'Resend Email',
    vars: ['RESEND_API_KEY'],
    description: 'Necessário para envio de emails de lembrete'
  }
];

integrations.forEach(({ name, vars, description }) => {
  const configuredVars = vars.filter(varName => {
    const value = envVars[varName];
    return value && !value.includes('your-') && !value.includes('xxx');
  });
  
  if (configuredVars.length === vars.length) {
    log.success(`${name}: Totalmente configurado`);
  } else if (configuredVars.length > 0) {
    log.warning(`${name}: Parcialmente configurado (${configuredVars.length}/${vars.length})`);
    console.log(`   ${colors.yellow}${description}${colors.reset}`);
  } else {
    log.warning(`${name}: Não configurado`);
    console.log(`   ${colors.yellow}${description}${colors.reset}`);
  }
});

// Verificar configurações específicas
console.log('\n🔧 Verificando configurações específicas:');

// Verificar URL do Supabase
const supabaseUrl = envVars['VITE_SUPABASE_URL'];
if (supabaseUrl && supabaseUrl.includes('.supabase.co')) {
  log.success('URL do Supabase: Formato válido');
} else if (supabaseUrl) {
  log.warning('URL do Supabase: Formato pode estar incorreto');
}

// Verificar chaves do Stripe
const stripePublishable = envVars['VITE_STRIPE_PUBLISHABLE_KEY'];
if (stripePublishable && stripePublishable.startsWith('pk_')) {
  log.success('Stripe Publishable Key: Formato válido');
} else if (stripePublishable && !stripePublishable.includes('your-')) {
  log.warning('Stripe Publishable Key: Formato pode estar incorreto');
}

const stripeSecret = envVars['STRIPE_SECRET_KEY'];
if (stripeSecret && stripeSecret.startsWith('sk_')) {
  log.success('Stripe Secret Key: Formato válido');
} else if (stripeSecret && !stripeSecret.includes('your-')) {
  log.warning('Stripe Secret Key: Formato pode estar incorreto');
}

// Verificar chave do Resend
const resendKey = envVars['RESEND_API_KEY'];
if (resendKey && resendKey.startsWith('re_')) {
  log.success('Resend API Key: Formato válido');
} else if (resendKey && !resendKey.includes('your-')) {
  log.warning('Resend API Key: Formato pode estar incorreto');
}

// Resumo final
console.log('\n📊 Resumo da Configuração:');

if (hasErrors) {
  log.error('Configuração incompleta!');
  console.log('\n🛠️  Para corrigir:');
  console.log('1. Execute: node setup-environment.js (assistente interativo)');
  console.log('2. Ou edite manualmente o arquivo .env');
  console.log('3. Use o arquivo .env.example como referência');
  process.exit(1);
} else {
  log.success('Configuração básica completa!');
  
  const totalIntegrations = integrations.length;
  const configuredIntegrations = integrations.filter(({ vars }) => 
    vars.every(varName => {
      const value = envVars[varName];
      return value && !value.includes('your-') && !value.includes('xxx');
    })
  ).length;
  
  console.log(`\n📈 Integrações configuradas: ${configuredIntegrations}/${totalIntegrations}`);
  
  if (configuredIntegrations === totalIntegrations) {
    log.success('Todas as integrações estão configuradas!');
    console.log('🚀 Execute: npm run dev');
  } else {
    log.info('Algumas integrações ainda precisam ser configuradas');
    console.log('🚀 Execute: npm run dev (funcionalidade básica disponível)');
    console.log('⚙️  Execute: node setup-environment.js (para configurar integrações)');
  }
}