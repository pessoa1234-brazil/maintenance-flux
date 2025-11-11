import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, DollarSign, TrendingUp, Clock, MapPin, Award } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  empreendimentosPorEstado: { estado: string; total: number }[];
  roleDistribution: { role: string; count: number }[];
  topPrestadores: { nome: string; nota: number; avaliacoes: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

      // Distribuição geográfica de empreendimentos
      const { data: empreendimentosData } = await supabase
        .from('empreendimentos')
        .select('estado');

      const estadosMap = new Map<string, number>();
      empreendimentosData?.forEach(emp => {
        estadosMap.set(emp.estado, (estadosMap.get(emp.estado) || 0) + 1);
      });

      const empreendimentosPorEstado = Array.from(estadosMap.entries())
        .map(([estado, total]) => ({ estado, total }))
        .sort((a, b) => b.total - a.total);

      // Distribuição de roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role');

      const rolesMap = new Map<string, number>();
      rolesData?.forEach(r => {
        rolesMap.set(r.role, (rolesMap.get(r.role) || 0) + 1);
      });

      const roleDistribution = Array.from(rolesMap.entries())
        .map(([role, count]) => ({ role, count }));

      // Top prestadores por avaliação
      const { data: prestadoresData } = await supabase
        .from('profiles')
        .select('full_name, nota_media, total_avaliacoes')
        .gt('total_avaliacoes', 0)
        .order('nota_media', { ascending: false })
        .limit(10);

      const topPrestadores = prestadoresData?.map(p => ({
        nome: p.full_name,
        nota: p.nota_media || 0,
        avaliacoes: p.total_avaliacoes || 0
      })) || [];

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
        taxaConclusao,
        empreendimentosPorEstado,
        roleDistribution,
        topPrestadores
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

      {/* Gráficos de Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Distribuição Geográfica</CardTitle>
            </div>
            <CardDescription>Empreendimentos por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.empreendimentosPorEstado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#0088FE" name="Empreendimentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Distribuição de Usuários</CardTitle>
            </div>
            <CardDescription>Por tipo de perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.roleDistribution}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.role}: ${entry.count}`}
                >
                  {stats.roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Prestadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Top Prestadores</CardTitle>
          </div>
          <CardDescription>Ranking por avaliação</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.topPrestadores} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5]} />
              <YAxis dataKey="nome" type="category" width={150} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = typeof payload[0].value === 'number' ? payload[0].value : 0;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.nome}</p>
                        <p className="text-sm">⭐ {value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].payload.avaliacoes} avaliações
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="nota" fill="#00C49F" name="Nota Média" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
