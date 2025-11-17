import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { empreendimentoId } = await req.json();

    if (!empreendimentoId) {
      throw new Error("empreendimentoId é obrigatório");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar manuais do empreendimento
    const { data: manuais, error: manuaisError } = await supabase
      .from("manuais_conteudo")
      .select("*")
      .eq("empreendimento_id", empreendimentoId)
      .eq("tipo_manual", "proprietario")
      .eq("status", "processado");

    if (manuaisError) throw manuaisError;

    if (!manuais || manuais.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nenhum manual do proprietário processado encontrado para este empreendimento" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concatenar conteúdo dos manuais
    const conteudoManual = manuais
      .map(m => m.conteudo_extraido)
      .filter(Boolean)
      .join("\n\n");

    if (!conteudoManual) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Conteúdo dos manuais não disponível" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chamar Lovable AI para extrair cronograma
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
            role: "system",
            content: `Você é um especialista em manutenção predial e normas ABNT NBR 5674 e NBR 17170:2022.
Extraia do manual do proprietário todas as informações sobre cronogramas de manutenção preventiva.
Identifique:
- Sistema predial (ex: hidráulico, elétrico, elevador, etc)
- Tipo de manutenção
- Periodicidade (mensal, trimestral, semestral, anual, etc)
- Descrição da atividade`
          },
          {
            role: "user",
            content: `Analise o seguinte manual do proprietário e extraia o cronograma de manutenção preventiva:\n\n${conteudoManual.substring(0, 50000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extrair_cronograma",
              description: "Extrai o cronograma de manutenção preventiva do manual",
              parameters: {
                type: "object",
                properties: {
                  manutencoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sistema_predial: { 
                          type: "string",
                          description: "Sistema predial (ex: Hidráulico, Elétrico, Elevadores)"
                        },
                        atividade: { 
                          type: "string",
                          description: "Descrição da atividade de manutenção"
                        },
                        periodicidade: { 
                          type: "string",
                          description: "Periodicidade (ex: Mensal, Trimestral, Semestral, Anual)"
                        },
                        tipo: {
                          type: "string",
                          description: "Tipo de manutenção (ex: Preventiva, Preditiva)"
                        }
                      },
                      required: ["sistema_predial", "atividade", "periodicidade"]
                    }
                  }
                },
                required: ["manutencoes"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extrair_cronograma" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`Erro na API Lovable: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    
    // Extrair o cronograma da resposta da AI
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall || !toolCall.function.arguments) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "IA não conseguiu extrair cronograma estruturado" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cronograma = JSON.parse(toolCall.function.arguments);

    if (!cronograma.manutencoes || cronograma.manutencoes.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nenhum cronograma de manutenção encontrado no manual" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar no banco de dados
    const dadosParaSalvar = cronograma.manutencoes.map((item: any) => ({
      empreendimento_id: empreendimentoId,
      tipo_manual: 'proprietario',
      categoria: 'cronograma_manutencao',
      subcategoria: item.sistema_predial,
      chave: item.atividade,
      valor: item.periodicidade,
      metadata: {
        tipo: item.tipo || 'Preventiva',
        sistema_predial: item.sistema_predial,
        periodicidade: item.periodicidade
      }
    }));

    const { error: insertError } = await supabase
      .from('manual_dados_estruturados')
      .upsert(dadosParaSalvar, {
        onConflict: 'empreendimento_id,tipo_manual,categoria,chave',
        ignoreDuplicates: false
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true,
        cronograma: cronograma.manutencoes,
        total: cronograma.manutencoes.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao extrair cronograma:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
