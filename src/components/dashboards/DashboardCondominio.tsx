import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarioManutencao } from "@/components/scheduling/CalendarioManutencao";
import { Shield, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Stats {
  osAbertas: number;
  osEmAndamento: number;
  osConcluidas: number;
  garantiasDisponiveis: number;
  manutencoesAtrasadas: number;
}

interface AlertaPrazo {
  id: string;
  titulo: string;
  data_limite: string;
  dias_restantes: number;
  tipo_servico: string;
}

export const DashboardCondominio = () => {
  const [stats, setStats] = useState<Stats>({
    osAbertas: 0,
    osEmAndamento: 0,
    osConcluidas: 0,
    garantiasDisponiveis: 0,
    manutencoesAtrasadas: 0,
  });
  const [alertas, setAlertas] = useState<AlertaPrazo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil com empreendimento vinculado
      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id) {
        setLoading(false);
        return;
      }

      // OS do usuário
      const { count: abertasCount } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("solicitante_id", user.id)
        .eq("status", "A_FAZER");

      const { count: andamentoCount } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("solicitante_id", user.id)
        .eq("status", "EM_ANDAMENTO");

      const { count: concluidasCount } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("solicitante_id", user.id)
        .eq("status", "CONCLUIDA");

      // Garantias disponíveis (sistemas com garantia ativa)
      const { data: empreendimento } = await supabase
        .from("empreendimentos")
        .select("data_entrega")
        .eq("id", profile.empreendimento_id)
        .single();

      let garantiasDisponiveis = 0;
      if (empreendimento) {
        const dataEntrega = new Date(empreendimento.data_entrega);
        const hoje = new Date();
        const anosDecorridos = (hoje.getTime() - dataEntrega.getTime()) / (1000 * 60 * 60 * 24 * 365);

        // Contar quantos sistemas ainda têm garantia ativa
        const { count } = await supabase
          .from("garantias_nbr_17170")
          .select("*", { count: "exact", head: true })
          .gte("prazo_anos", Math.ceil(anosDecorridos));

        garantiasDisponiveis = count || 0;
      }

      // OS com prazo próximo ou atrasado
      const { data: osComPrazo } = await supabase
        .from("ordens_servico")
        .select("id, titulo, data_limite_atendimento, tipo_servico")
        .eq("solicitante_id", user.id)
        .not("data_limite_atendimento", "is", null)
        .in("status", ["A_FAZER", "EM_ANDAMENTO"])
        .order("data_limite_atendimento", { ascending: true });

      const alertasPrazo: AlertaPrazo[] = [];
      const hoje = new Date();
      let atrasadas = 0;

      osComPrazo?.forEach((os) => {
        const dataLimite = new Date(os.data_limite_atendimento!);
        const diasRestantes = Math.ceil((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
          atrasadas++;
        }

        if (diasRestantes <= 7) {
          alertasPrazo.push({
            id: os.id,
            titulo: os.titulo,
            data_limite: os.data_limite_atendimento!,
            dias_restantes: diasRestantes,
            tipo_servico: os.tipo_servico || "servico_novo",
          });
        }
      });

      setStats({
        osAbertas: abertasCount || 0,
        osEmAndamento: andamentoCount || 0,
        osConcluidas: concluidasCount || 0,
        garantiasDisponiveis,
        manutencoesAtrasadas: atrasadas,
      });

      setAlertas(alertasPrazo);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Condomínio</h2>
        <p className="text-muted-foreground">
          Gerencie suas solicitações e acompanhe garantias
        </p>
      </div>

      {alertas.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Atenção: {alertas.length} OS com prazo próximo ou vencido</p>
            <div className="space-y-1">
              {alertas.map((alerta) => (
                <p key={alerta.id} className="text-sm">
                  • {alerta.titulo} - {alerta.dias_restantes < 0 ? `Atrasada ${Math.abs(alerta.dias_restantes)} dias` : `${alerta.dias_restantes} dias restantes`}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              OS Abertas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.osAbertas}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Andamento
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.osEmAndamento}</div>
            <p className="text-xs text-muted-foreground">
              Sendo executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.osConcluidas}</div>
            <p className="text-xs text-muted-foreground">
              Total finalizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Garantias
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.garantiasDisponiveis}</div>
            <p className="text-xs text-muted-foreground">
              Sistemas cobertos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atrasadas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.manutencoesAtrasadas}</div>
            <p className="text-xs text-muted-foreground">
              Prazo vencido
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conformidade NBR 5674</CardTitle>
          <CardDescription>
            Status de manutenção preventiva para preservação de garantias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">Manutenções Preventivas</p>
              <p className="text-sm text-muted-foreground">
                Essenciais para manter garantias válidas
              </p>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Ver Relatório
            </Button>
          </div>

          {stats.manutencoesAtrasadas > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Existem manutenções atrasadas que podem comprometer suas garantias.
                Solicite os serviços o quanto antes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <CalendarioManutencao />
    </div>
  );
};
