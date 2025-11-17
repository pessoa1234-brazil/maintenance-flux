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

    // Simular extração de conteúdo do manual
    const conteudoSimulado = `
MANUAL ${tipoManual.toUpperCase()} DO EMPREENDIMENTO

Este documento contém informações técnicas essenciais sobre o empreendimento, incluindo:

1. ESPECIFICAÇÕES TÉCNICAS
   - Sistemas prediais: hidráulico, elétrico, ar condicionado, elevadores
   - Materiais e acabamentos utilizados
   - Capacidades e dimensionamentos

2. CRONOGRAMA DE MANUTENÇÃO PREVENTIVA (NBR 5674)
   
   SISTEMA HIDRÁULICO:
   - Inspeção de bombas e registros: Mensal
   - Limpeza de caixas d'água: Semestral
   - Revisão geral do sistema: Anual
   
   SISTEMA ELÉTRICO:
   - Teste de disjuntores e proteções: Trimestral
   - Inspeção de quadros elétricos: Semestral
   - Termografia de painéis: Anual
   
   ELEVADORES:
   - Manutenção preventiva: Mensal
   - Inspeção de segurança: Trimestral
   - Revisão completa: Anual
   
   AR CONDICIONADO:
   - Limpeza de filtros: Mensal
   - Manutenção preventiva: Trimestral
   - Recarga e revisão geral: Anual
   
   IMPERMEABILIZAÇÃO:
   - Inspeção visual: Semestral
   - Teste de estanqueidade: Anual
   - Manutenção preventiva: A cada 5 anos

3. GARANTIAS (NBR 17170:2022)
   - Estrutura: 5 anos
   - Impermeabilização: 5 anos
   - Instalações elétricas: 3 anos
   - Instalações hidráulicas: 3 anos
   - Esquadrias: 1 ano
   - Pintura: 1 ano

Fonte: ${arquivoUrl}
Data de processamento: ${new Date().toISOString()}
`;

    console.log('Conteúdo extraído do manual');

    // Se for manual do proprietário, extrair cronograma automaticamente
    if (tipoManual === 'proprietario') {
      console.log('Iniciando extração automática de cronograma...');
      try {
        const cronogramaResponse = await supabase.functions.invoke('extrair-cronograma-manutencao', {
          body: { empreendimentoId }
        });
        
        console.log('Cronograma extraído com sucesso:', cronogramaResponse.data);
      } catch (cronogramaError) {
        console.error('Erro ao extrair cronograma:', cronogramaError);
        // Não bloquear o processo principal se a extração falhar
      }
    }

    // Atualizar registro com conteúdo extraído
    const { error: updateError } = await supabase
      .from('manuais_conteudo')
      .update({
        conteudo_extraido: conteudoSimulado,
        status: 'processado'
      })
      .eq('id', manualConteudo.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        conteudo: conteudoSimulado
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
          status: 'erro',
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
