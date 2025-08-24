
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

        if (session.payment_status !== 'paid') {
          console.log("Pagamento ainda não foi processado, status:", session.payment_status);
          return new Response(JSON.stringify({ received: true, status: 'pending' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const targetConsultaId = session.metadata.consulta_id as string;

        // 1) Dual-write em payments (v2)
        try {
          const { data: existingV2 } = await supabaseClient
            .from('payments')
            .select('id')
            .eq('stripe_session_id', session.id)
            .limit(1)
            .single();

          if (!existingV2) {
            const { error: insertV2Error } = await supabaseClient
              .from('payments')
              .insert({
                consultation_id: targetConsultaId,
                amount: session.amount_total || 0,
                currency: session.currency || 'brl',
                status: 'succeeded',
                stripe_session_id: session.id,
                stripe_payment_intent_id: (session.payment_intent as string) || null,
                customer_email: session.customer_details?.email || session.customer_email || null,
                customer_name: session.customer_details?.name || null,
                metadata: session.metadata || null,
              });
            if (insertV2Error) {
              console.warn('Falha ao inserir em payments (v2):', insertV2Error);
            } else {
              console.log('Registro criado em payments (v2)');
            }
          } else {
            console.log('Registro já existe em payments (v2)');
          }
        } catch (e) {
          console.warn('Erro não crítico no dual-write para payments (v2):', e);
        }

        // 2) Registrar no legacy pagamentos se necessário
        const { data: existingLegacy } = await supabaseClient
          .from('pagamentos')
          .select('id')
          .eq('gateway_id', session.id)
          .limit(1)
          .single();

        if (!existingLegacy) {
          console.log("Registrando pagamento na tabela legacy pagamentos...");
          // Buscar dados mínimos da consulta
          const { data: consultaIds } = await supabaseClient
            .from('consultas')
            .select('paciente_id, medico_id')
            .eq('id', targetConsultaId)
            .single();

          const { error: legacyError } = await supabaseClient
            .from('pagamentos')
            .insert({
              consulta_id: targetConsultaId,
              paciente_id: session.metadata?.paciente_id || consultaIds?.paciente_id,
              medico_id: session.metadata?.medico_id || consultaIds?.medico_id,
              valor: (session.amount_total || 0) / 100,
              metodo_pagamento: 'credit_card',
              gateway_id: session.id,
              status: 'succeeded',
              dados_gateway: session
            });

          if (legacyError && legacyError.code !== '23505') {
            console.error("Erro ao registrar pagamento (legacy):", legacyError);
            throw new Error(`Erro ao registrar pagamento: ${legacyError.message}`);
          }
        } else {
          console.log("Pagamento legacy já registrado");
        }

        // 3) Confirmar consulta via RPC
        console.log("Confirmando consulta via RPC confirm_appointment_v2...");
        const { data: rpcResult, error: rpcError } = await supabaseClient
          .rpc('confirm_appointment_v2', {
            p_appointment_id: targetConsultaId,
            p_payment_intent_id: (session.payment_intent as string) || ''
          });

        if (rpcError) {
          console.error('Erro na RPC confirm_appointment_v2:', rpcError);
          throw new Error(`Erro ao confirmar consulta: ${rpcError.message}`);
        }
        console.log('RPC confirm_appointment_v2 retorno:', rpcResult);

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
