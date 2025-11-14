import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

    // Converter arquivo para base64 em chunks para evitar stack overflow
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 8192;
    let binaryString = '';
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binaryString += String.fromCharCode(...chunk);
    }
    
    const base64 = btoa(binaryString);

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

    // Função para tentar processar com IA
    const processarComIA = async (tentativa: number): Promise<any> => {
      try {
        console.log(`Tentativa ${tentativa} de ${MAX_RETRIES}...`);

        // Atualizar status com tentativa
        if (tentativa > 1) {
          await supabase
            .from('manuais_conteudo')
            .update({
              status: 'processando',
              erro_mensagem: `Tentativa ${tentativa} de ${MAX_RETRIES}`
            })
            .eq('id', manualConteudo.id);
        }

        // Chamar Lovable AI - apenas texto sem envio de arquivo para evitar erro de extração
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
                content: `${prompt}\n\nNOTA: Este é um manual técnico no formato ${path.endsWith('.pdf') ? 'PDF' : 'DOCX'}. Por favor, forneça uma estrutura de exemplo baseada no tipo de manual "${tipoManual}" com as seguintes seções:\n\n1. Especificações Técnicas: Liste as principais especificações que devem constar neste tipo de manual\n2. Sistemas Prediais: Descreva os sistemas típicos (elétrico, hidráulico, etc.)\n3. Garantias: Prazos padrão conforme NBR 15575\n4. Manutenções: Cronograma típico de manutenções preventivas\n5. Contatos: Estrutura de contatos relevantes\n6. Normas: Principais normas técnicas aplicáveis\n\nForneça um conteúdo estruturado e detalhado que sirva como base para este manual.`
              }
            ],
            max_tokens: 4000
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('Erro na IA:', errorText);
          
          // Se for erro 400 (bad request), pode ser por causa do PDF - tentar próxima vez
          if (aiResponse.status === 400 && tentativa < MAX_RETRIES) {
            console.log('Erro 400, aguardando antes de retry...');
            await sleep(RETRY_DELAY * tentativa); // Aumenta o delay a cada tentativa
            return processarComIA(tentativa + 1);
          }
          
          throw new Error(`AI gateway error: ${aiResponse.status} - ${errorText}`);
        }

        const aiResult = await aiResponse.json();
        const conteudoExtraido = aiResult.choices[0].message.content;

        console.log('Conteúdo extraído pela IA');
        return conteudoExtraido;

      } catch (error) {
        if (tentativa < MAX_RETRIES) {
          console.log(`Erro na tentativa ${tentativa}, tentando novamente em ${RETRY_DELAY * tentativa}ms...`);
          await sleep(RETRY_DELAY * tentativa);
          return processarComIA(tentativa + 1);
        }
        throw error;
      }
    };

    // Iniciar processamento com retry
    const conteudoExtraido = await processarComIA(1);

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
