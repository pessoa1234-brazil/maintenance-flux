import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wrench, Shield, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ModalAgendamento } from "./ModalAgendamento";

interface ManutencaoAgendada {
  id: string;
  data: Date;
  titulo: string;
  tipo: "manutencao_preventiva" | "garantia" | "alerta";
  descricao: string;
  sistema_predial?: string;
}

export const CalendarioManutencao = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [manutencoes, setManutencoes] = useState<ManutencaoAgendada[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModalAgendamento, setShowModalAgendamento] = useState(false);

  useEffect(() => {
    carregarManutencoes();
  }, []);

  const carregarManutencoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id) return;

      // Carregar empreendimento
      const { data: empreendimento } = await supabase
        .from("empreendimentos")
        .select("data_entrega, data_habite_se")
        .eq("id", profile.empreendimento_id)
        .single();

      if (!empreendimento) return;

      // Carregar garantias NBR 17170
      const { data: garantias } = await supabase
        .from("garantias_nbr_17170")
        .select("*");

      if (!garantias) return;

      // Carregar agendamentos existentes
      const { data: agendamentos } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("solicitante_id", user.id)
        .gte("data_inicio", new Date().toISOString());

      const dataBase = new Date(empreendimento.data_habite_se || empreendimento.data_entrega);
      const hoje = new Date();
      const manutencoesList: ManutencaoAgendada[] = [];

      // Adicionar agendamentos existentes
      if (agendamentos) {
        agendamentos.forEach((agendamento) => {
          manutencoesList.push({
            id: agendamento.id,
            data: new Date(agendamento.data_inicio),
            titulo: agendamento.titulo,
            tipo: "manutencao_preventiva",
            descricao: agendamento.descricao || "",
          });
        });
      }

      // Gerar alertas de garantias
      garantias.forEach((garantia) => {
        const dataExpiracao = new Date(dataBase);
        dataExpiracao.setFullYear(dataExpiracao.getFullYear() + garantia.prazo_anos);

        // Alerta 90 dias antes
        const dataAlerta = new Date(dataExpiracao);
        dataAlerta.setDate(dataAlerta.getDate() - 90);

        if (dataAlerta > hoje) {
          manutencoesList.push({
            id: `garantia-${garantia.id}`,
            data: dataAlerta,
            titulo: `Alerta: Garantia expira em 90 dias`,
            tipo: "alerta",
            descricao: `Garantia ${garantia.tipo_garantia} do sistema ${garantia.sistema} expira em ${dataExpiracao.toLocaleDateString()}`,
            sistema_predial: garantia.sistema,
          });
        }

        // Manutenções preventivas NBR 5674 (simplificado)
        // A cada 6 meses para sistemas críticos
        if (garantia.tipo_garantia === "legal") {
          let proximaManutencao = new Date(dataBase);
          while (proximaManutencao < dataExpiracao) {
            proximaManutencao.setMonth(proximaManutencao.getMonth() + 6);
            if (proximaManutencao > hoje && proximaManutencao < dataExpiracao) {
              manutencoesList.push({
                id: `manutencao-${garantia.id}-${proximaManutencao.getTime()}`,
                data: new Date(proximaManutencao),
                titulo: `Manutenção Preventiva - ${garantia.sistema}`,
                tipo: "manutencao_preventiva",
                descricao: `Manutenção preventiva obrigatória conforme NBR 5674 para preservar garantia`,
                sistema_predial: garantia.sistema,
              });
            }
          }
        }
      });

      setManutencoes(manutencoesList);
    } catch (error) {
      console.error("Erro ao carregar manutenções:", error);
      toast.error("Erro ao carregar calendário de manutenções");
    } finally {
      setLoading(false);
    }
  };

  const manutencoesDoDia = manutencoes.filter(
    (m) =>
      selectedDate &&
      m.data.toDateString() === selectedDate.toDateString()
  );

  const diasComManutencao = manutencoes.map((m) => m.data);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleNovoAgendamento = () => {
    if (!selectedDate) {
      toast.error("Selecione uma data no calendário");
      return;
    }
    setShowModalAgendamento(true);
  };

  const handleAgendamentoSuccess = () => {
    carregarManutencoes();
  };

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case "manutencao_preventiva":
        return <Wrench className="h-4 w-4" />;
      case "garantia":
        return <Shield className="h-4 w-4" />;
      case "alerta":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "manutencao_preventiva":
        return "default";
      case "garantia":
        return "secondary";
      case "alerta":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando calendário...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Manutenções</CardTitle>
          <CardDescription>
            Prazos conforme NBR 17170:2022 e NBR 5674
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
            modifiers={{
              manutencao: diasComManutencao,
            }}
            modifiersStyles={{
              manutencao: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary) / 0.2)",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedDate ? selectedDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "Selecione uma data"}
              </CardTitle>
              <CardDescription>
                {manutencoesDoDia.length} atividade(s) programada(s)
              </CardDescription>
            </div>
            <Button onClick={handleNovoAgendamento} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {manutencoesDoDia.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma manutenção programada para esta data
              </p>
            ) : (
              <div className="space-y-4">
                {manutencoesDoDia.map((manutencao) => (
                  <Card key={manutencao.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getIconByType(manutencao.tipo)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">
                              {manutencao.titulo}
                            </h4>
                            <Badge variant={getBadgeVariant(manutencao.tipo)}>
                              {manutencao.tipo === "manutencao_preventiva"
                                ? "Preventiva"
                                : manutencao.tipo === "garantia"
                                ? "Garantia"
                                : "Alerta"}
                            </Badge>
                          </div>
                          {manutencao.sistema_predial && (
                            <p className="text-xs text-muted-foreground">
                              Sistema: {manutencao.sistema_predial}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {manutencao.descricao}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <ModalAgendamento
        isOpen={showModalAgendamento}
        onClose={() => setShowModalAgendamento(false)}
        dataSelecionada={selectedDate || new Date()}
        onSuccess={handleAgendamentoSuccess}
      />
    </div>
  );
};