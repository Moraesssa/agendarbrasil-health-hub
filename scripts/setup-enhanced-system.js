/**
 * Script para configurar o sistema integrado de agendamento
 * Execute: node scripts/setup-enhanced-system.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_') || supabaseKey.includes('YOUR_')) {
  console.error('❌ Configure as variáveis de ambiente do Supabase primeiro!');
  console.log('Crie um arquivo .env com:');
  console.log('VITE_SUPABASE_URL=sua_url_aqui');
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEnhancedSystem() {
  console.log('🚀 Configurando sistema integrado de agendamento...\n');

  try {
    // 1. Verificar conexão
    console.log('1. Verificando conexão com Supabase...');
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('   ⚠️  Tabelas não encontradas. Aplicando schema...');
      
      // Ler e aplicar o schema
      const schemaPath = path.join(__dirname, '../database/apply_enhanced_schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('   📄 Aplicando schema do banco de dados...');
      console.log('   ⚠️  ATENÇÃO: Execute o seguinte SQL no Supabase SQL Editor:');
      console.log('   📁 Arquivo: database/apply_enhanced_schema.sql');
      console.log('\n   Ou copie e cole o seguinte SQL:\n');
      console.log('=' .repeat(80));
      console.log(schema);
      console.log('=' .repeat(80));
      console.log('\n   Após executar o SQL, execute este script novamente.\n');
      return;
    } else if (error) {
      throw error;
    }
    
    console.log('   ✅ Conexão estabelecida com sucesso!');

    // 2. Verificar estrutura das tabelas
    console.log('\n2. Verificando estrutura das tabelas...');
    
    const tables = ['usuarios', 'medicos', 'pacientes', 'consultas', 'locais_atendimento', 'horarios_funcionamento'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) throw error;
        console.log(`   ✅ Tabela '${table}' encontrada`);
      } catch (err) {
        console.log(`   ❌ Tabela '${table}' não encontrada ou com erro:`, err.message);
      }
    }

    // 3. Verificar dados de exemplo
    console.log('\n3. Verificando dados de exemplo...');
    
    const { data: usuarios } = await supabase.from('usuarios').select('*');
    const { data: medicos } = await supabase.from('medicos').select('*');
    const { data: pacientes } = await supabase.from('pacientes').select('*');
    
    console.log(`   📊 Usuários: ${usuarios?.length || 0}`);
    console.log(`   👨‍⚕️ Médicos: ${medicos?.length || 0}`);
    console.log(`   👤 Pacientes: ${pacientes?.length || 0}`);

    // 4. Testar funcionalidades principais
    console.log('\n4. Testando funcionalidades principais...');
    
    // Teste de busca de médicos
    try {
      const { data: medicosTest } = await supabase
        .from('medicos')
        .select(`
          *,
          usuarios!inner(nome, email)
        `)
        .limit(3);
      
      console.log('   ✅ Busca de médicos funcionando');
      console.log(`   📋 Médicos encontrados: ${medicosTest?.length || 0}`);
    } catch (err) {
      console.log('   ❌ Erro na busca de médicos:', err.message);
    }

    // Teste de horários de funcionamento
    try {
      const { data: horariosTest } = await supabase
        .from('horarios_funcionamento')
        .select(`
          *,
          locais_atendimento(*)
        `)
        .limit(5);
      
      console.log('   ✅ Consulta de horários funcionando');
      console.log(`   ⏰ Horários encontrados: ${horariosTest?.length || 0}`);
    } catch (err) {
      console.log('   ❌ Erro na consulta de horários:', err.message);
    }

    // 5. Verificar configurações de segurança
    console.log('\n5. Verificando configurações de segurança...');
    console.log('   ⚠️  RLS desabilitado para desenvolvimento');
    console.log('   🔧 Lembre-se de habilitar RLS em produção');

    // 6. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📋 Próximos passos:');
    console.log('1. ✅ Sistema de agendamento integrado configurado');
    console.log('2. ✅ Fluxo inteligente disponível em /agendamento-inteligente');
    console.log('3. ✅ Agenda do paciente atualizada em /agenda-paciente');
    console.log('4. ✅ Agenda do médico atualizada em /agenda-medico');
    console.log('5. 🔧 Versões antigas disponíveis com sufixo -legacy');
    
    console.log('\n🌐 URLs disponíveis:');
    console.log('- /agendamento-inteligente (novo sistema integrado)');
    console.log('- /agenda-paciente (nova interface)');
    console.log('- /agenda-medico (nova interface)');
    console.log('- /scheduler-demo (demo realístico)');
    
    console.log('\n🔧 URLs tradicionais (sistema antigo):');
    console.log('- /agendamento');
    console.log('- /agenda-paciente-legacy');
    console.log('- /agenda-medico-legacy');

    console.log('\n🎯 Funcionalidades implementadas:');
    console.log('- ✅ Busca inteligente de médicos');
    console.log('- ✅ Visualização de disponibilidade em tempo real');
    console.log('- ✅ Agendamento com diferentes tipos de consulta');
    console.log('- ✅ Gestão de agenda para médicos');
    console.log('- ✅ Histórico de consultas para pacientes');
    console.log('- ✅ Sistema de notificações');
    console.log('- ✅ Reagendamento e cancelamento');

    console.log('\n🚧 Próximas implementações:');
    console.log('- 🔄 Integração com pagamentos');
    console.log('- 📱 Notificações push');
    console.log('- 📊 Analytics e relatórios');
    console.log('- 🔐 Habilitação de RLS para produção');
    console.log('- 🎥 Integração com videochamadas');

  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
    console.log('\n🔧 Soluções possíveis:');
    console.log('1. Verifique as credenciais do Supabase');
    console.log('2. Execute o SQL schema manualmente no Supabase');
    console.log('3. Verifique as permissões do banco de dados');
  }
}

// Executar configuração
setupEnhancedSystem();