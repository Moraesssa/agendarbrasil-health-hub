// Sincronização manual do pagamento que foi processado
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU0MzkyNSwiZXhwIjoyMDY2MTE5OTI1fQ.SL5dtN5mpITgn5H0mxAJj9AzQ5bB_Fben2av__A1SMU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manualSync() {
  console.log('🔧 SINCRONIZAÇÃO MANUAL DO PAGAMENTO\n');
  console.log('🎯 Objetivo: Registrar o pagamento que foi confirmado no Stripe');

  try {
    // Simular dados do pagamento que foi processado
    const consultaId = '59fb1551-872b-4f9e-925a-6314789cd418'; // Consulta com valor R$ 150
    const sessionId = 'cs_manual_sync_' + Date.now();
    const valor = 150.00;

    console.log('📋 DADOS DO PAGAMENTO:');
    console.log(`   Consulta ID: ${consultaId.slice(-8)}`);
    console.log(`   Valor: R$ ${valor}`);
    console.log(`   Session ID: ${sessionId}`);

    // 1. Buscar dados da consulta
    console.log('\n1️⃣ Buscando dados da consulta...');
    const { data: consultaData, error: consultaError } = await supabase
      .from('consultas')
      .select('*')
      .eq('id', consultaId)
      .single();

    if (consultaError || !consultaData) {
      console.error('❌ Consulta não encontrada:', consultaError);
      return;
    }

    console.log('✅ Consulta encontrada:');
    console.log(`   Status atual: ${consultaData.status}/${consultaData.status_pagamento}`);
    console.log(`   Paciente: ${consultaData.paciente_id?.slice(-8)}`);
    console.log(`   Médico: ${consultaData.medico_id?.slice(-8)}`);

    // 2. Registrar pagamento
    console.log('\n2️⃣ Registrando pagamento...');
    const { data: pagamentoData, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        consulta_id: consultaId,
        paciente_id: consultaData.paciente_id,
        medico_id: consultaData.medico_id,
        valor: valor,
        metodo_pagamento: 'credit_card',
        gateway_id: sessionId,
        status: 'succeeded',
        dados_gateway: {
          session_id: sessionId,
          amount_total: valor * 100,
          payment_status: 'paid',
          status: 'complete',
          manual_sync: true,
          synced_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (pagamentoError) {
      console.error('❌ Erro ao registrar pagamento:', pagamentoError);
      return;
    }

    console.log('✅ Pagamento registrado:');
    console.log(`   ID: ${pagamentoData.id.slice(-8)}`);
    console.log(`   Status: ${pagamentoData.status}`);

    // 3. Atualizar consulta
    console.log('\n3️⃣ Atualizando status da consulta...');
    const { data: consultaAtualizada, error: updateError } = await supabase
      .from('consultas')
      .update({
        status_pagamento: 'pago',
        status: 'agendada',
        valor: valor,
        updated_at: new Date().toISOString()
      })
      .eq('id', consultaId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar consulta:', updateError);
      return;
    }

    console.log('✅ Consulta atualizada:');
    console.log(`   Novo status: ${consultaAtualizada.status}/${consultaAtualizada.status_pagamento}`);
    console.log(`   Valor: R$ ${consultaAtualizada.valor}`);

    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    
    const { data: verificacao } = await supabase
      .from('consultas')
      .select(`
        *,
        pagamentos:pagamentos(*)
      `)
      .eq('id', consultaId)
      .single();

    console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(50));
    console.log(`✅ Consulta: ${verificacao.status}/${verificacao.status_pagamento}`);
    console.log(`✅ Pagamentos: ${verificacao.pagamentos?.length || 0} registrado(s)`);
    console.log(`✅ Valor: R$ ${verificacao.valor}`);

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Acesse: /agenda-paciente');
    console.log('2. A consulta deve aparecer como "Agendada/Pago"');
    console.log('3. Execute: node detailed-check.js para confirmar');
    console.log('4. Configure o webhook no Stripe para futuros pagamentos');

    console.log('\n📋 WEBHOOK CONFIGURATION:');
    console.log('URL: https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1/stripe-webhook');
    console.log('Event: checkout.session.completed');

  } catch (error) {
    console.error('❌ Erro na sincronização manual:', error);
  }
}

manualSync();