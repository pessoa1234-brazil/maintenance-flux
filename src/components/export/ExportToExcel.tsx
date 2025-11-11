import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExportToExcelProps {
  startDate?: Date;
  endDate?: Date;
}

export const ExportToExcel = ({ startDate, endDate }: ExportToExcelProps) => {
  const handleExport = async () => {
    try {
      toast.info("Gerando relatório...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar dados
      let query = supabase
        .from("ordens_servico")
        .select(`
          *,
          profiles!ordens_servico_solicitante_id_fkey(full_name),
          unidades(numero, bloco, empreendimentos(nome)),
          pagamentos(*)
        `);

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data: osData } = await query;

      if (!osData || osData.length === 0) {
        toast.error("Nenhum dado encontrado para o período selecionado");
        return;
      }

      // Preparar dados para o Excel
      const dadosOS = osData.map((os: any) => ({
        "ID": os.id.substring(0, 8),
        "Título": os.titulo,
        "Status": os.status,
        "Tipo": os.tipo_servico || "servico_novo",
        "Empreendimento": os.unidades?.empreendimentos?.nome || "N/A",
        "Unidade": `${os.unidades?.bloco || ""} ${os.unidades?.numero || ""}`,
        "Solicitante": os.profiles?.full_name || "N/A",
        "Data Solicitação": new Date(os.data_solicitacao).toLocaleDateString("pt-BR"),
        "Data Conclusão": os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString("pt-BR") : "Em andamento",
        "Valor": os.valor_final ? `R$ ${Number(os.valor_final).toLocaleString("pt-BR")}` : "N/A",
        "Prazo (dias)": os.prazo_atendimento_dias || "N/A",
        "Tempo Resposta (h)": os.tempo_resposta_horas || "N/A",
        "Tempo Conclusão (dias)": os.tempo_conclusao_dias || "N/A"
      }));

      // Calcular estatísticas
      const stats = {
        "Total de OS": osData.length,
        "Concluídas": osData.filter(os => os.status === "CONCLUIDA").length,
        "Em Andamento": osData.filter(os => os.status === "EM_ANDAMENTO").length,
        "Aguardando": osData.filter(os => os.status === "A_FAZER").length,
        "Valor Total": osData.reduce((sum, os) => sum + Number(os.valor_final || 0), 0),
        "Tempo Médio Conclusão": Math.round(
          osData.filter(os => os.tempo_conclusao_dias).reduce((sum, os) => sum + os.tempo_conclusao_dias, 0) /
          osData.filter(os => os.tempo_conclusao_dias).length || 0
        )
      };

      const dadosStats = [
        { "Métrica": "Total de OS", "Valor": stats["Total de OS"] },
        { "Métrica": "Concluídas", "Valor": stats["Concluídas"] },
        { "Métrica": "Em Andamento", "Valor": stats["Em Andamento"] },
        { "Métrica": "Aguardando", "Valor": stats["Aguardando"] },
        { "Métrica": "Valor Total", "Valor": `R$ ${stats["Valor Total"].toLocaleString("pt-BR")}` },
        { "Métrica": "Tempo Médio Conclusão", "Valor": `${stats["Tempo Médio Conclusão"]} dias` }
      ];

      // Criar workbook
      const wb = XLSX.utils.book_new();

      // Adicionar sheet de estatísticas
      const wsStats = XLSX.utils.json_to_sheet(dadosStats);
      XLSX.utils.book_append_sheet(wb, wsStats, "Estatísticas");

      // Adicionar sheet de OS
      const wsOS = XLSX.utils.json_to_sheet(dadosOS);
      XLSX.utils.book_append_sheet(wb, wsOS, "Ordens de Serviço");

      // Exportar
      const fileName = `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <FileSpreadsheet className="h-4 w-4" />
      Exportar para Excel
    </Button>
  );
};
