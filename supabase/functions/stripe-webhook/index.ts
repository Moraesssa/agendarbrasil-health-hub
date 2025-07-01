
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Webhook do Stripe recebido");
    
    // Verificar se a chave do Stripe está configurada
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY não configurada");
      throw new Error("Stripe não configurado");
    }

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
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Signature do webhook não fornecida");
    }

    // Verificar webhook (em produção, use o webhook secret)
    const event = JSON.parse(body);
    console.log("Evento recebido:", event.type);

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log("Checkout concluído:", session.id);

        // Registrar pagamento no banco
        const { error: paymentError } = await supabaseClient
          .from('pagamentos')
          .insert({
            consulta_id: session.metadata.consulta_id,
            paciente_id: session.metadata.paciente_id,
            medico_id: session.metadata.medico_id,
            valor: session.amount_total,
            metodo_pagamento: 'credit_card',
            gateway_id: session.id,
            status: 'succeeded',
            dados_gateway: session
          });

        if (paymentError) {
          console.error("Erro ao registrar pagamento:", paymentError);
        }

        // Atualizar status da consulta
        const { error: consultaError } = await supabaseClient
          .from('consultas')
          .update({ 
            status_pagamento: 'pago',
            valor: session.amount_total / 100 // Converter de centavos para reais
          })
          .eq('id', session.metadata.consulta_id);

        if (consultaError) {
          console.error("Erro ao atualizar consulta:", consultaError);
        }

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
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
