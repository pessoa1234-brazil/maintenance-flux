import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, CheckCircle2, XCircle, AlertTriangle, Calendar, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from "jspdf";

interface DadosRelatorio {
  empreendimento: any;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  manutencoes: {
    total: number;
    preventivas: number;
    garantias: number;
    novos: number;
    concluidas: number;
    atrasadas: number;
  };
  garantias_status: {
    preservadas: boolean;
    motivo?: string;
  };
  sistemas_manutencao: any[];
}

export const RelatorioConformidade = () => {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil com empreendimento
      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id) {
        toast.error("Você precisa estar vinculado a um empreendimento");
        return;
      }

      // Buscar dados do empreendimento
      const { data: empreendimento, error: empError } = await supabase
        .from("empreendimentos")
        .select("*")
        .eq("id", profile.empreendimento_id)
        .single();

      if (empError) throw empError;

      // Período dos últimos 6 meses
      const hoje = new Date();
      const seisMesesAtras = new Date(hoje);
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

      // Buscar OS do período
      const { data: ordensServico, error: osError } = await supabase
        .from("ordens_servico")
        .select("*, unidades!inner(empreendimento_id)")
        .eq("unidades.empreendimento_id", profile.empreendimento_id)
        .gte("created_at", seisMesesAtras.toISOString());

      if (osError) throw osError;

      const manutencoes = {
        total: ordensServico?.length || 0,
        preventivas: ordensServico?.filter((os) => os.tipo_servico === "manutencao_preventiva").length || 0,
        garantias: ordensServico?.filter((os) => os.tipo_servico === "garantia").length || 0,
        novos: ordensServico?.filter((os) => os.tipo_servico === "servico_novo").length || 0,
        concluidas: ordensServico?.filter((os) => os.status === "CONCLUIDA").length || 0,
        atrasadas: ordensServico?.filter((os) => {
          if (!os.data_limite_atendimento) return false;
          return new Date(os.data_limite_atendimento) < hoje && os.status !== "CONCLUIDA";
        }).length || 0,
      };

      // Verificar status de garantias
      let garantias_status = {
        preservadas: true,
        motivo: undefined as string | undefined,
      };

      // Verificar se há manutenções preventivas nos últimos 6 meses
      if (manutencoes.preventivas === 0) {
        garantias_status = {
          preservadas: false,
          motivo: "Nenhuma manutenção preventiva realizada nos últimos 6 meses",
        };
      }

      // Verificar se há serviços atrasados
      if (manutencoes.atrasadas > 0) {
        garantias_status = {
          preservadas: false,
          motivo: `Existem ${manutencoes.atrasadas} serviços atrasados`,
        };
      }

      // Sistemas que receberam manutenção
      const sistemas_manutencao = ordensServico
        ?.filter((os) => os.sistema_predial && os.status === "CONCLUIDA")
        .reduce((acc: any[], os) => {
          const existing = acc.find((s) => s.sistema === os.sistema_predial);
          if (existing) {
            existing.quantidade++;
          } else {
            acc.push({ sistema: os.sistema_predial, quantidade: 1 });
          }
          return acc;
        }, []) || [];

      setDados({
        empreendimento,
        periodo: {
          inicio: seisMesesAtras,
          fim: hoje,
        },
        manutencoes,
        garantias_status,
        sistemas_manutencao,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = async () => {
    if (!dados) {
      toast.error("Nenhum relatório carregado");
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatorio de Conformidade NBR 5674", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(dados.empreendimento.nome, pageWidth / 2, yPos, { align: "center" });
      yPos += 6;
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, yPos, { align: "center" });

      yPos += 15;

      // Status
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Status de Conformidade", 15, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const status = dados.garantias_status.preservadas
        ? "CONFORME - Garantias preservadas"
        : `NAO CONFORME - ${dados.garantias_status.motivo}`;
      doc.text(status, 15, yPos);
      yPos += 12;

      // Resumo
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo do Periodo", 15, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const resumo = [
        `Total de Manutencoes: ${dados.manutencoes.total}`,
        `Manutencoes Preventivas: ${dados.manutencoes.preventivas}`,
        `Garantias Acionadas: ${dados.manutencoes.garantias}`,
        `Servicos Novos: ${dados.manutencoes.novos}`,
        `Concluidas: ${dados.manutencoes.concluidas}`,
        `Atrasadas: ${dados.manutencoes.atrasadas}`,
      ];

      resumo.forEach((linha) => {
        doc.text(linha, 15, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Sistemas
      if (dados.sistemas_manutencao.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Sistemas com Manutencao", 15, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        dados.sistemas_manutencao.forEach((sistema) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${sistema.sistema}: ${sistema.quantidade} manutencoes`, 15, yPos);
          yPos += 5;
        });
      }

      doc.save(`Relatorio_NBR5674_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Não foi possível carregar os dados do relatório
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Relatório de Conformidade NBR 5674</h2>
          <p className="text-muted-foreground">
            {dados.empreendimento.nome}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Período: {dados.periodo.inicio.toLocaleDateString("pt-BR")} a{" "}
            {dados.periodo.fim.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button onClick={gerarPDF} disabled={generating} className="gap-2">
          <Download className="h-4 w-4" />
          {generating ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {!dados.garantias_status.preservadas && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-1">⚠️ Garantias podem estar comprometidas!</p>
            <p className="text-sm">{dados.garantias_status.motivo}</p>
          </AlertDescription>
        </Alert>
      )}

      {dados.garantias_status.preservadas && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-1">✅ Garantias preservadas</p>
            <p className="text-sm">
              O empreendimento está em conformidade com a NBR 5674. Todas as manutenções
              preventivas estão em dia.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total de Manutenções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dados.manutencoes.total}</div>
            <p className="text-sm text-muted-foreground">Último semestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manutenções Preventivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {dados.manutencoes.preventivas}
            </div>
            <p className="text-sm text-muted-foreground">NBR 5674</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {dados.manutencoes.total > 0
                ? Math.round((dados.manutencoes.concluidas / dados.manutencoes.total) * 100)
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">
              {dados.manutencoes.concluidas} de {dados.manutencoes.total}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Tipo de Serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">Manutenções Preventivas</p>
              <p className="text-sm text-muted-foreground">Preservação de garantias</p>
            </div>
            <Badge variant="secondary">{dados.manutencoes.preventivas}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">Garantias</p>
              <p className="text-sm text-muted-foreground">Acionamentos NBR 17170</p>
            </div>
            <Badge variant="outline">{dados.manutencoes.garantias}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">Serviços Novos</p>
              <p className="text-sm text-muted-foreground">Fora do escopo de garantia</p>
            </div>
            <Badge variant="outline">{dados.manutencoes.novos}</Badge>
          </div>

          {dados.manutencoes.atrasadas > 0 && (
            <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive">
              <div>
                <p className="font-semibold text-destructive">Serviços Atrasados</p>
                <p className="text-sm text-muted-foreground">Compromete garantias</p>
              </div>
              <Badge variant="destructive">{dados.manutencoes.atrasadas}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {dados.sistemas_manutencao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sistemas que Receberam Manutenção</CardTitle>
            <CardDescription>Conformidade por sistema predial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dados.sistemas_manutencao.map((sistema, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="font-medium">{sistema.sistema}</span>
                  <Badge variant="secondary">{sistema.quantidade} manutenções</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dados.manutencoes.preventivas === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma manutenção preventiva realizada. Agende manutenções para preservar garantias.
              </AlertDescription>
            </Alert>
          )}

          {dados.manutencoes.atrasadas > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Conclua os {dados.manutencoes.atrasadas} serviços atrasados o quanto antes.
              </AlertDescription>
            </Alert>
          )}

          {dados.garantias_status.preservadas && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Continue realizando manutenções preventivas regularmente conforme NBR 5674.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
