import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado!');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remover aspas do início e do fim, se existirem
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        envVars[key.trim()] = value;
      }
    }
  });
  return envVars;
}

async function runTest() {
  console.log('🔬 Iniciando teste de diagnóstico mínimo...');

  const envVars = loadEnvVars();
  const supabaseUrl = envVars['VITE_SUPABASE_URL'];
  const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no arquivo .env');
    process.exit(1);
  }

  console.log(`📡 Conectando a: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📝 Tentando ler da tabela "profiles"...');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, user_type')
    .limit(5);

  if (error) {
    console.error('🚨 TESTE FALHOU! Erro ao consultar o banco de dados:');
    console.error(error);
    process.exit(1);
  }

  console.log('✅ TESTE BEM-SUCEDIDO! Conexão com o banco de dados está OK.');

  if (data && data.length > 0) {
    console.log(`🔍 Encontrados ${data.length} perfis. Aqui estão os primeiros 5:`);
    console.table(data);
  } else {
    console.log('⚠️ A tabela "profiles" está vazia ou não retornou dados.');
  }
}

runTest();
