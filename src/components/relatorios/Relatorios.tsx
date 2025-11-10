import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Database } from "@/types";
import { TrendingUp, Clock, DollarSign, Award } from "lucide-react";

interface RelatoriosProps {
  db: Database;
}

export const Relatorios = ({ db }: RelatoriosProps) => {
  // Dados mockados para gráficos de desempenho
  const desempenhoMensal = [
    { mes: "Jan", concluidas: 12, abertas: 8 },
    { mes: "Fev", concluidas: 15, abertas: 10 },
    { mes: "Mar", concluidas: 18, abertas: 7 },
    { mes: "Abr", concluidas: 14, abertas: 9 },
    { mes: "Mai", concluidas: 20, abertas: 6 },
    { mes: "Jun", concluidas: 16, abertas: 11 },
  ];

  // Dados de custos por período
  const custosPorPeriodo = [
    { periodo: "Jan", custo: 4500 },
    { periodo: "Fev", custo: 5200 },
    { periodo: "Mar", custo: 4800 },
    { periodo: "Abr", custo: 6100 },
    { periodo: "Mai", custo: 5500 },
    { periodo: "Jun", custo: 7200 },
  ];

  // Tempo médio de conclusão por tipo
  const tempoMedioConclusao = [
    { tipo: "Preventiva", dias: 2.5 },
    { tipo: "Corretiva", dias: 5.2 },
    { tipo: "Emergencial", dias: 1.8 },
    { tipo: "Revisão", dias: 3.5 },
  ];

  // Ranking de prestadores baseado em notas e número de serviços
  const rankingPrestadores = Object.values(db.usuarios)
    .map(usuario => ({
      nome: usuario.nome,
      nota: usuario.nota,
      servicos: Math.floor(Math.random() * 20) + 5, // Mock de número de serviços
      custoMedio: Math.floor(Math.random() * 1000) + 300,
    }))
    .sort((a, b) => b.nota - a.nota);

  // Distribuição de status de OS
  const statusDistribution = [
    { name: "A Fazer", value: Object.values(db.ordensServico).filter(os => os.status === "A_FAZER").length },
    { name: "Em Andamento", value: Object.values(db.ordensServico).filter(os => os.status === "EM_ANDAMENTO").length },
    { name: "Pendente", value: Object.values(db.ordensServico).filter(os => os.status === "PENDENTE_ORCAMENTO").length },
    { name: "Concluída", value: Object.values(db.ordensServico).filter(os => os.status === "CONCLUIDA").length },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Métricas resumidas
  const totalOS = Object.keys(db.ordensServico).length;
  const tempoMedioGeral = 3.8; // Mock
  const custoTotal = custosPorPeriodo.reduce((acc, curr) => acc + curr.custo, 0);
  const custoMedio = Math.round(custoTotal / custosPorPeriodo.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios e Analytics</h1>
        <p className="text-muted-foreground mt-2">Análise completa de desempenho e custos do condomínio</p>
      </div>

      {/* KPIs Resumidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalOS}</div>
            <p className="text-xs text-muted-foreground">Último semestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{tempoMedioGeral} dias</div>
            <p className="text-xs text-muted-foreground">Conclusão de OS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {custoMedio}</div>
            <p className="text-xs text-muted-foreground">Por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Prestador</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">⭐ {rankingPrestadores[0]?.nota}</div>
            <p className="text-xs text-muted-foreground">{rankingPrestadores[0]?.nome}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho Mensal de OS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={desempenhoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Bar dataKey="concluidas" fill="hsl(var(--chart-1))" name="Concluídas" />
                <Bar dataKey="abertas" fill="hsl(var(--chart-2))" name="Abertas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Custos por Período */}
        <Card>
          <CardHeader>
            <CardTitle>Custos por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={custosPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  formatter={(value) => `R$ ${value}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="custo" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Custo (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tempo Médio de Conclusão */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio de Conclusão por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tempoMedioConclusao} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="tipo" type="category" stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  formatter={(value) => `${value} dias`}
                />
                <Bar dataKey="dias" fill="hsl(var(--chart-4))" name="Dias" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status das OS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Prestadores */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Prestadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankingPrestadores.map((prestador, index) => (
              <div
                key={prestador.nome}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{prestador.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {prestador.servicos} serviços realizados
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                    ⭐ {prestador.nota}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Média: R$ {prestador.custoMedio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
