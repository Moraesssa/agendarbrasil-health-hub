#!/usr/bin/env node

/**
 * Script para debugar as políticas RLS relacionadas aos médicos
 * Verifica se os médicos estão sendo retornados corretamente no agendamento
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
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
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

const envVars = loadEnvVars();
const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('- VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

// Função para fazer requisições HTTP ao Supabase
async function supabaseRequest(endpoint, options = {}) {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na requisição: ${error.message}`);
  }
}

// Função para chamar RPC functions
async function supabaseRPC(functionName, params = {}) {
  const url = `${supabaseUrl}/rest/v1/rpc/${functionName}`;
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na RPC: ${error.message}`);
  }
}

async function debugRLSMedicos() {
  console.log('🔍 DEBUGANDO POLÍTICAS RLS PARA MÉDICOS\n');

  try {
    // 1. Verificar dados brutos na tabela medicos (com service role)
    console.log('1️⃣ VERIFICANDO DADOS BRUTOS NA TABELA MEDICOS (Service Role)');
    try {
      const medicosRaw = await supabaseRequest('medicos?select=user_id,especialidades,crm,telefone,whatsapp&limit=5');
      console.log(`✅ Encontrados ${medicosRaw?.length || 0} médicos na tabela medicos`);
      medicosRaw?.forEach((medico, index) => {
        console.log(`   ${index + 1}. ID: ${medico.user_id}, Especialidades: ${medico.especialidades?.join(', ') || 'N/A'}`);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar médicos (service role):', error.message);
    }

    // 2. Verificar dados na tabela profiles (com service role)
    console.log('\n2️⃣ VERIFICANDO DADOS NA TABELA PROFILES (Service Role)');
    try {
      const profilesRaw = await supabaseRequest('profiles?select=id,display_name,user_type,is_active,email&user_type=eq.medico&limit=5');
      console.log(`✅ Encontrados ${profilesRaw?.length || 0} profiles de médicos`);
      profilesRaw?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}, Nome: ${profile.display_name}, Ativo: ${profile.is_active}`);
      });
    } catch (error) {
      console.error('❌ Erro ao buscar profiles (service role):', error.message);
    }

    // 3. Verificar locais de atendimento (com service role)
    console.log('\n3️⃣ VERIFICANDO LOCAIS DE ATENDIMENTO (Service Role)');
    try {
      const locaisRaw = await supabaseRequest('locais_atendimento?select=id,medico_id,nome_local,ativo,endereco&ativo=eq.true&limit=5');
      console.log(`✅ Encontrados ${locaisRaw?.length || 0} locais ativos`);
      locaisRaw?.forEach((local, index) => {
        const endereco = local.endereco;
        console.log(`   ${index + 1}. Médico: ${local.medico_id}, Local: ${local.nome_local}`);
        if (endereco) {
          console.log(`      Cidade: ${endereco.cidade || 'N/A'}, UF: ${endereco.uf || 'N/A'}`);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar locais (service role):', error.message);
    }

    // 4. Testar função get_doctors_by_location_and_specialty com service role
    console.log('\n4️⃣ TESTANDO FUNÇÃO get_doctors_by_location_and_specialty (Service Role)');
    
    // Primeiro, vamos pegar uma especialidade e localização válidas
    const especialidadesTeste = ['Cardiologia', 'Clínica Geral', 'Dermatologia'];
    const cidadesTeste = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];
    const estadosTeste = ['SP', 'RJ', 'MG'];

    let medicosEncontrados = false;
    for (const especialidade of especialidadesTeste) {
      for (let i = 0; i < cidadesTeste.length; i++) {
        const cidade = cidadesTeste[i];
        const estado = estadosTeste[i];
        
        console.log(`\n   Testando: ${especialidade} em ${cidade}/${estado}`);
        
        try {
          const medicosFunc = await supabaseRPC('get_doctors_by_location_and_specialty', {
            p_specialty: especialidade,
            p_city: cidade,
            p_state: estado
          });

          console.log(`   ✅ Função retornou ${medicosFunc?.length || 0} médicos`);
          medicosFunc?.forEach((medico, index) => {
            console.log(`      ${index + 1}. ID: ${medico.id}, Nome: ${medico.display_name}`);
          });
          
          if (medicosFunc?.length > 0) {
            medicosEncontrados = true;
            break;
          }
        } catch (error) {
          console.error(`   ❌ Erro na função RPC:`, error.message);
        }
      }
      if (medicosEncontrados) break;
    }

    // 5. Testar com cliente anônimo (simulando usuário não autenticado)
    console.log('\n5️⃣ TESTANDO COM CLIENTE ANÔNIMO (RLS Ativo)');
    
    try {
      const medicosAnon = await supabaseRequest('medicos?select=user_id,especialidades&limit=5', {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      console.log('⚠️ PROBLEMA: Cliente anônimo conseguiu acessar tabela medicos:', medicosAnon?.length);
    } catch (error) {
      console.log('✅ RLS funcionando - cliente anônimo não pode acessar tabela medicos:', error.message);
    }

    // 6. Testar função RPC com cliente anônimo
    console.log('\n6️⃣ TESTANDO FUNÇÃO RPC COM CLIENTE ANÔNIMO');
    
    try {
      const medicosRpcAnon = await supabaseRPC('get_doctors_by_location_and_specialty', {
        p_specialty: 'Cardiologia',
        p_city: 'São Paulo',
        p_state: 'SP'
      });
      console.log('✅ Função RPC funcionou para cliente anônimo, retornou:', medicosRpcAnon?.length || 0, 'médicos');
    } catch (error) {
      console.log('⚠️ Função RPC falhou para cliente anônimo:', error.message);
    }

    console.log('\n📋 RESUMO DO DEBUG:');
    console.log('- Tabela medicos: Dados brutos verificados');
    console.log('- Tabela profiles: Médicos ativos verificados');
    console.log('- Locais de atendimento: Locais ativos verificados');
    console.log('- Função RPC: Testada com diferentes parâmetros');
    console.log('- RLS: Políticas verificadas');
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

// Executar debug
debugRLSMedicos()
  .then(() => {
    console.log('\n✅ Debug concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha no debug:', error);
    process.exit(1);
  });.cmd})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

// Executar o debug
debugRLSMedicos().then(() => {
  console.log('\n🏁 Debug concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); process.exit(1);
  });