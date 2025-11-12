import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ManualSection {
  id: string;
  secao: string;
  subsecao: string | null;
  ordem: number;
  titulo: string;
  conteudo: string;
  tipo_conteudo: string;
  visivel: boolean;
  imagens?: string[];
}

interface ExportarManualPDFProps {
  sections: ManualSection[];
  empreendimentoNome: string;
}

export const ExportarManualPDF = ({ sections, empreendimentoNome }: ExportarManualPDFProps) => {
  const generatePDF = async () => {
    try {
      toast.info("Gerando PDF...");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Função para adicionar nova página se necessário
      const checkAddPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // CAPA
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("MANUAL DO PROPRIETÁRIO", pageWidth / 2, 80, { align: "center" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text(empreendimentoNome, pageWidth / 2, 100, { align: "center" });

      doc.setFontSize(10);
      const dataAtual = new Date().toLocaleDateString("pt-BR");
      doc.text(`Elaborado em: ${dataAtual}`, pageWidth / 2, 120, { align: "center" });

      doc.setFontSize(8);
      doc.text("Conforme ABNT NBR 14037", pageWidth / 2, pageHeight - 40, { align: "center" });

      // ÍNDICE
      doc.addPage();
      yPosition = margin;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ÍNDICE", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const visibleSections = sections.filter((s) => s.visivel).sort((a, b) => {
        if (a.secao !== b.secao) return a.secao.localeCompare(b.secao);
        return a.ordem - b.ordem;
      });

      const groupedSections: Record<string, ManualSection[]> = {};
      visibleSections.forEach((section) => {
        if (!groupedSections[section.secao]) {
          groupedSections[section.secao] = [];
        }
        groupedSections[section.secao].push(section);
      });

      let pageNumber = 3; // Começa após capa e índice
      const sectionPages: Record<string, number> = {};

      Object.keys(groupedSections).sort().forEach((secaoKey) => {
        checkAddPage(10);
        
        doc.setFont("helvetica", "bold");
        doc.text(`Seção ${secaoKey}`, margin, yPosition);
        sectionPages[secaoKey] = pageNumber;
        
        const dots = ".".repeat(Math.floor((contentWidth - 40) / 2));
        doc.text(dots + " " + pageNumber, margin + 40, yPosition);
        
        yPosition += 8;
        pageNumber++;

        groupedSections[secaoKey].forEach((section) => {
          checkAddPage(6);
          doc.setFont("helvetica", "normal");
          const subsecaoText = section.subsecao ? `${section.subsecao} - ` : "";
          const tituloCompleto = `${subsecaoText}${section.titulo}`;
          const truncated = tituloCompleto.length > 60 ? tituloCompleto.substring(0, 57) + "..." : tituloCompleto;
          doc.text(`  ${truncated}`, margin + 5, yPosition);
          yPosition += 6;
        });
        
        yPosition += 4;
      });

      // CONTEÚDO
      Object.keys(groupedSections).sort().forEach((secaoKey) => {
        doc.addPage();
        yPosition = margin;

        // Título da seção
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Seção ${secaoKey}`, margin, yPosition);
        yPosition += 12;

        groupedSections[secaoKey].forEach((section) => {
          checkAddPage(20);

          // Título da subseção
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          const subsecaoText = section.subsecao ? `${section.subsecao} - ` : "";
          doc.text(`${subsecaoText}${section.titulo}`, margin, yPosition);
          yPosition += 8;

          // Conteúdo
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");

          // Remover HTML básico
          let conteudoLimpo = section.conteudo
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<p>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();

          const linhas = doc.splitTextToSize(conteudoLimpo, contentWidth);
          
          linhas.forEach((linha: string) => {
            checkAddPage(7);
            doc.text(linha, margin, yPosition);
            yPosition += 6;
          });

          yPosition += 8;
        });
      });

      // Rodapé com numeração em todas as páginas (exceto capa)
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Página ${i - 1} de ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      // Salvar PDF
      const nomeArquivo = `Manual_Proprietario_${empreendimentoNome.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(nomeArquivo);

      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <Button onClick={generatePDF} variant="outline">
      <FileDown className="w-4 h-4 mr-2" />
      Exportar PDF
    </Button>
  );
};
