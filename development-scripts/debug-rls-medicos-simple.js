#!/usr/bin/env node

/**
 * Script simples para debugar as políticas RLS relacionadas aos médicos
 * Verifica se os médicos estão sendo retornados corretamente no agendamento
 * 
 * Este script testa:
 * - Acesso direto às tabelas com diferentes níveis de permissão
 * - Funcionamento das funções RPC públicas
 * - Políticas RLS para médicos e locais de atendimento
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
    console.log('💡 Copie o arquivo .env.example para .env e configure as variáveis');
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

// Configuração do Supabase
const envVars = loadEnvVars();
const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente obrigatórias não configuradas:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('- VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

console.log('🔍 Iniciando debug das políticas RLS para médicos...\n');

// Função para fazer requisições HTTP simples
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': options.useServiceKey ? supabaseServiceKey : supabaseAnonKey,
        'Authorization': `Bearer ${options.useServiceKey ? supabaseServiceKey : supabaseAnonKey}`,
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Teste 1: Verificar acesso às tabelas principais
async function testTableAccess() {
  console.log('📋 Teste 1: Acesso às tabelas principais');
  
  const tables = ['medicos', 'locais_atendimento', 'profiles'];
  
  for (const table of tables) {
    console.log(`\n🔸 Testando tabela: ${table}`);
    
    // Teste com chave anônima
    const anonResult = await makeRequest(
      `${supabaseUrl}/rest/v1/${table}?select=*&limit=5`,
      { useServiceKey: false }
    );
    
    console.log(`  Acesso anônimo: ${anonResult.success ? '✅' : '❌'} (${anonResult.status})`);
    if (anonResult.success) {
      console.log(`  Registros retornados: ${anonResult.data?.length || 0}`);
    } else {
      console.log(`  Erro: ${anonResult.data?.message || anonResult.error}`);
    }
    
    // Teste com service key
    const serviceResult = await makeRequest(
      `${supabaseUrl}/rest/v1/${table}?select=*&limit=5`,
      { useServiceKey: true }
    );
    
    console.log(`  Acesso service: ${serviceResult.success ? '✅' : '❌'} (${serviceResult.status})`);
    if (serviceResult.success) {
      console.log(`  Registros retornados: ${serviceResult.data?.length || 0}`);
    }
  }
}

// Teste 2: Verificar funções RPC públicas
async function testRPCFunctions() {
  console.log('\n\n🔧 Teste 2: Funções RPC públicas');
  
  // Testar get_specialties
  console.log('\n🔸 Testando função: get_specialties');
  const specialtiesResult = await makeRequest(
    `${supabaseUrl}/rest/v1/rpc/get_specialties`,
    {
      method: 'POST',
      body: JSON.stringify({}),
      useServiceKey: false
    }
  );
  
  console.log(`  Status: ${specialtiesResult.success ? '✅' : '❌'} (${specialtiesResult.status})`);
  if (specialtiesResult.success) {
    console.log(`  Especialidades encontradas: ${specialtiesResult.data?.length || 0}`);
    if (specialtiesResult.data?.length > 0) {
      console.log(`  Primeiras 3: ${specialtiesResult.data.slice(0, 3).join(', ')}`);
    }
  } else {
    console.log(`  Erro: ${specialtiesResult.data?.message || specialtiesResult.error}`);
  }

  // Testar get_available_states
  console.log('\n🔸 Testando função: get_available_states');
  const statesResult = await makeRequest(
    `${supabaseUrl}/rest/v1/rpc/get_available_states`,
    {
      method: 'POST',
      body: JSON.stringify({}),
      useServiceKey: false
    }
  );
  
  console.log(`  Status: ${statesResult.success ? '✅' : '❌'} (${statesResult.status})`);
  if (statesResult.success) {
    console.log(`  Estados encontrados: ${statesResult.data?.length || 0}`);
    if (statesResult.data?.length > 0) {
      const firstState = statesResult.data[0].uf;
      console.log(`  Primeiro estado: ${firstState}`);
      
      // Testar get_available_cities com o primeiro estado
      console.log('\n🔸 Testando função: get_available_cities');
      const citiesResult = await makeRequest(
        `${supabaseUrl}/rest/v1/rpc/get_available_cities`,
        {
          method: 'POST',
          body: JSON.stringify({ state_uf: firstState }),
          useServiceKey: false
        }
      );
      
      console.log(`  Status: ${citiesResult.success ? '✅' : '❌'} (${citiesResult.status})`);
      if (citiesResult.success) {
        console.log(`  Cidades em ${firstState}: ${citiesResult.data?.length || 0}`);
        
        // Testar get_doctors_by_location_and_specialty
        if (citiesResult.data?.length > 0 && specialtiesResult.data?.length > 0) {
          const firstCity = citiesResult.data[0].cidade;
          const firstSpecialty = specialtiesResult.data[0];
          
          console.log('\n🔸 Testando função: get_doctors_by_location_and_specialty');
          console.log(`  Parâmetros: ${firstSpecialty} em ${firstCity}/${firstState}`);
          
          const doctorsResult = await makeRequest(
            `${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`,
            {
              method: 'POST',
              body: JSON.stringify({
                p_specialty: firstSpecialty,
                p_city: firstCity,
                p_state: firstState
              }),
              useServiceKey: false
            }
          );
          
          console.log(`  Status: ${doctorsResult.success ? '✅' : '❌'} (${doctorsResult.status})`);
          if (doctorsResult.success) {
            console.log(`  Médicos encontrados: ${doctorsResult.data?.length || 0}`);
            if (doctorsResult.data?.length > 0) {
              console.log(`  Primeiro médico: ${doctorsResult.data[0].display_name} (ID: ${doctorsResult.data[0].id})`);
            }
          } else {
            console.log(`  Erro: ${doctorsResult.data?.message || doctorsResult.error}`);
          }
        }
      } else {
        console.log(`  Erro: ${citiesResult.data?.message || citiesResult.error}`);
      }
    }
  } else {
    console.log(`  Erro: ${statesResult.data?.message || statesResult.error}`);
  }
}

// Teste 3: Verificar políticas RLS específicas
async function testRLSPolicies() {
  console.log('\n\n🛡️ Teste 3: Políticas RLS específicas');
  
  // Teste de acesso direto aos profiles de médicos
  console.log('\n🔸 Testando acesso a profiles de médicos');
  const profilesResult = await makeRequest(
    `${supabaseUrl}/rest/v1/profiles?select=id,display_name,user_type&user_type=eq.medico&limit=3`,
    { useServiceKey: false }
  );
  
  console.log(`  Acesso a profiles: ${profilesResult.success ? '✅' : '❌'}`);
  if (profilesResult.success) {
    console.log(`  Profiles de médicos visíveis: ${profilesResult.data?.length || 0}`);
  } else {
    console.log(`  Erro: ${profilesResult.data?.message || profilesResult.error}`);
  }
  
  // Teste de join entre médicos e locais (corrigido)
  console.log('\n🔸 Testando join médicos-locais');
  const joinResult = await makeRequest(
    `${supabaseUrl}/rest/v1/medicos?select=id,especialidades,locais_atendimento(nome_local,cidade,estado)&limit=3`,
    { useServiceKey: false }
  );
  
  console.log(`  Join médicos-locais: ${joinResult.success ? '✅' : '❌'}`);
  if (joinResult.success) {
    console.log(`  Médicos com locais: ${joinResult.data?.length || 0}`);
    if (joinResult.data?.length > 0) {
      console.log(`  Exemplo: ${JSON.stringify(joinResult.data[0], null, 2)}`);
    }
  } else {
    console.log(`  Erro: ${joinResult.data?.message || joinResult.error}`);
  }

  // Teste de filtro por especialidade (sintaxe corrigida)
  console.log('\n🔸 Testando filtro por especialidade');
  const specialtyFilterResult = await makeRequest(
    `${supabaseUrl}/rest/v1/medicos?select=id,especialidades&especialidades=cs.{"Cardiologia"}&limit=3`,
    { useServiceKey: false }
  );
  
  console.log(`  Filtro por especialidade: ${specialtyFilterResult.success ? '✅' : '❌'}`);
  if (specialtyFilterResult.success) {
    console.log(`  Cardiologistas encontrados: ${specialtyFilterResult.data?.length || 0}`);
  } else {
    console.log(`  Erro: ${specialtyFilterResult.data?.message || specialtyFilterResult.error}`);
  }

  // Teste adicional: Acesso anônimo aos dados básicos
  console.log('\n🔸 Testando acesso anônimo aos dados básicos');
  const anonAccessResult = await makeRequest(
    `${supabaseUrl}/rest/v1/medicos?select=id,crm,especialidades&limit=3`,
    { useServiceKey: false }
  );
  
  console.log(`  Acesso anônimo: ${anonAccessResult.success ? '✅' : '❌'}`);
  if (anonAccessResult.success) {
    console.log(`  Médicos visíveis anonimamente: ${anonAccessResult.data?.length || 0}`);
  } else {
    console.log(`  Erro: ${anonAccessResult.data?.message || anonAccessResult.error}`);
  }
}

// Função principal
async function main() {
  try {
    await testTableAccess();
    await testRPCFunctions();
    await testRLSPolicies();
    
    console.log('\n\n✅ Debug concluído com sucesso!');
    console.log('💡 Verifique os resultados acima para identificar problemas nas políticas RLS');
    
  } catch (error) {
    console.error('\n❌ Erro durante o debug:', error.message);
    process.exit(1);
  }
}

// Executar o script
main(); // replaced by kiro @2025-01-15T20:30:00Z