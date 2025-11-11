import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificacaoEmail {
  destinatario: string;
  nome: string;
  assunto: string;
  mensagem: string;
  urgencia: string;
  tipo: "prazo" | "garantia";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notificacoes }: { notificacoes: NotificacaoEmail[] } = await req.json();

    console.log(`📧 Processando ${notificacoes.length} notificações por email...`);

    const resultados = [];

    for (const notif of notificacoes) {
      try {
        const corUrgencia = 
          notif.urgencia === "critica" ? "#DC2626" :
          notif.urgencia === "alta" ? "#EA580C" :
          "#F59E0B";

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: ${corUrgencia}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .urgencia { display: inline-block; padding: 8px 16px; background-color: ${corUrgencia}; color: white; border-radius: 4px; font-weight: bold; margin-bottom: 20px; }
                .mensagem { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${corUrgencia}; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Notificação de ${notif.tipo === "prazo" ? "Prazo" : "Garantia"}</h1>
                </div>
                <div class="content">
                  <p>Olá, <strong>${notif.nome}</strong>!</p>
                  
                  <div class="urgencia">
                    Urgência: ${notif.urgencia.toUpperCase()}
                  </div>
                  
                  <div class="mensagem">
                    <p><strong>${notif.mensagem}</strong></p>
                  </div>
                  
                  <p>Este é um alerta automático do sistema Manutenção360 para garantir que os prazos e garantias sejam respeitados conforme normas ABNT NBR 17170:2022 e NBR 5674.</p>
                  
                  ${notif.tipo === "garantia" ? `
                    <p><strong>⚠️ IMPORTANTE:</strong> Serviços de garantia possuem prazos legais obrigatórios:</p>
                    <ul>
                      <li>Garantias legais (segurança): <strong>48 horas</strong></li>
                      <li>Garantias oferecidas: <strong>15 dias</strong></li>
                    </ul>
                  ` : ""}
                  
                  <a href="${Deno.env.get("VITE_SUPABASE_URL")}" class="button">
                    Acessar Sistema
                  </a>
                  
                  <div class="footer">
                    <p>Este é um email automático. Por favor, não responda.</p>
                    <p>Manutenção360 - Sistema de Gestão de Garantias e Manutenção Predial</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          },
          body: JSON.stringify({
            from: "Manutenção360 <onboarding@resend.dev>",
            to: [notif.destinatario],
            subject: notif.assunto,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`HTTP ${emailResponse.status}: ${await emailResponse.text()}`);
        }

        const emailData = await emailResponse.json();
        console.log(`✅ Email enviado para ${notif.destinatario}:`, emailData);
        
        resultados.push({
          destinatario: notif.destinatario,
          sucesso: true,
          id: emailData.id,
        });
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email para ${notif.destinatario}:`, error);
        resultados.push({
          destinatario: notif.destinatario,
          sucesso: false,
          erro: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        total: notificacoes.length,
        enviados: resultados.filter((r) => r.sucesso).length,
        falhas: resultados.filter((r) => !r.sucesso).length,
        detalhes: resultados,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao processar notificações:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
