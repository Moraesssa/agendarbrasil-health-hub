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
    console.log("=== VERIFICAÇÃO DE PAGAMENTO INICIADA ===");
    
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

    // Obter dados da requisição
    const { session_id, consulta_id } = await req.json();
    console.log("Session ID:", session_id);
    console.log("Consulta ID:", consulta_id);

    let finalSessionId = session_id;

    // Se session_id não foi fornecido, tentar buscar pela consulta_id
    if (!finalSessionId && consulta_id) {
      console.log("Buscando session_id pela consulta...");
      const { data: consultaData } = await supabaseClient
        .from('consultas')
        .select('*')
        .eq('id', consulta_id)
        .single();
      
      if (consultaData) {
        // Buscar session_id nos pagamentos
        const { data: pagamentoData } = await supabaseClient
          .from('pagamentos')
          .select('gateway_id')
          .eq('consulta_id', consulta_id)
          .single();
        
        if (pagamentoData?.gateway_id) {
          finalSessionId = pagamentoData.gateway_id;
          console.log("Session ID encontrado nos pagamentos:", finalSessionId);
        }
      }
    }

    if (!finalSessionId) {
      throw new Error("Session ID não encontrado");
    }

    // Verificar status da sessão no Stripe
    console.log("Consultando Stripe...");
    const session = await stripe.checkout.sessions.retrieve(finalSessionId);
    console.log("Status da sessão:", session.status);
    console.log("Payment status:", session.payment_status);

    if (session.payment_status === 'paid') {
      console.log("Pagamento confirmado, atualizando banco...");
      
      // Verificar se já existe pagamento registrado
      const { data: existingPayment } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('gateway_id', session_id)
        .single();

      if (!existingPayment) {
        // Registrar pagamento
        const { error: paymentError } = await supabaseClient
          .from('pagamentos')
          .insert({
            consulta_id: session.metadata?.consulta_id || consulta_id,
            paciente_id: session.metadata?.paciente_id,
            medico_id: session.metadata?.medico_id,
            valor: session.amount_total / 100,
            metodo_pagamento: 'credit_card',
            gateway_id: finalSessionId,
            status: 'succeeded',
            dados_gateway: session
          });

        if (paymentError) {
          console.error("Erro ao registrar pagamento:", paymentError);
        }
      }

      // Atualizar consulta
      const { data: consultaData, error: consultaError } = await supabaseClient
        .from('consultas')
        .update({ 
          status_pagamento: 'pago',
          status: 'agendada',
          valor: session.amount_total / 100
        })
        .eq('id', session.metadata?.consulta_id || consulta_id)
        .select()
        .single();

      if (consultaError) {
        console.error("Erro ao atualizar consulta:", consultaError);
        throw new Error(`Erro ao atualizar consulta: ${consultaError.message}`);
      }

      console.log("=== VERIFICAÇÃO CONCLUÍDA COM SUCESSO ===");
      return new Response(JSON.stringify({ 
        success: true, 
        payment_status: 'paid',
        consulta: consultaData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log("Pagamento ainda não processado");
      return new Response(JSON.stringify({ 
        success: false, 
        payment_status: session.payment_status,
        message: "Pagamento ainda não foi processado"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Erro na verificação:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Erro interno do servidor"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});