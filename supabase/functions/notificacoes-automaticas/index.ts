import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔍 Verificando prazos de garantia e manutenções...");

    const hoje = new Date();
    const daquiA7Dias = new Date(hoje);
    daquiA7Dias.setDate(daquiA7Dias.getDate() + 7);

    // Buscar OS com prazo próximo (7 dias)
    const { data: osComPrazo, error: osError } = await supabase
      .from("ordens_servico")
      .select(`
        id,
        titulo,
        tipo_servico,
        data_limite_atendimento,
        prazo_atendimento_dias,
        solicitante_id,
        profiles!ordens_servico_solicitante_id_fkey(email, full_name)
      `)
      .not("data_limite_atendimento", "is", null)
      .lte("data_limite_atendimento", daquiA7Dias.toISOString().split("T")[0])
      .in("status", ["A_FAZER", "EM_ANDAMENTO"]);

    if (osError) throw osError;

    const notificacoes = [];

      for (const os of osComPrazo || []) {
        const dataLimite = new Date(os.data_limite_atendimento);
        const diasRestantes = Math.ceil(
          (dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        let urgencia = "normal";
        let mensagem = "";

        if (diasRestantes < 0) {
          urgencia = "critica";
          mensagem = `ATRASADA: A OS "${os.titulo}" está ${Math.abs(diasRestantes)} dias atrasada!`;
        } else if (diasRestantes <= 2 && os.tipo_servico === "garantia") {
          urgencia = "alta";
          mensagem = `URGENTE: A OS de garantia "${os.titulo}" vence em ${diasRestantes} dias!`;
        } else if (diasRestantes <= 7) {
          urgencia = "media";
          mensagem = `ATENÇÃO: A OS "${os.titulo}" vence em ${diasRestantes} dias.`;
        }

        if (mensagem) {
          const profile = Array.isArray(os.profiles) ? os.profiles[0] : os.profiles;
          notificacoes.push({
            os_id: os.id,
            titulo: os.titulo,
            tipo_servico: os.tipo_servico,
            dias_restantes: diasRestantes,
            urgencia,
            mensagem,
            usuario_email: profile?.email,
            usuario_nome: profile?.full_name,
          });

          console.log(`📢 ${urgencia.toUpperCase()}: ${mensagem}`);
        }
      }

    // Verificar manutenções preventivas que devem ser realizadas
    // Buscar empreendimentos com data de entrega
    const { data: empreendimentos, error: empError } = await supabase
      .from("empreendimentos")
      .select("id, nome, data_entrega, data_habite_se");

    if (empError) throw empError;

    const alertasManutencao = [];

    for (const emp of empreendimentos || []) {
      const dataReferencia = new Date(emp.data_habite_se || emp.data_entrega);
      const mesesDecorridos =
        (hoje.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24 * 30);

      // Alerta se passou 6 meses sem manutenção preventiva registrada
      if (mesesDecorridos >= 6) {
        const { data: manutencoesRecentes, error: manutError } = await supabase
          .from("ordens_servico")
          .select("id, unidades!inner(empreendimento_id)")
          .eq("unidades.empreendimento_id", emp.id)
          .eq("tipo_servico", "manutencao_preventiva")
          .gte("created_at", new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString());

        if (manutError) throw manutError;

        if (!manutencoesRecentes || manutencoesRecentes.length === 0) {
          alertasManutencao.push({
            empreendimento_id: emp.id,
            nome_empreendimento: emp.nome,
            mensagem: `Empreendimento "${emp.nome}" sem manutenção preventiva há mais de 6 meses. Garantias podem ser comprometidas!`,
            urgencia: "alta",
          });

          console.log(`⚠️  MANUTENÇÃO PREVENTIVA NECESSÁRIA: ${emp.nome}`);
        }
      }
    }

    const resultado = {
      timestamp: hoje.toISOString(),
      total_notificacoes: notificacoes.length,
      total_alertas_manutencao: alertasManutencao.length,
      notificacoes_por_urgencia: {
        critica: notificacoes.filter((n) => n.urgencia === "critica").length,
        alta: notificacoes.filter((n) => n.urgencia === "alta").length,
        media: notificacoes.filter((n) => n.urgencia === "media").length,
      },
      notificacoes,
      alertas_manutencao: alertasManutencao,
    };

    console.log("✅ Verificação concluída:", resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar notificações:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
