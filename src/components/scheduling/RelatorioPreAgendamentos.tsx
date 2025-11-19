import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const RelatorioPreAgendamentos = () => {
  const [loading, setLoading] = useState(false);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("solicitante_id", user.id)
      .eq("tipo", "manutencao_preventiva")
      .order("data_inicio", { ascending: true });

    if (error) throw error;
    return agendamentos || [];
  };

  const agruparPorSistemaEPeriodicidade = (agendamentos: any[]) => {
    const grupos: Record<string, Record<string, any[]>> = {};

    agendamentos.forEach(agendamento => {
      // Extrair sistema predial e periodicidade da descrição
      const descricao = agendamento.descricao || "";
      const matchSistema = descricao.match(/^([^-]+)/);
      const matchPeriodicidade = descricao.match(/Periodicidade:\s*(\w+)/i);

      const sistema = matchSistema ? matchSistema[1].trim() : "Não especificado";
      const periodicidade = matchPeriodicidade ? matchPeriodicidade[1] : "Não especificado";

      if (!grupos[sistema]) {
        grupos[sistema] = {};
      }
      if (!grupos[sistema][periodicidade]) {
        grupos[sistema][periodicidade] = [];
      }
      grupos[sistema][periodicidade].push(agendamento);
    });

    return grupos;
  };

  const exportarPDF = async () => {
    setLoading(true);
    try {
      const agendamentos = await carregarDados();
      const grupos = agruparPorSistemaEPeriodicidade(agendamentos);

      const doc = new jsPDF();
      let yPos = 20;

      // Título
      doc.setFontSize(16);
      doc.text("Relatório de Pré-Agendamentos", 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, yPos);
      doc.text(`Total de agendamentos: ${agendamentos.length}`, 14, yPos + 5);
      yPos += 15;

      // Processar cada sistema
      Object.entries(grupos).forEach(([sistema, periodicidades]) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text(`Sistema: ${sistema}`, 14, yPos);
        yPos += 7;

        Object.entries(periodicidades).forEach(([periodicidade, items]) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(10);
          doc.setFont(undefined, "normal");
          doc.text(`  Periodicidade: ${periodicidade} (${items.length} agendamentos)`, 14, yPos);
          yPos += 5;

          const tableData = items.map(item => [
            item.titulo,
            new Date(item.data_inicio).toLocaleDateString("pt-BR"),
            item.status
          ]);

          doc.autoTable({
            startY: yPos,
            head: [["Título", "Data", "Status"]],
            body: tableData,
            margin: { left: 20 },
            theme: "grid",
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8 }
          });

          yPos = (doc as any).lastAutoTable.finalY + 7;
        });

        yPos += 5;
      });

      doc.save(`pre-agendamentos-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    setLoading(true);
    try {
      const agendamentos = await carregarDados();
      const grupos = agruparPorSistemaEPeriodicidade(agendamentos);

      const workbook = XLSX.utils.book_new();

      // Criar planilha resumo
      const resumoData = [
        ["Relatório de Pré-Agendamentos"],
        [`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`],
        [`Total de agendamentos: ${agendamentos.length}`],
        [],
        ["Sistema", "Periodicidade", "Quantidade"]
      ];

      Object.entries(grupos).forEach(([sistema, periodicidades]) => {
        Object.entries(periodicidades).forEach(([periodicidade, items]) => {
          resumoData.push([sistema, periodicidade, items.length.toString()]);
        });
      });

      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

      // Criar planilha detalhada
      const detalhadoData = [
        ["Sistema", "Periodicidade", "Título", "Data Início", "Status", "Descrição"]
      ];

      Object.entries(grupos).forEach(([sistema, periodicidades]) => {
        Object.entries(periodicidades).forEach(([periodicidade, items]) => {
          items.forEach(item => {
            detalhadoData.push([
              sistema,
              periodicidade,
              item.titulo,
              new Date(item.data_inicio).toLocaleDateString("pt-BR"),
              item.status,
              item.descricao || ""
            ]);
          });
        });
      });

      const wsDetalhado = XLSX.utils.aoa_to_sheet(detalhadoData);
      XLSX.utils.book_append_sheet(workbook, wsDetalhado, "Detalhado");

      XLSX.writeFile(workbook, `pre-agendamentos-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Relatório Excel gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      toast.error("Erro ao gerar relatório Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>Relatório de Pré-Agendamentos</CardTitle>
        </div>
        <CardDescription>
          Exporte todos os pré-agendamentos gerados, agrupados por sistema predial e periodicidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={exportarPDF}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button
            onClick={exportarExcel}
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
