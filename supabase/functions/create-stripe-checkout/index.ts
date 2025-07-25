
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

const checkRateLimit = (identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
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
  
  // Generic error messages for production
  const errorMessage = error?.message?.toLowerCase() || '';
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'Invalid input provided';
  }
  if (errorMessage.includes('auth') || errorMessage.includes('token')) {
    return 'Authentication failed';
  }
  if (errorMessage.includes('permission') || errorMessage.includes('access')) {
    return 'Access denied';
  }
  if (errorMessage.includes('stripe') || errorMessage.includes('payment')) {
    return 'Payment processing error';
  }
  
  return 'Service temporarily unavailable';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando processamento de checkout do Stripe");
    
    // Rate limiting check
    const authHeader = req.headers.get("Authorization");
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = authHeader ? `user:${authHeader.slice(-10)}` : `ip:${clientIP}`;
    
    if (!checkRateLimit(rateLimitKey, 5, 60000)) {
      console.warn('Rate limit exceeded for:', rateLimitKey);
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

    // Obter dados da requisição
    const { consultaId, medicoId, amount, currency, paymentMethod, successUrl, cancelUrl } = await req.json();
    
    // Input validation
    if (!consultaId || !medicoId || !amount || amount <= 0) {
      throw new Error("Dados de consulta inválidos");
    }
    
    if (amount > 100000) { // R$ 1000 max
      throw new Error("Valor da consulta excede o limite permitido");
    }
    
    console.log("Dados recebidos:", { consultaId, medicoId, amount: '[PROTECTED]', currency, paymentMethod });

    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Token de autorização não fornecido");
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Obter usuário autenticado
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Erro de autenticação:", userError);
      throw new Error("Usuário não autenticado");
    }

    console.log("Usuário autenticado:", user.id);

    // Verificar se já existe um customer no Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Customer existente encontrado:", customerId);
    } else {
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Novo customer criado:", customerId);
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethod === 'pix' ? ['boleto'] : ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'brl',
            product_data: {
              name: 'Consulta Médica',
              description: `Consulta médica - ID: ${consultaId}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        consulta_id: consultaId,
        medico_id: medicoId,
        paciente_id: user.id,
      },
    });

    console.log("Sessão de checkout criada:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro na criação do checkout:", error);
    
    const secureErrorMessage = createSecureErrorResponse(error);
    
    return new Response(JSON.stringify({ error: secureErrorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
