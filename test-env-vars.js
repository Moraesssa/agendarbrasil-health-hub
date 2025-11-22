/**
 * Test environment variables configuration
 */
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Verificando variáveis de ambiente...\n');

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY'
];

let hasErrors = false;

// Check required variables
console.log('📋 Variáveis obrigatórias:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NÃO DEFINIDA`);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\n📋 Variáveis opcionais:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${varName}: não definida (opcional)`);
  }
});

if (hasErrors) {
  console.log('\n❌ Algumas variáveis obrigatórias não estão definidas.');
  console.log('Verifique o arquivo .env e configure as variáveis necessárias.');
  process.exit(1);
} else {
  console.log('\n✅ Todas as variáveis obrigatórias estão configuradas!');
  process.exit(0);
}