import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // JWT is verified by Supabase automatically due to verify_jwt = true
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user?.email) {
      console.error("Auth error:", authError);
      throw new Error("Usuário não autenticado");
    }

    console.log("Payment intent requested by user:", user.id);

    const { amount, description, os_id } = await req.json();

    // Input validation
    if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
      throw new Error("Valor inválido");
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0 || description.length > 500) {
      throw new Error("Descrição inválida");
    }
    if (os_id && typeof os_id !== 'string') {
      throw new Error("ID da OS inválido");
    }
    
    // Authorization: verify user can create payment for this OS
    if (os_id) {
      const { data: os, error: osError } = await supabaseClient
        .from("ordens_servico")
        .select("solicitante_id")
        .eq("id", os_id)
        .single();
      
      if (osError || !os) {
        console.error("OS not found:", osError);
        throw new Error("Ordem de serviço não encontrada");
      }
      
      if (os.solicitante_id !== user.id) {
        console.error("Unauthorized payment attempt:", { userId: user.id, osId: os_id });
        throw new Error("Você não tem permissão para criar pagamento para esta OS");
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verificar se cliente já existe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    // Criar payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converter para centavos
      currency: "brl",
      customer: customerId,
      description: description,
      metadata: {
        os_id: os_id || "",
        user_id: user.id
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("Payment Intent criado:", paymentIntent.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro ao criar payment intent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
