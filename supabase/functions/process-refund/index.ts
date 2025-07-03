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
    console.log("Iniciando processamento de reembolso");
    
    // Verificar se a chave do Stripe está configurada
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY não configurada");
      throw new Error("Sistema de pagamento não configurado");
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Criar cliente Supabase para autenticação
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Criar cliente Supabase com service role para operações administrativas
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Obter dados da requisição
    const { paymentId, reason, amount } = await req.json();

    if (!paymentId || !reason) {
      throw new Error("ID do pagamento e motivo são obrigatórios");
    }

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    console.log("Usuário autenticado:", user.id);

    // Buscar o pagamento original
    const { data: payment, error: paymentError } = await supabaseService
      .from('pagamentos')
      .select('*')
      .eq('id', paymentId)
      .eq('medico_id', user.id)
      .eq('status', 'succeeded')
      .single();

    if (paymentError || !payment) {
      console.error("Erro ao buscar pagamento:", paymentError);
      throw new Error("Pagamento não encontrado ou não elegível para reembolso");
    }

    console.log("Pagamento encontrado:", payment.id);

    // Verificar se já foi reembolsado
    const { data: existingRefund } = await supabaseService
      .from('pagamentos')
      .select('id')
      .eq('original_payment_id', paymentId)
      .eq('status', 'refund')
      .single();

    if (existingRefund) {
      throw new Error("Este pagamento já foi reembolsado");
    }

    // Processar reembolso no Stripe
    if (!payment.gateway_id) {
      throw new Error("ID do gateway não encontrado no pagamento");
    }

    console.log("Processando reembolso no Stripe para:", payment.gateway_id);

    const refundAmount = amount ? Math.round(amount * 100) : undefined; // Converter para centavos
    
    const refund = await stripe.refunds.create({
      charge: payment.gateway_id,
      amount: refundAmount, // Se não especificado, reembolsa o valor total
      reason: 'requested_by_customer',
      metadata: {
        consulta_id: payment.consulta_id,
        medico_id: payment.medico_id,
        motivo: reason
      }
    });

    console.log("Reembolso processado no Stripe:", refund.id);

    // Registrar o reembolso na base de dados
    const { error: refundInsertError } = await supabaseService
      .from('pagamentos')
      .insert({
        consulta_id: payment.consulta_id,
        paciente_id: payment.paciente_id,
        medico_id: payment.medico_id,
        valor: -(refund.amount / 100), // Valor negativo para reembolso
        metodo_pagamento: payment.metodo_pagamento,
        gateway_id: refund.charge,
        refund_id: refund.id,
        status: 'refund',
        refund_reason: reason,
        refunded_amount: refund.amount / 100,
        refunded_at: new Date().toISOString(),
        original_payment_id: payment.id,
        dados_gateway: refund
      });

    if (refundInsertError) {
      console.error("Erro ao registrar reembolso:", refundInsertError);
      throw new Error("Erro ao registrar reembolso na base de dados");
    }

    // Atualizar status da consulta para reembolsado
    const { error: consultaUpdateError } = await supabaseService
      .from('consultas')
      .update({ status_pagamento: 'reembolsado' })
      .eq('id', payment.consulta_id);

    if (consultaUpdateError) {
      console.error("Erro ao atualizar consulta:", consultaUpdateError);
      // Não falhar aqui, o reembolso já foi processado
    }

    console.log("Reembolso processado com sucesso");

    return new Response(
      JSON.stringify({ 
        success: true, 
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no processamento de reembolso:", error);
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