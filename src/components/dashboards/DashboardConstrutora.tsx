import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalEmpreendimentos: number;
  totalOS: number;
  garantiasAtivas: number;
  osPendentes: number;
}

export const DashboardConstrutora = () => {
  const [stats, setStats] = useState<Stats>({
    totalEmpreendimentos: 0,
    totalOS: 0,
    garantiasAtivas: 0,
    osPendentes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Total de empreendimentos
      const { count: empCount } = await supabase
        .from("empreendimentos")
        .select("*", { count: "exact", head: true })
        .eq("construtora_id", user.id);

      // Total de OS relacionadas aos empreendimentos
      const { data: empreendimentos } = await supabase
        .from("empreendimentos")
        .select("id")
        .eq("construtora_id", user.id);

      const empIds = empreendimentos?.map((e) => e.id) || [];

      // Contar OS dos empreendimentos
      const { count: osCount } = await supabase
        .from("ordens_servico")
        .select("*, unidades!inner(empreendimento_id)", { count: "exact", head: true })
        .in("unidades.empreendimento_id", empIds);

      // Contar garantias ativas (tipo_servico = 'garantia')
      const { count: garantiasCount } = await supabase
        .from("ordens_servico")
        .select("*, unidades!inner(empreendimento_id)", { count: "exact", head: true })
        .eq("tipo_servico", "garantia")
        .in("unidades.empreendimento_id", empIds);

      // OS pendentes
      const { count: pendentesCount } = await supabase
        .from("ordens_servico")
        .select("*, unidades!inner(empreendimento_id)", { count: "exact", head: true })
        .in("status", ["A_FAZER", "EM_ANDAMENTO"])
        .in("unidades.empreendimento_id", empIds);

      setStats({
        totalEmpreendimentos: empCount || 0,
        totalOS: osCount || 0,
        garantiasAtivas: garantiasCount || 0,
        osPendentes: pendentesCount || 0,
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
        <h2 className="text-3xl font-bold">Dashboard Construtora</h2>
        <p className="text-muted-foreground">
          Visão geral dos seus empreendimentos e garantias
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empreendimentos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmpreendimentos}</div>
            <p className="text-xs text-muted-foreground">
              Total cadastrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Garantias Ativas
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.garantiasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              Solicitações de garantia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              OS Pendentes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.osPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de OS
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOS}</div>
            <p className="text-xs text-muted-foreground">
              Todas as solicitações
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prazos de Garantia NBR 17170:2022</CardTitle>
          <CardDescription>
            Prazos de atendimento obrigatórios por tipo de garantia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold">Garantias Legais</p>
                <p className="text-sm text-muted-foreground">
                  Estrutura, impermeabilização, segurança
                </p>
              </div>
            </div>
            <Badge variant="destructive">48 horas</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Garantias Oferecidas</p>
                <p className="text-sm text-muted-foreground">
                  Instalações, acabamentos, sistemas
                </p>
              </div>
            </div>
            <Badge variant="secondary">15 dias</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">Manutenção Preventiva</p>
                <p className="text-sm text-muted-foreground">
                  NBR 5674 - Preservação de garantias
                </p>
              </div>
            </div>
            <Badge variant="outline">30 dias</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
