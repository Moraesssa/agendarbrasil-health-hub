// Script para testar webhook com signing secret real
import crypto from 'crypto';

const webhookUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1/stripe-webhook';
const webhookSecret = 'whsec_rk7shhs0l9gNzegM4p40lc5yHe333bao';

// Simular evento do Stripe
const mockStripeEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_webhook_simulation',
      object: 'checkout.session',
      amount_total: 15000, // R$ 150.00 em centavos
      currency: 'brl',
      customer: 'cus_test_customer',
      customer_email: 'teste@exemplo.com',
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        consulta_id: '59fb1551-872b-4f9e-925a-6314789cd418', // Uma das consultas reais
        paciente_id: 'ff31d767-ad28-4b20-9caf-38350e719396',
        medico_id: 'a6dc47bd-6068-4314-91a7-b210b89de3ca'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_webhook',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

function createStripeSignature(payload, secret, timestamp) {
  // Remover prefixo whsec_ se presente
  const cleanSecret = secret.replace('whsec_', '');
  
  // Criar string para assinar
  const signedPayload = `${timestamp}.${payload}`;
  
  // Criar HMAC
  const signature = crypto
    .createHmac('sha256', cleanSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhookWithRealData() {
  console.log('🧪 TESTANDO WEBHOOK COM DADOS REAIS DO STRIPE\n');
  console.log('🔗 URL:', webhookUrl);
  console.log('🔐 Secret:', webhookSecret.substring(0, 15) + '...');

  try {
    // 1. Preparar payload
    const payload = JSON.stringify(mockStripeEvent);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createStripeSignature(payload, webhookSecret, timestamp);

    console.log('\n📋 DADOS DO TESTE:');
    console.log(`   Evento: ${mockStripeEvent.type}`);
    console.log(`   Session ID: ${mockStripeEvent.data.object.id}`);
    console.log(`   Consulta ID: ${mockStripeEvent.data.object.metadata.consulta_id.slice(-8)}`);
    console.log(`   Valor: R$ ${mockStripeEvent.data.object.amount_total / 100}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Signature: ${signature.substring(0, 50)}...`);

    // 2. Enviar webhook
    console.log('\n🚀 ENVIANDO WEBHOOK...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payload
    });

    console.log(`📊 Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`📝 Response: ${responseText}`);

    // 3. Analisar resultado
    console.log('\n🔍 ANÁLISE DO RESULTADO:');
    
    if (response.status === 200) {
      console.log('✅ SUCESSO! Webhook processado corretamente');
      
      try {
        const responseData = JSON.parse(responseText);
        if (responseData.received) {
          console.log('✅ Evento foi recebido e processado');
        }
      } catch (e) {
        console.log('✅ Resposta recebida (não é JSON)');
      }
      
    } else if (response.status === 400) {
      console.log('❌ Erro 400 - Possíveis causas:');
      console.log('   1. Signature inválida');
      console.log('   2. STRIPE_SECRET_KEY não configurada');
      console.log('   3. Payload malformado');
      
    } else if (response.status === 500) {
      console.log('❌ Erro 500 - Erro interno da função:');
      console.log('   1. Problema na lógica da função');
      console.log('   2. Erro de conexão com banco');
      console.log('   3. Variável de ambiente faltando');
      
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
    }

    // 4. Verificar se o pagamento foi registrado
    console.log('\n🔍 VERIFICANDO SE PAGAMENTO FOI REGISTRADO...');
    
    // Aguardar um pouco para processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Usar o script de análise para verificar
    console.log('Execute: node final-analysis.js para verificar se o pagamento foi registrado');

    // 5. Próximos passos
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('='.repeat(50));
    
    if (response.status === 200) {
      console.log('✅ Webhook funcionando! Agora:');
      console.log('1. Execute: node final-analysis.js');
      console.log('2. Verifique se apareceu 1 pagamento no banco');
      console.log('3. Verifique se a consulta mudou para "pago"');
      console.log('4. Teste na aplicação: /agenda-paciente?debug=true');
      
    } else {
      console.log('🔧 Webhook com problemas:');
      console.log('1. Verificar variáveis de ambiente no Supabase');
      console.log('2. Verificar logs da função: supabase functions logs stripe-webhook');
      console.log('3. Verificar se STRIPE_SECRET_KEY está configurada');
      console.log('4. Verificar se STRIPE_WEBHOOK_SECRET está configurada');
    }

    console.log('\n📋 VARIÁVEIS QUE DEVEM ESTAR CONFIGURADAS:');
    console.log(`   STRIPE_SECRET_KEY: sk_test_... (sua chave de teste)`);
    console.log(`   STRIPE_WEBHOOK_SECRET: ${webhookSecret}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar conectividade');
    console.log('2. Verificar se função está deployada');
    console.log('3. Verificar configuração do Supabase');
  }
}

// Executar teste
testWebhookWithRealData();