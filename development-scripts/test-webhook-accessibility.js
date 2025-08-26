// Script para testar se o webhook está acessível
// Usando fetch nativo do Node.js 18+

const webhookUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1/stripe-webhook';

async function testWebhookAccessibility() {
  console.log('🧪 TESTANDO ACESSIBILIDADE DO WEBHOOK\n');
  console.log(`🔗 URL: ${webhookUrl}`);

  try {
    // 1. Teste OPTIONS (CORS preflight)
    console.log('\n1️⃣ Testando OPTIONS (CORS)...');
    const optionsResponse = await fetch(webhookUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://dashboard.stripe.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'stripe-signature,content-type'
      }
    });
    
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`, Object.fromEntries(
      [...optionsResponse.headers.entries()]
        .filter(([key]) => key.toLowerCase().includes('access-control'))
    ));

    // 2. Teste POST sem dados (deve dar erro mas mostrar que está acessível)
    console.log('\n2️⃣ Testando POST sem dados...');
    const postResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({})
    });
    
    console.log(`   Status: ${postResponse.status}`);
    const responseText = await postResponse.text();
    console.log(`   Response: ${responseText.substring(0, 200)}...`);

    // 3. Verificar se a função existe
    console.log('\n3️⃣ Verificando se a função existe...');
    if (postResponse.status === 404) {
      console.log('   ❌ Função não encontrada - não foi deployada');
    } else if (postResponse.status >= 400 && postResponse.status < 500) {
      console.log('   ✅ Função existe e está acessível (erro esperado sem dados válidos)');
    } else {
      console.log('   ⚠️  Status inesperado');
    }

    // 4. Teste de conectividade geral
    console.log('\n4️⃣ Testando conectividade geral do Supabase...');
    const supabaseResponse = await fetch('https://ulebotjrsgheybhpdnxd.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWJvdGpyc2doZXliaHBkbnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDM5MjUsImV4cCI6MjA2NjExOTkyNX0.1OVxsso5wSjnvOClf-i3DfsUUOKkpwkjioEndKB2ux4'
      }
    });
    
    console.log(`   Supabase REST API Status: ${supabaseResponse.status}`);

    // 5. Resumo
    console.log('\n📊 RESUMO:');
    console.log('='.repeat(50));
    
    if (postResponse.status === 404) {
      console.log('❌ PROBLEMA: Função stripe-webhook não foi deployada');
      console.log('   Solução: Deploy da função no Supabase');
    } else if (postResponse.status >= 400 && postResponse.status < 500) {
      console.log('✅ Webhook está acessível e funcionando');
      console.log('   Problema pode ser:');
      console.log('   1. Webhook não configurado no Stripe Dashboard');
      console.log('   2. Eventos não selecionados');
      console.log('   3. STRIPE_SECRET_KEY não configurada');
    } else {
      console.log('⚠️  Status inesperado - investigar logs');
    }

    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se função foi deployada: supabase functions list');
    console.log('2. Configurar webhook no Stripe Dashboard');
    console.log('3. Verificar variáveis de ambiente');
    console.log('4. Testar com evento real do Stripe');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.log('\n🔧 Possíveis causas:');
    console.log('1. Problema de conectividade');
    console.log('2. Função não deployada');
    console.log('3. URL incorreta');
  }
}

// Executar teste
testWebhookAccessibility();