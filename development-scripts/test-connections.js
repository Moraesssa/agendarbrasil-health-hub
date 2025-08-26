#!/usr/bin/env node

/**
 * Teste de Conexões - AgendarBrasil Health Hub
 * 
 * Este script testa as conexões com os serviços externos
 * (Supabase, Stripe, Resend) para verificar se estão funcionando.
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
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}▶${colors.reset} ${msg}`)
};

// Carregar variáveis de ambiente
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    log.error('Arquivo .env não encontrado!');
    process.exit(1);
  }

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

  return envVars;
}

// Testar conexão com Supabase
async function testSupabase(envVars) {
  log.step('Testando conexão com Supabase...');
  
  const supabaseUrl = envVars['VITE_SUPABASE_URL'];
  const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-') || supabaseKey.includes('your-')) {
    log.warning('Credenciais do Supabase não configuradas');
    return false;
  }

  try {
    // Testar endpoint básico do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      log.success('Conexão com Supabase: OK');
      return true;
    } else {
      log.error(`Conexão com Supabase: Erro ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Conexão com Supabase: ${error.message}`);
    return false;
  }
}

// Testar configuração do Stripe
async function testStripe(envVars) {
  log.step('Testando configuração do Stripe...');
  
  const stripePublishable = envVars['VITE_STRIPE_PUBLISHABLE_KEY'];
  const stripeSecret = envVars['STRIPE_SECRET_KEY'];
  
  if (!stripePublishable || !stripeSecret || 
      stripePublishable.includes('your-') || stripeSecret.includes('your-')) {
    log.warning('Credenciais do Stripe não configuradas');
    return false;
  }

  try {
    // Testar API do Stripe
    const response = await fetch('https://api.stripe.com/v1/payment_methods', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.ok) {
      log.success('Configuração do Stripe: OK');
      return true;
    } else {
      log.error(`Configuração do Stripe: Erro ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Configuração do Stripe: ${error.message}`);
    return false;
  }
}

// Testar configuração do Resend
async function testResend(envVars) {
  log.step('Testando configuração do Resend...');
  
  const resendKey = envVars['RESEND_API_KEY'];
  
  if (!resendKey || resendKey.includes('your-')) {
    log.warning('Chave do Resend não configurada');
    return false;
  }

  try {
    // Testar API do Resend
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      log.success('Configuração do Resend: OK');
      return true;
    } else {
      log.error(`Configuração do Resend: Erro ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Configuração do Resend: ${error.message}`);
    return false;
  }
}

// Testar funções do Supabase
async function testSupabaseFunctions(envVars) {
  log.step('Testando funções do Supabase...');
  
  const supabaseUrl = envVars['VITE_SUPABASE_URL'];
  const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];
  
  if (!supabaseUrl || !supabaseKey) {
    log.warning('Não é possível testar funções sem credenciais do Supabase');
    return false;
  }

  const functions = [
    'stripe-webhook',
    'send-appointment-reminder',
    'create-stripe-checkout'
  ];

  let successCount = 0;

  for (const funcName of functions) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${funcName}`, {
        method: 'OPTIONS',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok || response.status === 200) {
        log.success(`Função ${funcName}: Disponível`);
        successCount++;
      } else {
        log.warning(`Função ${funcName}: Não disponível (${response.status})`);
      }
    } catch (error) {
      log.warning(`Função ${funcName}: Erro de conexão`);
    }
  }

  return successCount > 0;
}

async function main() {
  log.title('🔗 AgendarBrasil Health Hub - Teste de Conexões');
  
  const envVars = loadEnvVars();
  
  const results = {
    supabase: await testSupabase(envVars),
    stripe: await testStripe(envVars),
    resend: await testResend(envVars),
    functions: await testSupabaseFunctions(envVars)
  };
  
  // Resumo dos resultados
  log.title('📊 Resumo dos Testes');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`Testes realizados: ${totalTests}`);
  console.log(`Testes aprovados: ${passedTests}`);
  console.log(`Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    log.success('Todos os serviços estão funcionando corretamente!');
    process.exit(0);
  } else {
    log.warning('Alguns serviços precisam de configuração.');
    process.exit(1);
  }
}

main().catch(error => {
  log.error(`Erro durante os testes: ${error.message}`);
  process.exit(1);
});