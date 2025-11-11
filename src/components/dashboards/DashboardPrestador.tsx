import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  orcamentosEnviados: number;
  servicosEmAndamento: number;
  servicosConcluidos: number;
  valorRecebido: number;
  oportunidades: number;
}

export const DashboardPrestador = () => {
  const [stats, setStats] = useState<Stats>({
    orcamentosEnviados: 0,
    servicosEmAndamento: 0,
    servicosConcluidos: 0,
    valorRecebido: 0,
    oportunidades: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Orçamentos enviados
      const { count: orcamentosCount } = await supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("prestador_id", user.id);

      // Serviços em andamento (OS com prestador atribuído)
      const { count: andamentoCount } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("prestador_id", user.id)
        .eq("status", "EM_ANDAMENTO");

      // Serviços concluídos
      const { count: concluidosCount } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("prestador_id", user.id)
        .eq("status", "CONCLUIDA");

      // Valor recebido (pagamentos pagos)
      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("valor, ordens_servico!inner(prestador_id)")
        .eq("ordens_servico.prestador_id", user.id)
        .eq("status", "pago");

      const valorTotal = pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0;

      // Oportunidades (OS sem orçamento do prestador)
      const { data: osDisponiveis } = await supabase
        .from("ordens_servico")
        .select("id")
        .eq("status", "A_FAZER")
        .is("prestador_id", null);

      let oportunidadesCount = 0;
      if (osDisponiveis) {
        for (const os of osDisponiveis) {
          const { count } = await supabase
            .from("orcamentos")
            .select("*", { count: "exact", head: true })
            .eq("os_id", os.id)
            .eq("prestador_id", user.id);

          if (count === 0) {
            oportunidadesCount++;
          }
        }
      }

      setStats({
        orcamentosEnviados: orcamentosCount || 0,
        servicosEmAndamento: andamentoCount || 0,
        servicosConcluidos: concluidosCount || 0,
        valorRecebido: valorTotal,
        oportunidades: oportunidadesCount,
      });
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
        <h2 className="text-3xl font-bold">Dashboard Prestador</h2>
        <p className="text-muted-foreground">
          Acompanhe suas oportunidades e serviços em execução
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Oportunidades
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.oportunidades}</div>
            <p className="text-xs text-muted-foreground">
              OS disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orçamentos
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orcamentosEnviados}</div>
            <p className="text-xs text-muted-foreground">
              Total enviados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.servicosEmAndamento}</div>
            <p className="text-xs text-muted-foreground">
              Serviços ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.servicosConcluidos}</div>
            <p className="text-xs text-muted-foreground">
              Finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.valorRecebido)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total recebido
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Obrigações NBR 5674</CardTitle>
          <CardDescription>
            Documentação obrigatória para preservação de garantias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Fotos Antes e Depois</p>
              <p className="text-sm text-muted-foreground">
                Obrigatório para comprovar execução
              </p>
            </div>
            <Badge variant="destructive" className="ml-auto">Obrigatório</Badge>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Checklist de Serviço</p>
              <p className="text-sm text-muted-foreground">
                Validação técnica conforme manual
              </p>
            </div>
            <Badge variant="destructive" className="ml-auto">Obrigatório</Badge>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Descrição Detalhada</p>
              <p className="text-sm text-muted-foreground">
                Trabalhos e materiais utilizados
              </p>
            </div>
            <Badge variant="destructive" className="ml-auto">Obrigatório</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
