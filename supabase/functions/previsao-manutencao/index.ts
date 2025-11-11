import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { empreendimentoId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar histórico de ordens de serviço
    const { data: ordensServico, error: osError } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        unidade:unidades!inner(
          empreendimento_id
        )
      `)
      .eq('unidade.empreendimento_id', empreendimentoId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (osError) throw osError;

    // Buscar dados do empreendimento
    const { data: empreendimento } = await supabase
      .from('empreendimentos')
      .select('*')
      .eq('id', empreendimentoId)
      .single();

    // Preparar dados para análise
    const historicoAnalise = ordensServico?.map(os => ({
      tipo_servico: os.tipo_servico,
      sistema_predial: os.sistema_predial,
      status: os.status,
      data_solicitacao: os.data_solicitacao,
      data_conclusao: os.data_conclusao,
      tempo_conclusao_dias: os.tempo_conclusao_dias,
      valor_final: os.valor_final,
      descricao: os.descricao
    }));

    const anosDesdeEntrega = empreendimento?.data_entrega 
      ? new Date().getFullYear() - new Date(empreendimento.data_entrega).getFullYear()
      : 0;

    // Chamar Lovable AI para análise preditiva
    const prompt = `Você é um especialista em manutenção predial seguindo normas ABNT NBR 5674 e NBR 17170.

Analise o histórico de manutenção abaixo e forneça previsões de manutenções necessárias:

DADOS DO EMPREENDIMENTO:
- Anos desde a entrega: ${anosDesdeEntrega}
- Total de unidades: ${empreendimento?.total_unidades || 'N/A'}
- Número de andares: ${empreendimento?.numero_andares || 'N/A'}

HISTÓRICO DE SERVIÇOS (últimos ${ordensServico?.length || 0} registros):
${JSON.stringify(historicoAnalise, null, 2)}

Com base neste histórico, identifique:
1. Padrões de falhas recorrentes
2. Sistemas prediais que requerem atenção preventiva
3. Manutenções preventivas urgentes recomendadas pela NBR 5674
4. Estimativa de custos baseada no histórico
5. Prioridade de cada manutenção (Alta, Média, Baixa)

Retorne uma análise estruturada e acionável.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em manutenção predial e análise preditiva. Forneça análises detalhadas e práticas baseadas em dados históricos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione fundos ao workspace Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const previsao = aiData.choices[0].message.content;

    console.log('Previsão gerada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        previsao,
        totalServicos: ordensServico?.length || 0,
        anosOperacao: anosDesdeEntrega
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na previsão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
