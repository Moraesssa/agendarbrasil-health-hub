#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function testarCidadesMG() {
  console.log('🔍 TESTANDO CIDADES EM MINAS GERAIS\n');
  
  // Testar função get_available_cities para MG
  console.log('📋 Cidades retornadas pela função get_available_cities para MG:');
  const cidades = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_available_cities`, {
    method: 'POST',
    body: JSON.stringify({ state_uf: 'MG' })
  });
  
  if (cidades.success) {
    console.log(`   Total de cidades: ${cidades.data?.length || 0}`);
    cidades.data?.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.cidade} (${c.total_medicos} médicos)`);
    });
  } else {
    console.log(`   ❌ Erro: ${cidades.error}`);
  }
  
  // Testar busca de médicos em cada cidade
  if (cidades.success && cidades.data?.length > 0) {
    console.log('\n🔍 Testando busca de médicos em cada cidade:');
    
    for (const cidade of cidades.data) {
      console.log(`\n🔸 Testando ${cidade.cidade}/MG:`);
      
      // Testar Cardiologia
      const cardio = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
        method: 'POST',
        body: JSON.stringify({
          p_specialty: 'Cardiologia',
          p_city: cidade.cidade,
          p_state: 'MG'
        })
      });
      
      console.log(`   Cardiologia: ${cardio.data?.length || 0} médicos`);
      
      // Testar Pediatria
      const pediatria = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
        method: 'POST',
        body: JSON.stringify({
          p_specialty: 'Pediatria',
          p_city: cidade.cidade,
          p_state: 'MG'
        })
      });
      
      console.log(`   Pediatria: ${pediatria.data?.length || 0} médicos`);
      
      // Testar Clínica Geral
      const clinica = await makeRequest(`${supabaseUrl}/rest/v1/rpc/get_doctors_by_location_and_specialty`, {
        method: 'POST',
        body: JSON.stringify({
          p_specialty: 'Clínica Geral',
          p_city: cidade.cidade,
          p_state: 'MG'
        })
      });
      
      console.log(`   Clínica Geral: ${clinica.data?.length || 0} médicos`);
      
      // Mostrar total de médicos na cidade
      const totalMedicos = (cardio.data?.length || 0) + (pediatria.data?.length || 0) + (clinica.data?.length || 0);
      console.log(`   📊 Total verificado: ${totalMedicos} médicos`);
      
      if (totalMedicos === 0) {
        console.log(`   ⚠️  Nenhum médico encontrado em ${cidade.cidade}/MG`);
      }
    }
  }
  
  console.log('\n✅ Teste de cidades em MG concluído!');
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${__filename}`) {
  testarCidadesMG().catch(console.error);
}   body: JSON.stringify({
          p_specialty: 'Pediatria',
          p_city: cidade.cidade,
          p_state: 'MG'
        })
      });
      
      console.log(`   Pediatria: ${pediatria.data?.length || 0} médicos`);
      
      if (cardio.data?.length > 0) {
        cardio.data.forEach(m => {
          console.log(`     - ${m.display_name} (${m.crm})`);
        });
      }
      
      if (pediatria.data?.length > 0) {
        pediatria.data.forEach(m => {
          console.log(`     - ${m.display_name} (${m.crm})`);
        });
      }
    }
  }
}

testarCidadesMG().catch(console.error);