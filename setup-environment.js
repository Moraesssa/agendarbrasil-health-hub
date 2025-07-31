#!/usr/bin/env node

/**
 * AgendarBrasil Health Hub - Environment Setup Script
 * 
 * Este script ajuda a configurar automaticamente as variáveis de ambiente
 * necessárias para o funcionamento completo da aplicação.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

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
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}▶${colors.reset} ${msg}`)
};

async function main() {
  log.title('🏥 AgendarBrasil Health Hub - Configuração de Ambiente');
  
  console.log('Este assistente irá ajudá-lo a configurar todas as variáveis de ambiente necessárias.\n');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  // Verificar se .env já existe
  if (fs.existsSync(envPath)) {
    log.warning('Arquivo .env já existe!');
    const overwrite = await question('Deseja sobrescrever? (s/N): ');
    if (overwrite.toLowerCase() !== 's' && overwrite.toLowerCase() !== 'sim') {
      log.info('Configuração cancelada.');
      rl.close();
      return;
    }
  }
  
  // Ler template do .env.example
  if (!fs.existsSync(envExamplePath)) {
    log.error('Arquivo .env.example não encontrado!');
    rl.close();
    return;
  }
  
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  log.step('Configurando Supabase...');
  
  // Configuração do Supabase
  const supabaseUrl = await question('Digite sua Supabase URL (https://xxx.supabase.co): ');
  if (supabaseUrl.trim()) {
    envContent = envContent.replace('https://your-project-ref.supabase.co', supabaseUrl.trim());
    envContent = envContent.replace('https://ulebotjrsgheybhpdnxd.supabase.co', supabaseUrl.trim());
  }
  
  const supabaseAnonKey = await question('Digite sua Supabase Anon Key: ');
  if (supabaseAnonKey.trim()) {
    envContent = envContent.replace('your-anon-key-here', supabaseAnonKey.trim());
  }
  
  const supabaseServiceKey = await question('Digite sua Supabase Service Role Key: ');
  if (supabaseServiceKey.trim()) {
    envContent = envContent.replace('your-service-role-key-here', supabaseServiceKey.trim());
  }
  
  log.step('Configurando Stripe (opcional)...');
  
  const configureStripe = await question('Deseja configurar o Stripe agora? (s/N): ');
  if (configureStripe.toLowerCase() === 's' || configureStripe.toLowerCase() === 'sim') {
    const stripePublishable = await question('Digite sua Stripe Publishable Key (pk_test_...): ');
    if (stripePublishable.trim()) {
      envContent = envContent.replace('pk_test_your-stripe-publishable-key', stripePublishable.trim());
    }
    
    const stripeSecret = await question('Digite sua Stripe Secret Key (sk_test_...): ');
    if (stripeSecret.trim()) {
      envContent = envContent.replace('sk_test_your-stripe-secret-key', stripeSecret.trim());
    }
    
    const stripeWebhook = await question('Digite seu Stripe Webhook Secret (whsec_...): ');
    if (stripeWebhook.trim()) {
      envContent = envContent.replace('whsec_your-webhook-secret', stripeWebhook.trim());
    }
  }
  
  log.step('Configurando Resend (opcional)...');
  
  const configureResend = await question('Deseja configurar o Resend para emails? (s/N): ');
  if (configureResend.toLowerCase() === 's' || configureResend.toLowerCase() === 'sim') {
    const resendKey = await question('Digite sua Resend API Key (re_...): ');
    if (resendKey.trim()) {
      envContent = envContent.replace('re_your-resend-api-key', resendKey.trim());
    }
  }
  
  // Configurar URL da aplicação
  const appUrl = await question('URL da aplicação (padrão: http://localhost:5173): ');
  if (appUrl.trim()) {
    envContent = envContent.replace('http://localhost:5173', appUrl.trim());
  }
  
  // Salvar arquivo .env
  fs.writeFileSync(envPath, envContent);
  
  log.success('Arquivo .env criado com sucesso!');
  
  // Verificar configuração
  log.step('Verificando configuração...');
  
  try {
    const { execSync } = await import('child_process');
    execSync('node test-env-vars.js', { stdio: 'inherit' });
    log.success('Configuração validada!');
  } catch (error) {
    log.warning('Erro na validação. Execute "node test-env-vars.js" para verificar.');
  }
  
  log.title('🎉 Configuração Concluída!');
  
  console.log('Próximos passos:');
  console.log('1. Execute "npm run dev" para iniciar o servidor de desenvolvimento');
  console.log('2. Acesse http://localhost:5173 para ver a aplicação');
  console.log('3. Configure os webhooks do Stripe se necessário');
  console.log('4. Teste as funcionalidades de pagamento e email\n');
  
  rl.close();
}

main().catch((error) => {
  log.error('Erro durante a configuração:', error.message);
  rl.close();
  process.exit(1);
});