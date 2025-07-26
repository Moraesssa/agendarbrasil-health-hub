// Teste simples para verificar se as variáveis estão configuradas
const webhookUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1/stripe-webhook';

async function testEnvironmentCheck() {
  console.log('🔧 TESTANDO CONFIGURAÇÃO DE VARIÁVEIS\n');

  try {
    // Fazer uma requisição simples para ver a resposta de erro
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test'
      },
      body: JSON.stringify({ test: true })
    });

    const responseText = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response: ${responseText}`);

    // Analisar a resposta
    if (responseText.includes('STRIPE_SECRET_KEY não configurada')) {
      console.log('\n❌ PROBLEMA: STRIPE_SECRET_KEY não está configurada no Supabase');
      console.log('   Solução: Adicionar no Dashboard do Supabase');
    } else if (responseText.includes('STRIPE_WEBHOOK_SECRET não configurada')) {
      console.log('\n❌ PROBLEMA: STRIPE_WEBHOOK_SECRET não está configurada no Supabase');
      console.log('   Solução: Adicionar no Dashboard do Supabase');
    } else if (responseText.includes('Configuração inválida')) {
      console.log('\n❌ PROBLEMA: Uma das variáveis não está configurada');
      console.log('   Verificar ambas as variáveis no Supabase');
    } else if (responseText.includes('Signature inválida')) {
      console.log('\n✅ VARIÁVEIS CONFIGURADAS CORRETAMENTE!');
      console.log('   O erro de signature é esperado com dados de teste');
      console.log('   O webhook está funcionando e pronto para receber eventos reais');
    } else {
      console.log('\n🔍 Resposta inesperada - analisar:');
      console.log(responseText);
    }

    console.log('\n📋 PRÓXIMOS PASSOS:');
    if (responseText.includes('Signature inválida')) {
      console.log('✅ Sistema configurado corretamente!');
      console.log('1. Faça um teste real de pagamento na aplicação');
      console.log('2. Ou use a Stripe CLI para enviar eventos reais');
      console.log('3. Execute: node check-test-result.js após o teste');
    } else {
      console.log('🔧 Configurar variáveis no Supabase Dashboard:');
      console.log('   Settings → Edge Functions → Environment Variables');
      console.log('   STRIPE_SECRET_KEY = sk_test_[sua_chave]');
      console.log('   STRIPE_WEBHOOK_SECRET = whsec_rk7shhs0l9gNzegM4p40lc5yHe333bao');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testEnvironmentCheck();