
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting and security utilities
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier);
  
  if (!userRequests) {
    rateLimitMap.set(identifier, { count: 1, lastRequest: now });
    return true;
  }
  
  if (now - userRequests.lastRequest > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastRequest: now });
    return true;
  }
  
  if (userRequests.count >= maxRequests) {
    return false;
  }
  
  userRequests.count++;
  userRequests.lastRequest = now;
  return true;
};

const createSecureErrorResponse = (error: any): string => {
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  if (isDevelopment) {
    return error?.message || 'An error occurred';
  }
  
  return 'Service temporarily unavailable';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== VERIFICAÇÃO DE PAGAMENTO INICIADA ===");
    
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 10, 60000)) {
      console.warn('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: corsHeaders }
      );
    }
    
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
    
    // Input validation
    if (!session_id && !consulta_id) {
      throw new Error("Session ID ou Consulta ID é obrigatório");
    }
    
    console.log("Session ID:", session_id ? '[PROTECTED]' : 'Not provided');
    console.log("Consulta ID:", consulta_id || 'Not provided');

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
          console.log("Session ID encontrado nos pagamentos");
        }
      }
    }

    if (!finalSessionId) {
      throw new Error("Session ID não encontrado");
    }

    // Verificar status da sessão no Stripe
    console.log("Consultando Stripe...");
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(finalSessionId);
    } catch (stripeError) {
      console.error("Erro ao consultar Stripe:", stripeError);
      throw new Error("Sessão não encontrada no Stripe");
    }

    console.log("Status da sessão:", session.status);
    console.log("Payment status:", session.payment_status);

    if (session.payment_status === 'paid') {
      console.log("Pagamento confirmado, atualizando banco...");
      
      // Verificar se já existe pagamento registrado
      const { data: existingPayment } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('gateway_id', finalSessionId)
        .single();

      if (!existingPayment) {
        console.log("Registrando novo pagamento no banco...");
        
        // Buscar dados da consulta para obter IDs necessários
        const { data: consultaData } = await supabaseClient
          .from('consultas')
          .select('paciente_id, medico_id')
          .eq('id', session.metadata?.consulta_id || consulta_id)
          .single();
        
        // Registrar pagamento
        const { data: newPayment, error: paymentError } = await supabaseClient
          .from('pagamentos')
          .insert({
            consulta_id: session.metadata?.consulta_id || consulta_id,
            paciente_id: session.metadata?.paciente_id || consultaData?.paciente_id,
            medico_id: session.metadata?.medico_id || consultaData?.medico_id,
            valor: session.amount_total / 100,
            metodo_pagamento: 'credit_card',
            gateway_id: finalSessionId,
            status: 'succeeded',
            dados_gateway: session
          })
          .select()
          .single();

        if (paymentError) {
          console.error("Erro ao registrar pagamento:", paymentError);
          // Se for erro de duplicação, não é crítico
          if (paymentError.code !== '23505') {
            throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
          } else {
            console.log("Pagamento já existe - OK");
          }
        } else {
          console.log("Pagamento registrado com sucesso:", newPayment);
        }
      } else {
        console.log("Pagamento já existe no banco:", existingPayment);
      }

      // Atualizar consulta
      console.log("Atualizando status da consulta...");
      const { data: consultaData, error: consultaError } = await supabaseClient
        .from('consultas')
        .update({ 
          status_pagamento: 'pago',
          status: 'agendada',
          valor: session.amount_total / 100,
          expires_at: null // Limpar expiração já que foi pago
        })
        .eq('id', session.metadata?.consulta_id || consulta_id)
        .select()
        .single();

      if (consultaError) {
        console.error("Erro ao atualizar consulta:", consultaError);
        throw new Error(`Erro ao atualizar consulta: ${consultaError.message}`);
      } else {
        console.log("Consulta atualizada com sucesso:", consultaData);
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
      console.log("Pagamento ainda não processado, status:", session.payment_status);
      return new Response(JSON.stringify({ 
        success: true, 
        payment_status: session.payment_status,
        message: "Pagamento ainda não foi processado"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Erro na verificação:", error);
    console.error("Stack trace:", error.stack);
    
    const secureErrorMessage = createSecureErrorResponse(error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: secureErrorMessage,
        details: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
