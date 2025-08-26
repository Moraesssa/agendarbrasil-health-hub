#!/usr/bin/env node

/**
 * Debug específico da função get_doctors_by_location_and_specialty
 * Testa exatamente o que a aplicação está fazendo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env
function loadEnvVars() {
  const envPath = path.join(__dirname, '.env');
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
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

console.log('🔍 DEBUG DA FUNÇÃO DE BUSCA DE MÉDICOS\n');

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
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

async function testarBuscas() {
  console.log('📊 1. TESTANDO COMBINAÇÕES REAIS DE BUSCA');
  
  // Combinações que devem funcionar baseado nos dados
  const testes = [
    { especialidade: 'Cardiologia', cidade: 'Belo Horizonte', estado: 'MG' },
    { especialidade: 'Cardiologia', cidade: 'São Paulo', estado: 'SP' },
    { especialidade: 'Cardiologia', cidade: 'Manaus', estado: 'AM' },
    { especialidade: 'Cardiologia', cidade: 'Florianópolis', estado: 'SC' },
    { especialidade: 'Pediatria', cidade: 'Belo Horizonte', estado: 'MG' },
    { especialidade: 'Anestesiologia', cidade: 'Florianópolis', estado: 'SC' },
    { especialidade: 'Cardiologia', cidade: 'Brasília', estado: 'DF' }, // Este deveria funcionar
  ];
  
  for (const teste of testes) {
    console.log(`\n🔸 Testando: ${teste.especialidade} em ${teste.cidade}/${teste.estado}`);
    
    const result = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
      method: 'POST',
      body: JSON.stringify({
        p_specialty: teste.especialidade,
        p_city: teste.cidade,
        p_state: teste.estado
      })
    });
    
    if (result.success) {
      console.log(`   ✅ Sucesso: ${result.data?.length || 0} médicos encontrados`);
      if (result.data?.length > 0) {
        result.data.forEach((m, i) => {
          console.log(`   ${i+1}. ${m.display_name} - CRM: ${m.crm}`);
          console.log(`      Local: ${m.local_nome || 'SEM LOCAL'} em ${m.local_cidade || 'SEM CIDADE'}`);
        });
      }
    } else {
      console.log(`   ❌ Erro: ${result.data?.message || result.error}`);
    }
  }

  console.log('\n📋 2. VERIFICANDO DADOS BRUTOS DAS TABELAS');
  
  // Verificar médicos com suas especialidades
  console.log('\n🔸 Médicos e especialidades:');
  const medicos = await makeRequest(`${supabaseUrl}/rest/v1/medicos?select=user_id,crm,especialidades`);
  if (medicos.success) {
    medicos.data.forEach((m, i) => {
      console.log(`   ${i+1}. CRM: ${m.crm} - Especialidades: ${m.especialidades?.join(', ') || 'NENHUMA'}`);
    });
  }
  
  // Verificar locais com cidades
  console.log('\n🔸 Locais e cidades:');
  const locais = await makeRequest(`${supabaseUrl}/rest/v1/locais_atendimento?select=medico_id,nome_local,cidade,estado`);
  if (locais.success) {
    locais.data.forEach((l, i) => {
      console.log(`   ${i+1}. ${l.nome_local || 'SEM NOME'} em ${l.cidade || 'SEM CIDADE'}/${l.estado || 'SEM ESTADO'}`);
    });
  }

  console.log('\n🔧 3. TESTANDO A FUNÇÃO MANUALMENTE (SIMULANDO O QUE A APP FAZ)');
  
  // Testar exatamente como a aplicação faz
  console.log('\n🔸 Simulando seleção: Cardiologia > MG > Belo Horizonte');
  
  // Passo 1: Buscar especialidades
  const especialidades = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_specialties`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  console.log(`   Especialidades disponíveis: ${especialidades.data?.length || 0}`);
  
  // Passo 2: Buscar estados
  const estados = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_available_states`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  console.log(`   Estados disponíveis: ${estados.data?.length || 0}`);
  
  // Passo 3: Buscar cidades para MG
  const cidades = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_available_cities`, {
    method: 'POST',
    body: JSON.stringify({ state_uf: 'MG' })
  });
  console.log(`   Cidades em MG: ${cidades.data?.length || 0}`);
  if (cidades.success && cidades.data?.length > 0) {
    console.log(`   Cidades: ${cidades.data.map(c => c.cidade).join(', ')}`);
  }
  
  // Passo 4: Buscar médicos
  const medicosResult = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
    method: 'POST',
    body: JSON.stringify({
      p_specialty: 'Cardiologia',
      p_city: 'Belo Horizonte',
      p_state: 'MG'
    })
  });
  console.log(`   Médicos encontrados: ${medicosResult.data?.length || 0}`);
  
  if (medicosResult.success && medicosResult.data?.length > 0) {
    console.log('   🎉 FUNCIONOU! Médicos encontrados:');
    medicosResult.data.forEach((m, i) => {
      console.log(`   ${i+1}. ${m.display_name} - CRM: ${m.crm}`);
    });
  } else {
    console.log('   ❌ PROBLEMA: Nenhum médico retornado');
    console.log(`   Erro: ${medicosResult.data?.message || medicosResult.error}`);
  }
}

testarBuscas().catch(console.error);