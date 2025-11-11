import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, CheckCircle2, Star } from "lucide-react";

interface AnalyticsData {
  prestadoresPerformance: any[];
  tempoMedioResposta: number;
  tempoMedioConclusao: number;
  taxaConclusao: number;
  servicosPorTipo: any[];
  tendenciasMensais: any[];
}

export const DashboardAnalitico = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil para verificar empreendimento
      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      // Performance dos prestadores
      const { data: prestadores } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          nota_media,
          total_avaliacoes,
          ordens_servico!ordens_servico_prestador_id_fkey(
            id,
            status,
            tempo_resposta_horas,
            tempo_conclusao_dias
          )
        `)
        .gt("total_avaliacoes", 0)
        .order("nota_media", { ascending: false })
        .limit(10);

      const prestadoresPerformance = prestadores?.map((p: any) => {
        const osData = p.ordens_servico || [];
        const concluidas = osData.filter((os: any) => os.status === "CONCLUIDA").length;
        const total = osData.length;
        
        return {
          nome: p.full_name,
          nota: Number(p.nota_media).toFixed(1),
          avaliacoes: p.total_avaliacoes,
          taxaConclusao: total > 0 ? Math.round((concluidas / total) * 100) : 0,
          totalServicos: total
        };
      }) || [];

      // Estatísticas gerais
      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("status, tipo_servico, tempo_resposta_horas, tempo_conclusao_dias, created_at")
        .order("created_at", { ascending: false });

      const totalOS = osData?.length || 0;
      const concluidas = osData?.filter(os => os.status === "CONCLUIDA").length || 0;
      const taxaConclusao = totalOS > 0 ? (concluidas / totalOS) * 100 : 0;

      const temposResposta = osData?.filter(os => os.tempo_resposta_horas).map(os => os.tempo_resposta_horas) || [];
      const tempoMedioResposta = temposResposta.length > 0 
        ? temposResposta.reduce((sum, t) => sum + t, 0) / temposResposta.length 
        : 0;

      const temposConclusao = osData?.filter(os => os.tempo_conclusao_dias).map(os => os.tempo_conclusao_dias) || [];
      const tempoMedioConclusao = temposConclusao.length > 0
        ? temposConclusao.reduce((sum, t) => sum + t, 0) / temposConclusao.length
        : 0;

      // Serviços por tipo
      const tiposCount: any = {};
      osData?.forEach(os => {
        const tipo = os.tipo_servico || "servico_novo";
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
      });

      const servicosPorTipo = Object.entries(tiposCount).map(([tipo, count]) => ({
        tipo: tipo === "garantia" ? "Garantia" : 
              tipo === "manutencao_preventiva" ? "Manutenção" : "Novo",
        quantidade: count,
      }));

      // Tendências mensais (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const tendenciasMensais = osData
        ?.filter(os => new Date(os.created_at) >= sixMonthsAgo)
        .reduce((acc: any[], os) => {
          const month = new Date(os.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
          const existing = acc.find(item => item.mes === month);
          
          if (existing) {
            existing.total++;
            if (os.status === "CONCLUIDA") existing.concluidas++;
          } else {
            acc.push({
              mes: month,
              total: 1,
              concluidas: os.status === "CONCLUIDA" ? 1 : 0
            });
          }
          return acc;
        }, []) || [];

      setData({
        prestadoresPerformance,
        tempoMedioResposta: Math.round(tempoMedioResposta),
        tempoMedioConclusao: Math.round(tempoMedioConclusao),
        taxaConclusao: Math.round(taxaConclusao),
        servicosPorTipo,
        tendenciasMensais: tendenciasMensais.slice(-6)
      });
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Analítico</h2>
        <p className="text-muted-foreground">Performance e estatísticas do sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tempoMedioResposta}h</div>
            <p className="text-xs text-muted-foreground">Atribuição de prestador</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tempoMedioConclusao} dias</div>
            <p className="text-xs text-muted-foreground">Do início ao fim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{data.taxaConclusao}%</div>
            <p className="text-xs text-muted-foreground">Serviços finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance dos Prestadores */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Prestadores por Avaliação</CardTitle>
          <CardDescription>Ranking baseado em nota média e número de avaliações</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.prestadoresPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="nota" fill="#0088FE" name="Nota Média" />
              <Bar dataKey="taxaConclusao" fill="#00C49F" name="Taxa Conclusão %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tendências Mensais */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências Mensais</CardTitle>
            <CardDescription>Evolução de serviços nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.tendenciasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                <Line type="monotone" dataKey="concluidas" stroke="#82ca9d" name="Concluídas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Serviços por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
            <CardDescription>Proporção dos tipos de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.servicosPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {data.servicosPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
