
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== STRIPE WEBHOOK INICIADO ===");
    console.log("Método:", req.method);
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    
    // Verificar se a chave do Stripe está configurada
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY não configurada");
      return new Response(JSON.stringify({ error: "Configuração inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Verificar se o webhook secret está configurado
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET não configurada");
      return new Response(JSON.stringify({ error: "Configuração inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("Stripe key configurada ✓");

    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Criar cliente Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Obter dados do webhook
    const body = await req.text();
    console.log("Body recebido - tamanho:", body.length);
    
    const signature = req.headers.get("stripe-signature");
    console.log("Signature presente:", !!signature);

    if (!signature) {
      console.error("Nenhuma signature fornecida pelo Stripe");
      return new Response(JSON.stringify({ error: "Signature inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // CORREÇÃO: Usar constructEventAsync em vez de constructEvent
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("✅ Webhook signature verificada com sucesso");
    } catch (err) {
      console.error(`Erro ao verificar assinatura do webhook: ${err.message}`);
      return new Response(JSON.stringify({ error: "Signature inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    console.log("=== EVENTO STRIPE ===");
    console.log("Tipo:", event.type);
    console.log("ID:", event.id);
    console.log("Created:", new Date(event.created * 1000).toISOString());

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log("=== CHECKOUT CONCLUÍDO ===");
        console.log("Session ID:", session.id);
        console.log("Customer:", session.customer);
        console.log("Amount Total:", session.amount_total);
        console.log("Payment Status:", session.payment_status);
        console.log("Metadata:", session.metadata);

        if (!session.metadata?.consulta_id) {
          console.error("Metadata consulta_id não encontrado:", session.metadata);
          throw new Error("Consulta ID não encontrado no metadata");
        }

        // Verificar se o pagamento foi realmente processado
        if (session.payment_status !== 'paid') {
          console.log("Pagamento ainda não foi processado, status:", session.payment_status);
          return new Response(JSON.stringify({ received: true, status: 'pending' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Registrar pagamento no banco
        console.log("Registrando pagamento...");
        const { data: paymentData, error: paymentError } = await supabaseClient
          .from('pagamentos')
          .insert({
            consulta_id: session.metadata.consulta_id,
            paciente_id: session.metadata.paciente_id,
            medico_id: session.metadata.medico_id,
            valor: session.amount_total / 100, // Converter de centavos
            metodo_pagamento: 'credit_card',
            gateway_id: session.id,
            status: 'succeeded',
            dados_gateway: session
          })
          .select()
          .single();

        if (paymentError) {
          console.error("Erro ao registrar pagamento:", paymentError);
          // Se for erro de duplicação, não é um problema crítico
          if (paymentError.code !== '23505') {
            throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
          } else {
            console.log("Pagamento já existe no banco - OK");
          }
        } else {
          console.log("Pagamento registrado:", paymentData);
        }

        // Atualizar status da consulta
        console.log("Atualizando status da consulta...");
        const { data: consultaData, error: consultaError } = await supabaseClient
          .from('consultas')
          .update({ 
            status_pagamento: 'pago',
            status: 'agendada',
            valor: session.amount_total / 100, // Converter de centavos para reais
            expires_at: null // Limpar expiração já que foi pago
          })
          .eq('id', session.metadata.consulta_id)
          .select()
          .single();

        if (consultaError) {
          console.error("Erro ao atualizar consulta:", consultaError);
          throw new Error(`Erro ao atualizar consulta: ${consultaError.message}`);
        }
        console.log("Consulta atualizada:", consultaData);
        console.log("=== PAGAMENTO PROCESSADO COM SUCESSO ===");

        break;

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object;
        console.log("Pagamento falhou:", paymentIntent.id);
        
        // Registrar falha no pagamento
        const { error: failureError } = await supabaseClient
          .from('pagamentos')
          .insert({
            gateway_id: paymentIntent.id,
            status: 'failed',
            dados_gateway: paymentIntent
          });

        if (failureError) {
          console.error("Erro ao registrar falha:", failureError);
        }
        
        break;

      default:
        console.log("Evento não processado:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no webhook:", error);
    console.error("Stack trace:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor",
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
