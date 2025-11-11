import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BIData {
  receitaPrevista: number;
  receitaRealizada: number;
  rentabilidadePorTipo: any[];
  previsaoDemanda: any[];
  tendenciaReceita: any[];
}

export const DashboardBI = () => {
  const [data, setData] = useState<BIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBIData();
  }, []);

  const loadBIData = async () => {
    try {
      // Buscar todas as OS e seus pagamentos
      const { data: osData } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          pagamentos(*)
        `);

      if (!osData) return;

      // Calcular receita prevista vs realizada
      let receitaPrevista = 0;
      let receitaRealizada = 0;
      
      osData.forEach(os => {
        if (os.valor_final) {
          receitaPrevista += Number(os.valor_final);
        }
        if (os.pagamentos) {
          os.pagamentos.forEach((pag: any) => {
            if (pag.status === 'pago') {
              receitaRealizada += Number(pag.valor);
            }
          });
        }
      });

      // Rentabilidade por tipo de serviço
      const tiposRentabilidade: any = {};
      osData.forEach(os => {
        const tipo = os.tipo_servico || 'servico_novo';
        if (!tiposRentabilidade[tipo]) {
          tiposRentabilidade[tipo] = { tipo, total: 0, count: 0 };
        }
        if (os.valor_final) {
          tiposRentabilidade[tipo].total += Number(os.valor_final);
          tiposRentabilidade[tipo].count += 1;
        }
      });

      const rentabilidadePorTipo = Object.values(tiposRentabilidade).map((t: any) => ({
        tipo: t.tipo === 'garantia' ? 'Garantia' : 
              t.tipo === 'manutencao_preventiva' ? 'Manutenção' : 'Novo',
        receita: t.total,
        media: Math.round(t.total / t.count),
        quantidade: t.count
      }));

      // Previsão de demanda (últimos 12 meses)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const demandaMensal = osData
        .filter(os => new Date(os.created_at) >= twelveMonthsAgo)
        .reduce((acc: any[], os) => {
          const month = new Date(os.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
          const existing = acc.find(item => item.mes === month);
          
          if (existing) {
            existing.quantidade++;
            existing.receita += Number(os.valor_final || 0);
          } else {
            acc.push({
              mes: month,
              quantidade: 1,
              receita: Number(os.valor_final || 0)
            });
          }
          return acc;
        }, []);

      // Calcular tendência (média móvel simples)
      const previsaoDemanda = demandaMensal.map((item, index) => {
        if (index < 2) return { ...item, tendencia: item.quantidade };
        
        const ultimos3 = demandaMensal.slice(Math.max(0, index - 2), index + 1);
        const media = ultimos3.reduce((sum, i) => sum + i.quantidade, 0) / ultimos3.length;
        
        return { ...item, tendencia: Math.round(media) };
      });

      // Tendência de receita
      const tendenciaReceita = demandaMensal.map(item => ({
        mes: item.mes,
        receita: item.receita,
        previsto: item.receita * 1.1 // Projeção de 10% de crescimento
      }));

      setData({
        receitaPrevista,
        receitaRealizada,
        rentabilidadePorTipo,
        previsaoDemanda: previsaoDemanda.slice(-6),
        tendenciaReceita: tendenciaReceita.slice(-6)
      });
    } catch (error) {
      console.error("Erro ao carregar BI:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando dados de BI...</p>
      </div>
    );
  }

  if (!data) return null;

  const taxaRealizacao = data.receitaPrevista > 0 
    ? ((data.receitaRealizada / data.receitaPrevista) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Business Intelligence</h2>
        <p className="text-muted-foreground">Análises avançadas e previsões de demanda</p>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.receitaPrevista.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Total de contratos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Realizada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {data.receitaRealizada.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Pagamentos recebidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Realização</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaRealizacao}%</div>
            <p className="text-xs text-muted-foreground">
              {Number(taxaRealizacao) >= 80 ? "Excelente" : "Precisa atenção"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {(data.receitaPrevista - data.receitaRealizada).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">A receber</p>
          </CardContent>
        </Card>
      </div>

      {/* Rentabilidade por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidade por Tipo de Serviço</CardTitle>
          <CardDescription>Análise de receita e volume por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.rentabilidadePorTipo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="receita" fill="#8884d8" name="Receita Total (R$)" />
              <Bar yAxisId="right" dataKey="quantidade" fill="#82ca9d" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Previsão de Demanda */}
        <Card>
          <CardHeader>
            <CardTitle>Previsão de Demanda</CardTitle>
            <CardDescription>Análise de tendência baseada em histórico</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.previsaoDemanda}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quantidade" stroke="#8884d8" name="Real" strokeWidth={2} />
                <Line type="monotone" dataKey="tendencia" stroke="#82ca9d" name="Tendência" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendência de Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Receita</CardTitle>
            <CardDescription>Real vs Projetado (10% crescimento)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.tendenciaReceita}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="receita" stackId="1" stroke="#8884d8" fill="#8884d8" name="Receita Real" />
                <Area type="monotone" dataKey="previsto" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Projeção" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
