import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("Verificando OS próximas do vencimento de SLA...");

    // Buscar todas as OS em andamento ou abertas
    const { data: osData, error: osError } = await supabase
      .from("ordens_servico")
      .select(`
        *,
        profiles!ordens_servico_solicitante_id_fkey(full_name, email),
        sla_configuracao!inner(*)
      `)
      .in("status", ["A_FAZER", "EM_ANDAMENTO"])
      .not("data_limite_atendimento", "is", null);

    if (osError) throw osError;

    if (!osData || osData.length === 0) {
      console.log("Nenhuma OS encontrada para verificação");
      return new Response(JSON.stringify({ message: "Sem OS para verificar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const now = new Date();
    const alertas: any[] = [];

    for (const os of osData) {
      if (!os.data_limite_atendimento) continue;

      const dataLimite = new Date(os.data_limite_atendimento);
      const horasRestantes = (dataLimite.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Buscar configuração de SLA
      const { data: slaConfig } = await supabase
        .from("sla_configuracao")
        .select("*")
        .eq("tipo_servico", os.tipo_servico)
        .limit(1)
        .single();

      if (!slaConfig) continue;

      const prazoTotal = slaConfig.prazo_conclusao_dias * 24; // em horas
      const limiteAlerta = prazoTotal * (slaConfig.alerta_percentual / 100);
      const horasConsumidas = prazoTotal - horasRestantes;

      // Se consumiu mais que o percentual configurado, enviar alerta
      if (horasConsumidas >= limiteAlerta && horasRestantes > 0) {
        alertas.push({
          os_id: os.id,
          titulo: os.titulo,
          email: os.profiles.email,
          nome: os.profiles.full_name,
          horas_restantes: Math.round(horasRestantes),
          percentual_consumido: Math.round((horasConsumidas / prazoTotal) * 100)
        });
      }

      // Se já venceu
      if (horasRestantes <= 0) {
        alertas.push({
          os_id: os.id,
          titulo: os.titulo,
          email: os.profiles.email,
          nome: os.profiles.full_name,
          horas_restantes: 0,
          percentual_consumido: 100,
          vencido: true
        });
      }
    }

    console.log(`Encontrados ${alertas.length} alertas para enviar`);

    // Enviar emails de alerta
    for (const alerta of alertas) {
      const assunto = alerta.vencido 
        ? `⚠️ SLA VENCIDO - OS #${alerta.os_id.substring(0, 8)}`
        : `🔔 Alerta de SLA - OS #${alerta.os_id.substring(0, 8)}`;

      const mensagem = alerta.vencido
        ? `O prazo de atendimento para a OS "${alerta.titulo}" já foi excedido. Por favor, tome providências imediatas.`
        : `A OS "${alerta.titulo}" está próxima do prazo limite (${alerta.horas_restantes}h restantes - ${alerta.percentual_consumido}% do prazo consumido).`;

      try {
        await resend.emails.send({
          from: "Manutenção360 <onboarding@resend.dev>",
          to: [alerta.email],
          subject: assunto,
          html: `
            <h2>${assunto}</h2>
            <p>Olá ${alerta.nome},</p>
            <p>${mensagem}</p>
            <hr>
            <p><strong>Ordem de Serviço:</strong> ${alerta.titulo}</p>
            <p><strong>ID:</strong> ${alerta.os_id.substring(0, 8)}</p>
            <p><strong>Tempo restante:</strong> ${alerta.horas_restantes} horas</p>
            <p><strong>Prazo consumido:</strong> ${alerta.percentual_consumido}%</p>
            <hr>
            <p>Acesse a plataforma para mais detalhes.</p>
          `,
        });
        console.log(`Email enviado para ${alerta.email}`);
      } catch (emailError) {
        console.error(`Erro ao enviar email para ${alerta.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processados ${alertas.length} alertas`,
        alertas 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro no alertas-sla:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
