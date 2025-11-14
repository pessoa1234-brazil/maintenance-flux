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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let manualConteudo: any = null;

  try {
    const { empreendimentoId, tipoManual, arquivoUrl } = await req.json();

    console.log('Processando manual:', { empreendimentoId, tipoManual, arquivoUrl });

    // Criar registro na tabela manuais_conteudo
    const { data: conteudoData, error: insertError } = await supabase
      .from('manuais_conteudo')
      .insert({
        empreendimento_id: empreendimentoId,
        tipo_manual: tipoManual,
        arquivo_url: arquivoUrl,
        status: 'processando'
      })
      .select()
      .single();

    if (insertError) throw insertError;
    manualConteudo = conteudoData;

    // Download do arquivo do storage
    // URL format: https://PROJECT_ID.supabase.co/storage/v1/object/public/BUCKET/PATH
    const urlParts = arquivoUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      throw new Error('URL do arquivo inválida');
    }
    
    // Parse bucket and path correctly
    const afterPublic = urlParts[1]; // e.g., "manuais/folder/file.pdf"
    const firstSlashIndex = afterPublic.indexOf('/');
    if (firstSlashIndex === -1) {
      throw new Error('URL do arquivo inválida - caminho não encontrado');
    }
    
    const bucket = afterPublic.substring(0, firstSlashIndex); // "manuais"
    const path = afterPublic.substring(firstSlashIndex + 1); // "folder/file.pdf"

    console.log('Baixando arquivo:', { bucket, path, url: arquivoUrl });

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(path);

    if (downloadError) throw downloadError;

    // Converter arquivo para base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Preparar prompt para IA
    const prompt = `
Você é um especialista em análise de manuais técnicos de construção civil.
Analise o documento fornecido e extraia as seguintes informações de forma estruturada:

1. Especificações Técnicas principais
2. Sistemas prediais e suas características
3. Prazos de garantia mencionados
4. Procedimentos de manutenção recomendados
5. Contatos de fornecedores e responsáveis técnicos
6. Normas técnicas referenciadas

Organize as informações de forma clara e objetiva, mantendo referências a páginas quando disponível.
`;

    console.log('Enviando para IA...');

    // Chamar Lovable AI
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
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na IA:', errorText);
      throw new Error(`AI gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const conteudoExtraido = aiResult.choices[0].message.content;

    console.log('Conteúdo extraído pela IA');

    // Atualizar registro com conteúdo extraído
    const { error: updateError } = await supabase
      .from('manuais_conteudo')
      .update({
        conteudo_extraido: conteudoExtraido,
        status: 'concluido'
      })
      .eq('id', manualConteudo.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        conteudo: conteudoExtraido
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao processar manual:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Atualizar registro com erro
    if (manualConteudo?.id) {
      await supabase
        .from('manuais_conteudo')
        .update({
          status: 'processando',
          erro_mensagem: errorMessage
        })
        .eq('id', manualConteudo.id);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
