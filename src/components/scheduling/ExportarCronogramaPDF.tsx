import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface ManutencaoExtraida {
  id: string;
  sistema_predial: string;
  atividade: string;
  periodicidade: string;
  descricao?: string;
}

interface ExportarCronogramaPDFProps {
  manutencoes: ManutencaoExtraida[];
  empreendimento: {
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
  };
}

export const ExportarCronogramaPDF = ({ manutencoes, empreendimento }: ExportarCronogramaPDFProps) => {
  const gerarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header com logo placeholder e título
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CRONOGRAMA DE MANUTENÇÃO", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Conforme NBR 5674 - Manutenção de Edificações", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Dados do empreendimento
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO EMPREENDIMENTO", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${empreendimento.nome}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Endereço: ${empreendimento.endereco}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Cidade/Estado: ${empreendimento.cidade} - ${empreendimento.estado}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`, margin, yPosition);
      yPosition += 12;

      // Separador
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Tabela de manutenções
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CRONOGRAMA DE ATIVIDADES", margin, yPosition);
      yPosition += 10;

      // Headers da tabela
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const colWidths = {
        sistema: 50,
        atividade: 70,
        periodicidade: 40,
      };

      doc.text("Sistema Predial", margin, yPosition);
      doc.text("Atividade", margin + colWidths.sistema, yPosition);
      doc.text("Periodicidade", margin + colWidths.sistema + colWidths.atividade, yPosition);
      yPosition += 2;

      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Agrupar por sistema predial
      const agrupado = manutencoes.reduce((acc, m) => {
        const sistema = m.sistema_predial || "Outros";
        if (!acc[sistema]) acc[sistema] = [];
        acc[sistema].push(m);
        return acc;
      }, {} as Record<string, ManutencaoExtraida[]>);

      doc.setFont("helvetica", "normal");

      Object.entries(agrupado).forEach(([sistema, items]) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        // Sistema predial
        doc.setFont("helvetica", "bold");
        doc.text(sistema, margin, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        items.forEach((item) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          const atividade = doc.splitTextToSize(item.atividade || "", colWidths.atividade - 5);
          const atividadeHeight = atividade.length * 4;

          doc.text(atividade, margin + colWidths.sistema, yPosition);
          doc.text(item.periodicidade || "-", margin + colWidths.sistema + colWidths.atividade, yPosition);

          yPosition += Math.max(atividadeHeight, 5) + 2;
        });

        yPosition += 5;
      });

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(
          "Documento gerado automaticamente - Manutenção360",
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
      }

      // Salvar
      const fileName = `cronograma_manutencao_${empreendimento.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <Button onClick={gerarPDF} variant="outline" className="gap-2">
      <FileDown className="h-4 w-4" />
      Exportar em PDF
    </Button>
  );
};
