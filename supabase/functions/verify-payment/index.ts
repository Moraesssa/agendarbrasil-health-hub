
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
    
    // Input validation crítica
    if (!session_id && !consulta_id) {
      throw new Error("Session ID ou Consulta ID é obrigatório");
    }
    
    // Validar UUID se consulta_id foi fornecido
    if (consulta_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (consulta_id === 'undefined' || consulta_id === 'null' || !uuidRegex.test(consulta_id)) {
        console.error('UUID inválido detectado:', consulta_id);
        throw new Error("ID da consulta inválido");
      }
    }
    
    console.log("Session ID:", session_id ? '[PROTECTED]' : 'Not provided');
    console.log("Consulta ID:", consulta_id || 'Not provided');

    let finalSessionId = session_id;

    // Se session_id não foi fornecido, tentar buscar pela consulta_id
    if (!finalSessionId && consulta_id) {
      console.log("Buscando session_id pela consulta...");
      const { data: consultaData } = await supabaseClient
        .from('consultas')
        .select('id')
        .eq('id', consulta_id)
        .single();
      
      if (consultaData) {
        // 1) Buscar na nova tabela payments
        const { data: paymentV2 } = await supabaseClient
          .from('payments')
          .select('stripe_session_id')
          .eq('consultation_id', consulta_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (paymentV2?.stripe_session_id) {
          finalSessionId = paymentV2.stripe_session_id;
          console.log("Session ID encontrado em payments (v2)");
        } else {
          // 2) Fallback: Buscar session_id na tabela legacy pagamentos
          const { data: pagamentoData } = await supabaseClient
            .from('pagamentos')
            .select('gateway_id')
            .eq('consulta_id', consulta_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (pagamentoData?.gateway_id) {
            finalSessionId = pagamentoData.gateway_id;
            console.log("Session ID encontrado nos pagamentos (legacy)");
          }
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

      const targetConsultaId = (session.metadata?.consulta_id || consulta_id) as string;

      // 1) Dual-write: inserir/garantir registro na nova tabela payments
      try {
        const { data: existingV2 } = await supabaseClient
          .from('payments')
          .select('id')
          .eq('stripe_session_id', finalSessionId)
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
              stripe_session_id: finalSessionId,
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

      // 2) Manter compatibilidade: registrar em pagamentos (legacy) se não existir
      const { data: existingPayment } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('gateway_id', finalSessionId)
        .single();

      if (!existingPayment) {
        console.log("Registrando novo pagamento (legacy)...");
        // Buscar dados da consulta para obter IDs necessários
        const { data: consultaIds } = await supabaseClient
          .from('consultas')
          .select('paciente_id, medico_id')
          .eq('id', targetConsultaId)
          .single();
        
        const { error: paymentError } = await supabaseClient
          .from('pagamentos')
          .insert({
            consulta_id: targetConsultaId,
            paciente_id: session.metadata?.paciente_id || consultaIds?.paciente_id,
            medico_id: session.metadata?.medico_id || consultaIds?.medico_id,
            valor: (session.amount_total || 0) / 100,
            metodo_pagamento: 'credit_card',
            gateway_id: finalSessionId,
            status: 'succeeded',
            dados_gateway: session
          });

        if (paymentError && paymentError.code !== '23505') {
          console.error("Erro ao registrar pagamento (legacy):", paymentError);
          throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
        }
      } else {
        console.log("Pagamento (legacy) já existe no banco");
      }

      // 3) Atualizar consulta via RPC confirm_appointment_v2
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

      // Buscar consulta atualizada para retornar ao cliente
      const { data: consultaData, error: consultaFetchError } = await supabaseClient
        .from('consultas')
        .select('*')
        .eq('id', targetConsultaId)
        .single();

      if (consultaFetchError) {
        console.warn('Consulta confirmada, mas falhou ao recuperar dados:', consultaFetchError);
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
