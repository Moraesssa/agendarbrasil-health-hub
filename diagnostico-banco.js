#!/usr/bin/env node

/**
 * Diagnóstico completo do banco de dados
 * Conecta no Supabase e verifica exatamente o que está acontecendo
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

const envVars = loadEnvVars();
const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

console.log('🔍 DIAGNÓSTICO COMPLETO DO BANCO DE DADOS\n');

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
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

async function diagnosticar() {
  console.log('📊 1. CONTANDO REGISTROS NAS TABELAS PRINCIPAIS');
  
  // Contar médicos
  const medicosCount = await makeRequest(`${supabaseUrl}/rest/v1/medicos?select=count`);
  console.log(`   Médicos: ${medicosCount.success ? medicosCount.data[0]?.count || 0 : 'ERRO'}`);
  
  // Contar locais
  const locaisCount = await makeRequest(`${supabaseUrl}/rest/v1/locais_atendimento?select=count`);
  console.log(`   Locais: ${locaisCount.success ? locaisCount.data[0]?.count || 0 : 'ERRO'}`);
  
  // Contar profiles
  const profilesCount = await makeRequest(`${supabaseUrl}/rest/v1/profiles?select=count`);
  console.log(`   Profiles: ${profilesCount.success ? profilesCount.data[0]?.count || 0 : 'ERRO'}`);

  console.log('\n📋 2. VERIFICANDO DADOS DOS MÉDICOS');
  const medicos = await makeRequest(`${supabaseUrl}/rest/v1/medicos?select=*&limit=5`);
  if (medicos.success && medicos.data.length > 0) {
    console.log(`   ✅ Encontrados ${medicos.data.length} médicos:`);
    medicos.data.forEach((m, i) => {
      console.log(`   ${i+1}. ID: ${m.user_id}`);
      console.log(`      CRM: ${m.crm || 'SEM CRM'}`);
      console.log(`      Especialidades: ${m.especialidades ? m.especialidades.join(', ') : 'SEM ESPECIALIDADES'}`);
    });
  } else {
    console.log('   ❌ NENHUM MÉDICO ENCONTRADO!');
  }

  console.log('\n🏥 3. VERIFICANDO LOCAIS DE ATENDIMENTO');
  const locais = await makeRequest(`${supabaseUrl}/rest/v1/locais_atendimento?select=*&limit=5`);
  if (locais.success && locais.data.length > 0) {
    console.log(`   ✅ Encontrados ${locais.data.length} locais:`);
    locais.data.forEach((l, i) => {
      console.log(`   ${i+1}. Médico ID: ${l.medico_id}`);
      console.log(`      Local: ${l.nome_local || 'SEM NOME'}`);
      console.log(`      Cidade: ${l.cidade || 'SEM CIDADE'} / ${l.estado || 'SEM ESTADO'}`);
    });
  } else {
    console.log('   ❌ NENHUM LOCAL ENCONTRADO!');
  }

  console.log('\n👤 4. VERIFICANDO PROFILES DE MÉDICOS');
  const profilesMedicos = await makeRequest(`${supabaseUrl}/rest/v1/profiles?select=*&user_type=eq.medico&limit=5`);
  if (profilesMedicos.success && profilesMedicos.data.length > 0) {
    console.log(`   ✅ Encontrados ${profilesMedicos.data.length} profiles de médicos:`);
    profilesMedicos.data.forEach((p, i) => {
      console.log(`   ${i+1}. ID: ${p.id}`);
      console.log(`      Nome: ${p.display_name || 'SEM NOME'}`);
    });
  } else {
    console.log('   ❌ NENHUM PROFILE DE MÉDICO ENCONTRADO!');
  }

  console.log('\n🔧 5. TESTANDO FUNÇÃO get_doctors_by_location_and_specialty');
  const funcaoResult = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
    method: 'POST',
    body: JSON.stringify({
      p_specialty: 'Cardiologia',
      p_city: 'Brasília',
      p_state: 'DF'
    })
  });
  
  if (funcaoResult.success) {
    console.log(`   ✅ Função executou com sucesso`);
    console.log(`   📊 Médicos retornados: ${funcaoResult.data?.length || 0}`);
    if (funcaoResult.data?.length > 0) {
      funcaoResult.data.forEach((m, i) => {
        console.log(`   ${i+1}. ${m.display_name} (ID: ${m.id})`);
        console.log(`      CRM: ${m.crm}`);
        console.log(`      Local: ${m.local_nome || 'SEM LOCAL'}`);
      });
    }
  } else {
    console.log(`   ❌ ERRO na função: ${funcaoResult.data?.message || funcaoResult.error}`);
  }

  console.log('\n🛡️ 6. VERIFICANDO POLÍTICAS RLS');
  
  // Teste com chave anônima
  const anonTest = await makeRequest(`${supabaseUrl}/rest/v1/medicos?select=id,crm&limit=1`, {
    headers: {
      'apikey': envVars['VITE_SUPABASE_ANON_KEY'],
      'Authorization': `Bearer ${envVars['VITE_SUPABASE_ANON_KEY']}`
    }
  });
  
  console.log(`   Acesso anônimo aos médicos: ${anonTest.success ? '✅ PERMITIDO' : '❌ BLOQUEADO'}`);
  if (anonTest.success) {
    console.log(`   Registros visíveis anonimamente: ${anonTest.data?.length || 0}`);
  }

  console.log('\n📝 7. RESUMO DO DIAGNÓSTICO');
  console.log('   ================================');
  
  const problemas = [];
  
  if (!medicos.success || medicos.data.length === 0) {
    problemas.push('❌ Não há médicos cadastrados');
  }
  
  if (!locais.success || locais.data.length === 0) {
    problemas.push('❌ Não há locais de atendimento');
  }
  
  if (!profilesMedicos.success || profilesMedicos.data.length === 0) {
    problemas.push('❌ Não há profiles de médicos');
  }
  
  if (!funcaoResult.success || funcaoResult.data.length === 0) {
    problemas.push('❌ Função de busca não retorna médicos');
  }
  
  if (!anonTest.success || anonTest.data.length === 0) {
    problemas.push('❌ Políticas RLS muito restritivas');
  }
  
  if (problemas.length === 0) {
    console.log('   ✅ TUDO OK! Sistema funcionando normalmente');
  } else {
    console.log('   🚨 PROBLEMAS ENCONTRADOS:');
    problemas.forEach(p => console.log(`   ${p}`));
  }
}

diagnosticar().catch(console.error);