#!/usr/bin/env node

/**
 * Teste E2E para o fluxo de agendamento
 * Simula o comportamento do usuário na página de agendamento
 * URL: https://agendarbrasil-health-hub.lovable.app/agendamento
 * // replaced by kiro @2025-01-15T20:30:00Z
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = 'https://agendarbrasil-health-hub.lovable.app';

console.log('🧪 Iniciando teste E2E do fluxo de agendamento...\n');

// Função para fazer requisições à API
async function makeApiRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const defaultHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    const response = await fetch(url, {
      headers: { ...defaultHeaders, ...options.headers },
      ...options
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: response.ok ? null : data.message || 'Erro desconhecido'
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Função para testar RPC
async function makeRpcRequest(functionName, params = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: response.ok ? null : data.message || 'Erro desconhecido'
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Teste 1: Verificar se as especialidades estão disponíveis
async function testeEspecialidades() {
  console.log('📋 Teste 1: Carregamento de especialidades');
  
  const result = await makeRpcRequest('get_specialties');
  
  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    console.log(`  ✅ Especialidades carregadas: ${result.data.length}`);
    console.log(`  📝 Primeiras 5: ${result.data.slice(0, 5).join(', ')}`);
    return { success: true, especialidades: result.data };
  } else {
    console.log(`  ❌ Falha ao carregar especialidades: ${result.error}`);
    return { success: false, error: result.error };
  }
}

// Teste 2: Verificar estados disponíveis
async function testeEstados() {
  console.log('\n🗺️ Teste 2: Carregamento de estados');
  
  const result = await makeRpcRequest('get_available_states');
  
  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    console.log(`  ✅ Estados disponíveis: ${result.data.length}`);
    console.log(`  📍 Estados: ${result.data.map(e => e.uf || e.nome).join(', ')}`);
    return { success: true, estados: result.data };
  } else {
    console.log(`  ❌ Falha ao carregar estados: ${result.error}`);
    return { success: false, error: result.error };
  }
}

// Teste 3: Verificar cidades por estado
async function testeCidades(estado = 'DF') {
  console.log(`\n🏙️ Teste 3: Carregamento de cidades para ${estado}`);
  
  const result = await makeRpcRequest('get_available_cities', { state_uf: estado });
  
  if (result.success && Array.isArray(result.data)) {
    console.log(`  ✅ Cidades em ${estado}: ${result.data.length}`);
    if (result.data.length > 0) {
      console.log(`  🏘️ Cidades: ${result.data.map(c => c.cidade).join(', ')}`);
    }
    return { success: true, cidades: result.data };
  } else {
    console.log(`  ❌ Falha ao carregar cidades: ${result.error}`);
    return { success: false, error: result.error };
  }
}

// Teste 4: Buscar médicos por especialidade e localização
async function testeMedicos(especialidade = 'Cardiologia', cidade = 'Brasília', estado = 'DF') {
  console.log(`\n👨‍⚕️ Teste 4: Busca de médicos`);
  console.log(`  🔍 Buscando: ${especialidade} em ${cidade}/${estado}`);
  
  const result = await makeRpcRequest('get_doctors_by_location_and_specialty', {
    p_specialty: especialidade,
    p_city: cidade,
    p_state: estado
  });
  
  if (result.success && Array.isArray(result.data)) {
    console.log(`  ✅ Médicos encontrados: ${result.data.length}`);
    
    if (result.data.length > 0) {
      const medico = result.data[0];
      console.log(`  👨‍⚕️ Exemplo: Dr. ${medico.display_name || 'Nome não disponível'}`);
      console.log(`  📋 CRM: ${medico.crm || 'Não informado'}`);
      console.log(`  🏥 Local: ${medico.local_nome || 'Não informado'}`);
    } else {
      console.log('  ⚠️ Nenhum médico encontrado para os critérios especificados');
    }
    
    return { success: true, medicos: result.data };
  } else {
    console.log(`  ❌ Falha ao buscar médicos: ${result.error}`);
    return { success: false, error: result.error };
  }
}

// Teste 5: Verificar dados básicos de médicos (acesso público)
async function testeDadosPublicos() {
  console.log('\n🔓 Teste 5: Acesso público aos dados de médicos');
  
  const result = await makeApiRequest('medicos?select=id,crm,especialidades&limit=5');
  
  if (result.success) {
    console.log(`  ✅ Dados públicos acessíveis: ${result.data?.length || 0} médicos`);
    
    if (result.data && result.data.length > 0) {
      console.log('  📊 Exemplo de dados públicos:');
      const medico = result.data[0];
      console.log(`    - ID: ${medico.id}`);
      console.log(`    - CRM: ${medico.crm || 'Não informado'}`);
      console.log(`    - Especialidades: ${medico.especialidades?.join(', ') || 'Não informado'}`);
    }
    
    return { success: true, dados: result.data };
  } else {
    console.log(`  ❌ Falha no acesso público: ${result.error}`);
    return { success: false, error: result.error };
  }
}

// Teste 6: Simular fluxo completo de agendamento
async function testeFluxoCompleto() {
  console.log('\n🔄 Teste 6: Simulação do fluxo completo de agendamento');
  
  const resultados = {
    especialidades: false,
    estados: false,
    cidades: false,
    medicos: false,
    dadosPublicos: false
  };
  
  // Passo 1: Carregar especialidades
  console.log('  📋 Passo 1: Selecionando especialidade...');
  const especialidadesResult = await testeEspecialidades();
  resultados.especialidades = especialidadesResult.success;
  
  if (!especialidadesResult.success) {
    console.log('  ❌ Fluxo interrompido: Não foi possível carregar especialidades');
    return resultados;
  }
  
  const especialidadeSelecionada = especialidadesResult.especialidades[0];
  console.log(`  ✅ Especialidade selecionada: ${especialidadeSelecionada}`);
  
  // Passo 2: Carregar estados
  console.log('\n  🗺️ Passo 2: Selecionando estado...');
  const estadosResult = await testeEstados();
  resultados.estados = estadosResult.success;
  
  if (!estadosResult.success) {
    console.log('  ❌ Fluxo interrompido: Não foi possível carregar estados');
    return resultados;
  }
  
  const estadoSelecionado = estadosResult.estados[0];
  console.log(`  ✅ Estado selecionado: ${estadoSelecionado.uf || estadoSelecionado.nome}`);
  
  // Passo 3: Carregar cidades
  console.log('\n  🏙️ Passo 3: Selecionando cidade...');
  const cidadesResult = await testeCidades(estadoSelecionado.uf || estadoSelecionado.nome);
  resultados.cidades = cidadesResult.success;
  
  if (!cidadesResult.success || cidadesResult.cidades.length === 0) {
    console.log('  ❌ Fluxo interrompido: Não há cidades disponíveis');
    return resultados;
  }
  
  const cidadeSelecionada = cidadesResult.cidades[0];
  console.log(`  ✅ Cidade selecionada: ${cidadeSelecionada.cidade}`);
  
  // Passo 4: Buscar médicos
  console.log('\n  👨‍⚕️ Passo 4: Buscando médicos disponíveis...');
  const medicosResult = await testeMedicos(
    especialidadeSelecionada,
    cidadeSelecionada.cidade,
    cidadeSelecionada.estado
  );
  resultados.medicos = medicosResult.success;
  
  // Passo 5: Verificar dados públicos
  console.log('\n  🔓 Passo 5: Verificando acesso aos dados...');
  const dadosResult = await testeDadosPublicos();
  resultados.dadosPublicos = dadosResult.success;
  
  return resultados;
}

// Teste 7: Verificar performance das consultas
async function testePerformance() {
  console.log('\n⚡ Teste 7: Performance das consultas');
  
  const testes = [
    { nome: 'Especialidades', func: () => makeRpcRequest('get_specialties') },
    { nome: 'Estados', func: () => makeRpcRequest('get_available_states') },
    { nome: 'Cidades DF', func: () => makeRpcRequest('get_available_cities', { state_uf: 'DF' }) },
    { nome: 'Médicos públicos', func: () => makeApiRequest('medicos?select=id,crm&limit=10') }
  ];
  
  for (const teste of testes) {
    const inicio = Date.now();
    const resultado = await teste.func();
    const tempo = Date.now() - inicio;
    
    const status = resultado.success ? '✅' : '❌';
    console.log(`  ${status} ${teste.nome}: ${tempo}ms`);
  }
}

// Função principal
async function main() {
  try {
    // Verificar configuração
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.log('❌ Erro: Variáveis de ambiente não configuradas');
      console.log('   Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
      process.exit(1);
    }
    
    console.log(`🔗 Testando aplicação: ${APP_URL}/agendamento`);
    console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
    console.log('━'.repeat(60));
    
    // Executar testes individuais
    await testeEspecialidades();
    await testeEstados();
    await testeCidades();
    await testeMedicos();
    await testeDadosPublicos();
    
    console.log('\n' + '━'.repeat(60));
    
    // Executar fluxo completo
    const resultadosFluxo = await testeFluxoCompleto();
    
    console.log('\n' + '━'.repeat(60));
    
    // Teste de performance
    await testePerformance();
    
    console.log('\n' + '━'.repeat(60));
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`  Especialidades: ${resultadosFluxo.especialidades ? '✅' : '❌'}`);
    console.log(`  Estados: ${resultadosFluxo.estados ? '✅' : '❌'}`);
    console.log(`  Cidades: ${resultadosFluxo.cidades ? '✅' : '❌'}`);
    console.log(`  Médicos: ${resultadosFluxo.medicos ? '✅' : '❌'}`);
    console.log(`  Dados Públicos: ${resultadosFluxo.dadosPublicos ? '✅' : '❌'}`);
    
    const todosPassaram = Object.values(resultadosFluxo).every(r => r === true);
    
    if (todosPassaram) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('   O fluxo de agendamento está funcionando corretamente.');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM');
      console.log('   Verifique os erros acima e as políticas RLS no Supabase.');
    }
    
    console.log('\n💡 Para testar manualmente, acesse:');
    console.log(`   ${APP_URL}/agendamento`);
    
  } catch (error) {
    console.error('❌ Erro durante a execução dos testes:', error.message);
    process.exit(1);
  }
}

// Executar o script
main();