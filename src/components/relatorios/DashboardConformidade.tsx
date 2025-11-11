import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ManutencaoExtraida {
  id: string;
  sistema_predial?: string;
  atividade?: string;
  periodicidade?: string;
  chave?: string;
  valor?: string;
  subcategoria?: string;
}

interface Agendamento {
  id: string;
  titulo: string;
  status: string;
  data_inicio: string;
}

export const DashboardConformidade = () => {
  const [loading, setLoading] = useState(true);
  const [manutencoesProgramadas, setManutencoesProgramadas] = useState<ManutencaoExtraida[]>([]);
  const [agendamentosRealizados, setAgendamentosRealizados] = useState<Agendamento[]>([]);
  const [empreendimento, setEmpreendimento] = useState<any>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id) {
        toast.error("Nenhum empreendimento vinculado");
        return;
      }

      // Carregar empreendimento
      const { data: emp } = await supabase
        .from("empreendimentos")
        .select("*")
        .eq("id", profile.empreendimento_id)
        .single();

      setEmpreendimento(emp);

      // Carregar manutenções programadas extraídas dos manuais
      const { data: manutencoes } = await supabase
        .from("manual_dados_estruturados")
        .select("*")
        .eq("empreendimento_id", profile.empreendimento_id)
        .eq("categoria", "manutencao");

      // Mapear dados estruturados para formato de manutenção
      const manutencoesFormatadas = (manutencoes || []).map((m: any) => ({
        id: m.id,
        sistema_predial: m.subcategoria || m.chave || "Sistema Geral",
        atividade: m.valor || m.chave,
        periodicidade: m.unidade || "Conforme NBR",
      }));
      
      setManutencoesProgramadas(manutencoesFormatadas);

      // Carregar agendamentos concluídos
      const { data: agendamentos } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("solicitante_id", user.id)
        .eq("status", "concluido");

      setAgendamentosRealizados(agendamentos || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados de conformidade");
    } finally {
      setLoading(false);
    }
  };

  const calcularConformidade = () => {
    if (manutencoesProgramadas.length === 0) return 0;
    return Math.round((agendamentosRealizados.length / manutencoesProgramadas.length) * 100);
  };

  const calcularPorSistema = () => {
    const sistemas = new Map<string, { programadas: number; realizadas: number }>();

    manutencoesProgramadas.forEach((m) => {
      const sistema = m.sistema_predial || "Outros";
      if (!sistemas.has(sistema)) {
        sistemas.set(sistema, { programadas: 0, realizadas: 0 });
      }
      sistemas.get(sistema)!.programadas++;
    });

    agendamentosRealizados.forEach((a) => {
      // Simplificação: assumir que título contém sistema
      const sistema = "Sistema Geral"; // Idealmente mapear do título ou adicionar campo
      if (!sistemas.has(sistema)) {
        sistemas.set(sistema, { programadas: 0, realizadas: 0 });
      }
      sistemas.get(sistema)!.realizadas++;
    });

    return Array.from(sistemas.entries()).map(([nome, dados]) => ({
      sistema: nome,
      programadas: dados.programadas,
      realizadas: dados.realizadas,
      percentual: dados.programadas > 0 ? Math.round((dados.realizadas / dados.programadas) * 100) : 0,
    }));
  };

  const calcularPorPeriodicidade = () => {
    const periodicidades = new Map<string, number>();

    manutencoesProgramadas.forEach((m) => {
      const periodo = m.periodicidade || "Não especificado";
      periodicidades.set(periodo, (periodicidades.get(periodo) || 0) + 1);
    });

    return Array.from(periodicidades.entries()).map(([nome, valor]) => ({
      name: nome,
      value: valor,
    }));
  };

  const dadosPorSistema = calcularPorSistema();
  const dadosPorPeriodicidade = calcularPorPeriodicidade();
  const percentualConformidade = calcularConformidade();

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conformidade Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentualConformidade}%</div>
            <Progress value={percentualConformidade} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {agendamentosRealizados.length} de {manutencoesProgramadas.length} atividades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Manutenções Programadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{manutencoesProgramadas.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Total de atividades NBR 5674</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentosRealizados.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Manutenções concluídas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aderência por Sistema Predial</CardTitle>
            <CardDescription>Manutenções realizadas vs programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorSistema}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sistema" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="programadas" fill="hsl(var(--chart-1))" name="Programadas" />
                <Bar dataKey="realizadas" fill="hsl(var(--chart-2))" name="Realizadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Periodicidade</CardTitle>
            <CardDescription>Frequência das manutenções programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPorPeriodicidade}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="hsl(var(--chart-1))"
                  dataKey="value"
                >
                  {dadosPorPeriodicidade.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {percentualConformidade < 70 && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Alerta de Conformidade</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              A taxa de conformidade está abaixo de 70%. É recomendável realizar as manutenções
              programadas conforme NBR 5674 para preservar as garantias NBR 17170:2022.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
