import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, DollarSign, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";

interface SystemStats {
  totalUsers: number;
  totalEmpreendimentos: number;
  totalPrestadores: number;
  totalOS: number;
  osAbertas: number;
  osAndamento: number;
  osConcluidas: number;
  valorTotalServicos: number;
  mediaTempoResposta: number;
  taxaConclusao: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total de empreendimentos
      const { count: totalEmpreendimentos } = await supabase
        .from('empreendimentos')
        .select('*', { count: 'exact', head: true });

      // Total de prestadores
      const { count: totalPrestadores } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'prestador');

      // Estatísticas de OS
      const { data: osData } = await supabase
        .from('ordens_servico')
        .select('status, valor_final, tempo_resposta_horas');

      const totalOS = osData?.length || 0;
      const osAbertas = osData?.filter(os => os.status === 'A_FAZER').length || 0;
      const osAndamento = osData?.filter(os => os.status === 'EM_ANDAMENTO').length || 0;
      const osConcluidas = osData?.filter(os => os.status === 'CONCLUIDA').length || 0;

      const valorTotalServicos = osData?.reduce((acc, os) => {
        return acc + (os.valor_final ? parseFloat(os.valor_final as any) : 0);
      }, 0) || 0;

      const temposResposta = osData?.filter(os => os.tempo_resposta_horas !== null)
        .map(os => os.tempo_resposta_horas || 0) || [];
      
      const mediaTempoResposta = temposResposta.length > 0
        ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
        : 0;

      const taxaConclusao = totalOS > 0 ? (osConcluidas / totalOS) * 100 : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalEmpreendimentos: totalEmpreendimentos || 0,
        totalPrestadores: totalPrestadores || 0,
        totalOS,
        osAbertas,
        osAndamento,
        osConcluidas,
        valorTotalServicos,
        mediaTempoResposta,
        taxaConclusao
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando estatísticas...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empreendimentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmpreendimentos}</div>
            <p className="text-xs text-muted-foreground">Projetos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestadores</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrestadores}</div>
            <p className="text-xs text-muted-foreground">Ativos na plataforma</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
          <CardDescription>Visão geral das solicitações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold">{stats.totalOS}</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-yellow-500/10">
              <p className="text-sm text-muted-foreground">Abertas</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.osAbertas}</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-blue-500/10">
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-600">{stats.osAndamento}</p>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-500/10">
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <p className="text-3xl font-bold text-green-600">{stats.osConcluidas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.valorTotalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Em serviços realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaTempoResposta.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">De resposta dos prestadores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taxaConclusao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Serviços finalizados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
