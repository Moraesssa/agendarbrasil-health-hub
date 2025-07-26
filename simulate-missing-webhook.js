// Simular o webhook que deveria ter sido enviado pelo Stripe
import crypto from 'crypto';

const webhookUrl = 'https://ulebotjrsgheybhpdnxd.supabase.co/functions/v1/stripe-webhook';
const webhookSecret = 'whsec_rk7shhs0l9gNzegM4p40lc5yHe333bao';

// Simular evento baseado no seu teste real
const mockStripeEvent = {
  id: 'evt_real_test_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_real_test_' + Date.now(),
      object: 'checkout.session',
      amount_total: 15000, // R$ 150.00 em centavos (baseado na consulta 789cd418)
      currency: 'brl',
      customer: 'cus_test_customer',
      customer_email: 'teste@exemplo.com',
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        consulta_id: '59fb1551-872b-4f9e-925a-6314789cd418', // Consulta que tem valor R$ 150
        paciente_id: 'ff31d767-ad28-4b20-9caf-38350e719396',
        medico_id: 'a6dc47bd-6068-4314-91a7-b210b89de3ca'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_real_test',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

function createStripeSignature(payload, secret, timestamp) {
  const cleanSecret = secret.replace('whsec_', '');
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', cleanSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function simulateMissingWebhook() {
  console.log('🔄 SIMULANDO WEBHOOK QUE DEVERIA TER SIDO ENVIADO\n');
  console.log('🎯 Objetivo: Processar o pagamento que foi confirmado no Stripe');

  try {
    const payload = JSON.stringify(mockStripeEvent);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createStripeSignature(payload, webhookSecret, timestamp);

    console.log('📋 DADOS DO EVENTO:');
    console.log(`   Consulta ID: ${mockStripeEvent.data.object.metadata.consulta_id.slice(-8)}`);
    console.log(`   Valor: R$ ${mockStripeEvent.data.object.amount_total / 100}`);
    console.log(`   Status: ${mockStripeEvent.data.object.payment_status}`);

    console.log('\n🚀 ENVIANDO WEBHOOK SIMULADO...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: payload
    });

    const responseText = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Response: ${responseText}`);

    if (response.status === 200) {
      console.log('\n🎉 SUCESSO! Webhook processado!');
      console.log('✅ Pagamento deve ter sido registrado');
      console.log('✅ Consulta deve ter mudado para "pago"');
      
      console.log('\n🔍 Verificando resultado...');
      setTimeout(async () => {
        console.log('Execute: node detailed-check.js para confirmar');
      }, 2000);
      
    } else {
      console.log('\n❌ Erro no processamento do webhook');
      console.log('Verifique os logs da função stripe-webhook');
    }

  } catch (error) {
    console.error('❌ Erro ao simular webhook:', error.message);
  }
}

simulateMissingWebhook();