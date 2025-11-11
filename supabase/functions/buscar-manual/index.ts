import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { empreendimentoId, pergunta, tipoManual } = await req.json();
    
    if (!empreendimentoId || !pergunta) {
      return new Response(
        JSON.stringify({ error: "empreendimentoId e pergunta são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Buscando conteúdo dos manuais para empreendimento:", empreendimentoId);

    // Buscar conteúdo dos manuais processados
    let query = supabase
      .from("manuais_conteudo")
      .select("tipo_manual, conteudo_extraido, status")
      .eq("empreendimento_id", empreendimentoId)
      .eq("status", "concluido");

    if (tipoManual) {
      query = query.eq("tipo_manual", tipoManual);
    }

    const { data: manuais, error: manuaisError } = await query;

    if (manuaisError) {
      console.error("Erro ao buscar manuais:", manuaisError);
      throw manuaisError;
    }

    if (!manuais || manuais.length === 0) {
      return new Response(
        JSON.stringify({
          resposta: "Nenhum manual foi processado ainda para este empreendimento. Por favor, aguarde o processamento dos manuais ou faça upload de novos documentos.",
          referencias: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${manuais.length} manuais processados`);

    // Preparar contexto dos manuais
    const contextoManuais = manuais
      .map((m) => `=== Manual: ${m.tipo_manual.toUpperCase()} ===\n${m.conteudo_extraido}`)
      .join("\n\n");

    // Preparar prompt para IA
    const prompt = `Você é um assistente especializado em manuais de construção civil e empreendimentos imobiliários.

CONTEXTO DOS MANUAIS:
${contextoManuais}

PERGUNTA DO USUÁRIO:
${pergunta}

INSTRUÇÕES:
1. Analise cuidadosamente todo o conteúdo dos manuais fornecidos
2. Encontre informações relevantes que respondam à pergunta do usuário
3. Se encontrar informações relevantes, forneça uma resposta clara e detalhada
4. Cite especificamente qual manual contém a informação (proprietário, condomínio ou usuário)
5. Se a informação não estiver disponível nos manuais, diga claramente que não foi encontrada
6. Organize a resposta de forma estruturada e fácil de entender

Responda em português do Brasil de forma profissional e objetiva.`;

    console.log("Chamando IA para processar busca...");

    // Chamar Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro na API do Lovable AI:", errorText);
      throw new Error(`Erro na API do Lovable AI: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const resposta = aiData.choices[0].message.content;

    console.log("Resposta gerada com sucesso");

    return new Response(
      JSON.stringify({
        resposta,
        referencias: manuais.map(m => m.tipo_manual),
        total_manuais_consultados: manuais.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função buscar-manual:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar busca";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});