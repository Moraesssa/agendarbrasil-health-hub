// Script para testar se as variáveis de ambiente estão configuradas
const supabaseUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co';

async function testEnvironmentVariables() {
  console.log('🧪 TESTANDO VARIÁVEIS DE AMBIENTE\n');

  try {
    // Criar um payload simples para testar se a função consegue ler as variáveis
    const testPayload = {
      test: true,
      check_env: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature-for-env-check'
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response: ${responseText}`);

    // Analisar a resposta para entender o problema
    if (responseText.includes('STRIPE_SECRET_KEY não configurada')) {
      console.log('\n❌ PROBLEMA: STRIPE_SECRET_KEY não está configurada');
      console.log('   Solução: Adicionar no Supabase Dashboard');
    } else if (responseText.includes('Stripe não configurado')) {
      console.log('\n❌ PROBLEMA: Variáveis de ambiente não estão sendo lidas');
      console.log('   Solução: Verificar configuração no Supabase');
    } else if (responseText.includes('Signature inválida')) {
      console.log('\n⚠️  VARIÁVEIS CONFIGURADAS, mas signature ainda inválida');
      console.log('   Isso é esperado com dados de teste');
    } else {
      console.log('\n🔍 Resposta inesperada - analisar logs');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testEnvironmentVariables();