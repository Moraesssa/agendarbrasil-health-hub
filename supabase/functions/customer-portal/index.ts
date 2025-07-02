
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
    console.log("🚀 Iniciando criação de sessão do portal do cliente");
    
    // Verificar se a chave do Stripe está configurada
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY não configurada");
      throw new Error("Stripe não configurado");
    }

    // Log do tipo de chave (test/live) sem expor a chave completa
    const keyType = stripeKey.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    console.log(`🔑 Usando chave Stripe: ${keyType} (${stripeKey.slice(0, 12)}...)`);

    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Token de autorização não fornecido");
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
      console.error("❌ Erro de autenticação:", userError);
      throw new Error("Usuário não autenticado");
    }

    if (!user.email) {
      console.error("❌ Email do usuário não encontrado");
      throw new Error("Email do usuário não encontrado");
    }

    console.log(`👤 Usuário autenticado: ${user.id}, Email: ${user.email}`);

    // Obter URL de retorno - usar a URL correta da aplicação
    let returnUrl = "https://agendarbrasil-health-hub.lovable.app/financeiro";
    
    try {
      const requestBody = await req.json();
      if (requestBody?.returnUrl && typeof requestBody.returnUrl === 'string') {
        returnUrl = requestBody.returnUrl;
        console.log(`🔗 URL de retorno personalizada: ${returnUrl}`);
      }
    } catch (jsonError) {
      console.log("📝 Usando URL de retorno padrão (sem JSON no body)");
    }
    
    console.log(`🏠 URL de retorno final: ${returnUrl}`);

    // Buscar customer no Stripe com tratamento de erro específico
    console.log(`🔍 Buscando customer no Stripe para email: ${user.email}`);
    
    let customers;
    try {
      customers = await stripe.customers.list({
        email: user.email,
        limit: 5, // Aumentar limite para garantir que encontramos o customer
      });
      console.log(`📊 Encontrados ${customers.data.length} customers para o email ${user.email}`);
    } catch (stripeError) {
      console.error("❌ Erro ao buscar customers no Stripe:", stripeError);
      throw new Error(`Erro na API do Stripe: ${stripeError.message}`);
    }

    let customerId;
    
    if (customers.data.length === 0) {
      console.log("➕ Customer não encontrado, criando novo customer no Stripe");
      
      // Obter nome do usuário de forma mais robusta
      const userName = user.user_metadata?.full_name || 
                     user.user_metadata?.display_name || 
                     user.user_metadata?.name ||
                     user.email.split('@')[0] ||
                     'Cliente';
      
      console.log(`👤 Nome do usuário para customer: "${userName}"`);
      
      try {
        // Criar novo customer no Stripe
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: userName,
          metadata: {
            supabase_user_id: user.id,
            created_from: 'customer_portal'
          },
        });
        
        customerId = newCustomer.id;
        console.log(`✅ Novo customer criado com sucesso: ${customerId}`);
      } catch (createError) {
        console.error("❌ Erro ao criar customer no Stripe:", createError);
        throw new Error(`Erro ao criar customer: ${createError.message}`);
      }
    } else {
      // Se encontrou múltiplos customers, usar o primeiro ativo
      const activeCustomer = customers.data.find(c => !c.deleted) || customers.data[0];
      customerId = activeCustomer.id;
      console.log(`✅ Customer existente encontrado: ${customerId} (total: ${customers.data.length})`);
    }

    // Validar se temos um customerId válido
    if (!customerId || !customerId.startsWith('cus_')) {
      console.error(`❌ ID de customer inválido: ${customerId}`);
      throw new Error('ID de customer inválido');
    }

    // Criar sessão do portal do cliente com tratamento de erro específico
    console.log(`🏪 Criando sessão do portal para customer: ${customerId}`);
    
    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      console.log(`✅ Sessão do portal criada com sucesso: ${session.id}`);
      console.log(`🔗 URL da sessão: ${session.url}`);
    } catch (portalError) {
      console.error("❌ Erro ao criar sessão do portal:", portalError);
      
      // Tratar erros específicos do portal
      if (portalError.message?.includes('No such customer')) {
        throw new Error(`Customer não encontrado no Stripe: ${customerId}`);
      } else if (portalError.message?.includes('Invalid customer')) {
        throw new Error(`Customer inválido: ${customerId}`);
      } else {
        throw new Error(`Erro ao criar portal: ${portalError.message}`);
      }
    }

    // Validar se a sessão foi criada corretamente
    if (!session?.url) {
      console.error("❌ Sessão criada mas URL não retornada");
      throw new Error('URL da sessão não foi retornada pelo Stripe');
    }

    const response = {
      url: session.url,
      customerId: customerId,
      sessionId: session.id
    };

    console.log("🎉 Portal do cliente criado com sucesso!");

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("💥 Erro geral na criação do portal do cliente:", error);
    
    // Log detalhado do erro para debugging
    if (error instanceof Error) {
      console.error(`📋 Nome do erro: ${error.name}`);
      console.error(`📝 Mensagem: ${error.message}`);
      console.error(`📚 Stack trace: ${error.stack}`);
    }

    // Determinar mensagem de erro apropriada para o usuário
    let userMessage = "Erro interno do servidor";
    
    if (error instanceof Error) {
      if (error.message.includes("não configurado")) {
        userMessage = "Sistema de pagamento não configurado. Entre em contato com o suporte.";
      } else if (error.message.includes("não autenticado")) {
        userMessage = "Sessão expirada. Faça login novamente.";
      } else if (error.message.includes("Customer não encontrado")) {
        userMessage = "Dados do cliente não encontrados no sistema de pagamentos.";
      } else if (error.message.includes("API do Stripe")) {
        userMessage = "Erro na comunicação com o sistema de pagamentos.";
      } else {
        userMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({ 
        error: userMessage,
        details: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
