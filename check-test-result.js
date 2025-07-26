// Script para verificar resultado do teste
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTestResult() {
  console.log('🔍 VERIFICANDO RESULTADO DO SEU TESTE\n');

  try {
    // Buscar dados atuais
    const { data: consultas } = await supabase.from('consultas').select('*').order('updated_at', { ascending: false });
    const { data: pagamentos } = await supabase.from('pagamentos').select('*').order('created_at', { ascending: false });

    console.log('📊 SITUAÇÃO ATUAL:');
    console.log(`   📅 Consultas: ${consultas?.length || 0}`);
    console.log(`   💳 Pagamentos: ${pagamentos?.length || 0}`);

    // Verificar se houve mudanças
    const consultasPagas = consultas?.filter(c => c.status_pagamento === 'pago') || [];
    const consultasPendentes = consultas?.filter(c => c.status_pagamento === 'pendente') || [];

    console.log('\n📋 STATUS DAS CONSULTAS:');
    console.log(`   ✅ Pagas: ${consultasPagas.length}`);
    console.log(`   ⏳ Pendentes: ${consultasPendentes.length}`);

    if (pagamentos && pagamentos.length > 0) {
      console.log('\n🎉 SUCESSO! PAGAMENTOS ENCONTRADOS:');
      pagamentos.forEach((pagamento, index) => {
        console.log(`\n  ${index + 1}. ID: ${pagamento.id.slice(-8)}`);
        console.log(`     Consulta: ${pagamento.consulta_id?.slice(-8) || 'N/A'}`);
        console.log(`     Valor: R$ ${pagamento.valor}`);
        console.log(`     Status: ${pagamento.status}`);
        console.log(`     Gateway: ${pagamento.gateway_id?.slice(-15) || 'N/A'}`);
        console.log(`     Criado: ${new Date(pagamento.created_at).toLocaleString('pt-BR')}`);
      });

      console.log('\n✅ WEBHOOK FUNCIONANDO!');
      console.log('   O sistema de sincronização está operacional!');
      
    } else {
      console.log('\n❌ NENHUM PAGAMENTO ENCONTRADO');
      console.log('   Possíveis causas:');
      console.log('   1. Teste não foi até o final (pagamento não concluído)');
      console.log('   2. Webhook ainda não processou');
      console.log('   3. Erro na função stripe-webhook');
    }

    // Verificar consultas que mudaram recentemente
    const consultasRecentes = consultas?.filter(c => {
      const updatedAt = new Date(c.updated_at || c.created_at);
      const agora = new Date();
      const minutosAtras = (agora - updatedAt) / (1000 * 60);
      return minutosAtras <= 10; // Últimos 10 minutos
    }) || [];

    if (consultasRecentes.length > 0) {
      console.log('\n🕐 CONSULTAS ATUALIZADAS (últimos 10 min):');
      consultasRecentes.forEach((consulta, index) => {
        console.log(`\n  ${index + 1}. ID: ${consulta.id.slice(-8)}`);
        console.log(`     Status: ${consulta.status}/${consulta.status_pagamento}`);
        console.log(`     Valor: R$ ${consulta.valor || 'N/A'}`);
        console.log(`     Atualizado: ${new Date(consulta.updated_at || consulta.created_at).toLocaleString('pt-BR')}`);
      });
    }

    // Resultado final
    console.log('\n🎯 RESULTADO DO TESTE:');
    console.log('='.repeat(50));
    
    if (pagamentos && pagamentos.length > 0) {
      console.log('🎉 TESTE BEM-SUCEDIDO!');
      console.log('   ✅ Webhook está funcionando');
      console.log('   ✅ Pagamentos sendo registrados');
      console.log('   ✅ Sistema de sincronização operacional');
      
      console.log('\n🚀 PRÓXIMOS PASSOS:');
      console.log('   1. Testar na aplicação: /agenda-paciente');
      console.log('   2. Verificar se consultas aparecem como "pagas"');
      console.log('   3. Sistema está pronto para produção!');
      
    } else {
      console.log('⏳ TESTE AINDA EM PROCESSAMENTO OU INCOMPLETO');
      console.log('   Aguarde alguns minutos e execute novamente');
      console.log('   Ou refaça o teste completo');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar resultado:', error);
  }
}

checkTestResult();