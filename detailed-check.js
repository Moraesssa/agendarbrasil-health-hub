// Verificação detalhada do teste
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function detailedCheck() {
  console.log('🔍 VERIFICAÇÃO DETALHADA DO TESTE\n');

  try {
    // 1. Verificar consultas com timestamps detalhados
    const { data: consultas } = await supabase
      .from('consultas')
      .select('*')
      .order('updated_at', { ascending: false });

    console.log('📅 ANÁLISE DETALHADA DAS CONSULTAS:');
    consultas?.forEach((consulta, index) => {
      const criadaEm = new Date(consulta.created_at);
      const atualizadaEm = new Date(consulta.updated_at || consulta.created_at);
      const agora = new Date();
      
      const minutosDesdeAtualizacao = Math.round((agora - atualizadaEm) / (1000 * 60));
      
      console.log(`\n  ${index + 1}. ID: ${consulta.id.slice(-8)}`);
      console.log(`     Status: ${consulta.status}/${consulta.status_pagamento}`);
      console.log(`     Valor: R$ ${consulta.valor || 'N/A'}`);
      console.log(`     Criada: ${criadaEm.toLocaleString('pt-BR')}`);
      console.log(`     Atualizada: ${atualizadaEm.toLocaleString('pt-BR')}`);
      console.log(`     Última atualização: há ${minutosDesdeAtualizacao} minutos`);
      
      // Destacar se foi atualizada recentemente
      if (minutosDesdeAtualizacao <= 10) {
        console.log(`     🔥 ATUALIZADA RECENTEMENTE!`);
      }
    });

    // 2. Verificar pagamentos
    const { data: pagamentos } = await supabase
      .from('pagamentos')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`\n💳 PAGAMENTOS ENCONTRADOS: ${pagamentos?.length || 0}`);
    
    if (pagamentos && pagamentos.length > 0) {
      pagamentos.forEach((pagamento, index) => {
        console.log(`\n  ${index + 1}. ID: ${pagamento.id.slice(-8)}`);
        console.log(`     Consulta: ${pagamento.consulta_id?.slice(-8)}`);
        console.log(`     Status: ${pagamento.status}`);
        console.log(`     Valor: R$ ${pagamento.valor}`);
        console.log(`     Gateway: ${pagamento.gateway_id}`);
        console.log(`     Criado: ${new Date(pagamento.created_at).toLocaleString('pt-BR')}`);
      });
    }

    // 3. Verificar se houve mudanças nos últimos 30 minutos
    const consultasRecentes = consultas?.filter(c => {
      const atualizadaEm = new Date(c.updated_at || c.created_at);
      const agora = new Date();
      const minutosAtras = (agora - atualizadaEm) / (1000 * 60);
      return minutosAtras <= 30;
    }) || [];

    console.log(`\n🕐 ATIVIDADE RECENTE (últimos 30 min): ${consultasRecentes.length} consultas`);

    // 4. Diagnóstico
    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('='.repeat(50));

    if (pagamentos && pagamentos.length > 0) {
      console.log('🎉 SUCESSO! Webhook funcionou!');
      console.log('   ✅ Pagamento foi registrado');
      console.log('   ✅ Sistema está operacional');
    } else if (consultasRecentes.length > 0) {
      console.log('⏳ Teste em andamento...');
      console.log('   📋 Houve atividade recente nas consultas');
      console.log('   ⏰ Aguarde mais alguns minutos');
    } else {
      console.log('❓ Possíveis cenários:');
      console.log('   1. 🔄 Teste não foi concluído completamente');
      console.log('   2. ⏰ Webhook ainda está processando (aguarde)');
      console.log('   3. 🚫 Houve erro no processamento');
      console.log('   4. 💳 Pagamento foi cancelado/falhou');
    }

    // 5. Próximos passos
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('-'.repeat(30));

    if (pagamentos && pagamentos.length > 0) {
      console.log('✅ Sistema funcionando! Teste na aplicação:');
      console.log('   /agenda-paciente?debug=true');
    } else {
      console.log('🔧 Para investigar:');
      console.log('   1. Me conte: chegou até que ponto no teste?');
      console.log('   2. Viu a tela de pagamento do Stripe?');
      console.log('   3. Inseriu dados do cartão de teste?');
      console.log('   4. Viu mensagem de "Pagamento bem-sucedido"?');
      console.log('   5. Execute novamente em 5 minutos');
    }

    // 6. Informações para debug
    console.log('\n📋 DADOS PARA REFERÊNCIA:');
    if (consultas && consultas.length > 0) {
      const consultaMaisRecente = consultas[0];
      console.log(`   Consulta mais recente: ${consultaMaisRecente.id}`);
      console.log(`   Status: ${consultaMaisRecente.status}/${consultaMaisRecente.status_pagamento}`);
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

detailedCheck();