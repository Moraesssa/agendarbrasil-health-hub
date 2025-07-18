
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
    console.log("Iniciando processamento de checkout do Stripe");
    
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
    
    console.log("Dados recebidos:", { consultaId, medicoId, amount, currency, paymentMethod });

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
