
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
    console.log("Iniciando criação de sessão do portal do cliente");
    
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

    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Token de autorização não fornecido");
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

    if (!user.email) {
      console.error("Email do usuário não encontrado");
      throw new Error("Email do usuário não encontrado");
    }

    console.log("Usuário autenticado:", user.id, "Email:", user.email);

    // Obter dados da requisição de forma segura
    let returnUrl;
    try {
      const requestBody = await req.json();
      returnUrl = requestBody?.returnUrl;
    } catch (jsonError) {
      console.log("Nenhum JSON no body da requisição, usando URL padrão");
      returnUrl = null;
    }
    
    const defaultReturnUrl = `${new URL(req.url).origin}/financeiro`;
    const finalReturnUrl = returnUrl || defaultReturnUrl;
    console.log("URL de retorno:", finalReturnUrl);

    // Buscar customer no Stripe
    console.log("Buscando customer no Stripe para email:", user.email);
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    
    if (customers.data.length === 0) {
      console.log("Customer não encontrado, criando novo customer no Stripe");
      
      // Obter nome do usuário de forma segura
      const userName = user.user_metadata?.full_name || 
                     user.user_metadata?.display_name || 
                     user.user_metadata?.name ||
                     user.email.split('@')[0];
      
      console.log("Nome do usuário para customer:", userName);
      
      // Criar novo customer no Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: userName,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      customerId = newCustomer.id;
      console.log("Novo customer criado:", customerId);
    } else {
      customerId = customers.data[0].id;
      console.log("Customer existente encontrado:", customerId);
    }

    // Criar sessão do portal do cliente
    console.log("Criando sessão do portal para customer:", customerId);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: finalReturnUrl,
    });

    console.log("Sessão do portal criada com sucesso:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro na criação do portal do cliente:", error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error("Nome do erro:", error.name);
      console.error("Mensagem do erro:", error.message);
      console.error("Stack trace:", error.stack);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        details: error instanceof Error ? error.toString() : "Erro desconhecido"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
